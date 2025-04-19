---
title: Bitemporal Thoughts
description: ""
date: 2023-07-23T00:00:00Z
tags: ["Architecture"]
---


**Disclaimer:** I'm posting this in ~70% done state, instead of letting it languish, as writing it was useful in guiding/changing my thoughts.

Kent Beck has a few [recent blog posts](https://tidyfirst.substack.com/p/when-did-it-happen-when-did-we-find) about bitemporal modeling, which I've read about/bookmarked a number of resources over the years:

* [Bitemporal modeling](https://en.wikipedia.org/wiki/Temporal_database) from Wikipedia
  * [Slowly changing dimension](https://en.wikipedia.org/wiki/Slowly_changing_dimension) also from Wikipedia but w/more details on various schemas
* [The Value of Bitemporality](https://www.juxt.pro/blog/value-of-bitemporality/), a 2019 blog post on a Clojure database, XTDB
  * An [HN Discussion](https://news.ycombinator.com/item?id=19710778) about this post
  * [pg_bitemporal](https://github.com/scalegenius/pg_bitemporal) a link from the HN discussion
* [Chronomodel](https://github.com/ifad/chronomodel) a Ruby project that uses PG schema inheritance & hooks into Rails/ActiveRecord
* And, of course, [Martin Fowler has an article](https://martinfowler.com/articles/bitemporal-history.html) as well

Kent's post in particular had a cute example of a `Perspective` abstraction, that allows establishing a view of the data at a given "effective time" and "posting time" (don't worry about these terms, we'll cover them soon):

```python
class Perspective:
  def __init__(self, effective, posting):
    self.effective = effective
    self.posting = posting
  def sees(self, other):
    return other.posting <= self.posting and other.effective <= self.effective
```

And this was neat enough that it made me think, should I be using something like this?

So, I thought about it, and decided...probably not. And this post is my notes/thoughts on how/why/why not I'm using bitemporal, or bitemporal-ish, approaches to achieve similar goals, in the schemas that I work on.

But, starting at the beginning, bitemporal fundamentally means "tracking two (bi) dimensions of time (temporal)"...which seems confusing, isn't there only a single dimension of time? So let's look into what these two dimensions are.

## System Time

I like to start with a super-simple entity, let's say `Author` with a `firstName`.

Also staying simple, let's store it in an `authors` table with a `first_name` column. And we build a CRUD UI on top of this `authors` table, that just `UPDATE`s the `first_name` column whenever the user hits "Save" in our UI.

Now, lets say a user files a bug, "why is my author's `firstName` 'Bob', but I swear it should be 'Fred'?" And we engineers, debugging their issue, would like to see how a given Author's `firstName` has, or has not, recently changed in the database (in the system).

Which brings us to our first bitemporal dimension: **system time**, also called transaction time (in the Juxt/XTDB post), or posting time (in Beck's post), or record time (in Fowler's post). Personally, I think "system time" is the best name, b/c I've worked on financial systems that have a `transactions` table and those "transaction dates" are part of the domain model itself (i.e. effective time, which we'll get to next) and not actually "the timestamp the database transaction committed", which is what we're referencing to with system time. It also seems like SQL:2011's `FOR SYSTEM_TIME AS OF ...` [syntax](https://en.wikipedia.org/wiki/SQL:2011) uses "system time" as well.

This ask is basically an audit trail, of which there are many approaches--history tables, history rows, all sorts of approaches that focus solely on "auditing". One of my current favorites is [CyanAudit](https://pgxn.org/dist/cyanaudit/), which uses triggers and a separate `cyanaudit.tbl_audit_event` table to record rows that track the `old_value` / `new_value` for every time the `first_name` column (or any column) in your database changes, and has a particularly useful `undo_transaction` function.

Regardless of the tactical approach, they all boil down to **what did the database look like as of timestamp X?**

And that's the first temporal dimension of bitemporal modeling. Simple enough: auditing/point-in-time history.

In my opinion, this 1st dimension is a "must have" for nearly every CRUD application, either for regulatory/auditing purposes (hence the name), or even just the **sanity of engineers debugging the system** behavior ("oh, we sent this email to 'the wrong address'...b/c that's actually what email was in the system at the time we sent the email, so this wasn't actually a bug").

So what's the next dimension?

## Effective Time

Effective time is the second dimension, and again staying super simple, let's track something like `Author.heightInInches`.

We could just add a `height_in_inches` column to the `authors` table, store `height_in_inches = 72` and we're done. Which is great, this is probably perfectly acceptable for most applications (or, more accurately, most attributes in most applications)--say a bookstore that just needs to know "this author is 6' tall".

But what if we're working on a pediatric healthcare system, and now we realize that "height" is not a static/immutable attribute of a child; the patient team needs to see, directly in our app, how the height of a child is trending over time. So maybe we store something like:

* The `patients` table has a `name` column
* The `patient_heights` table has `patient_id`, `measured_at`, and `value_in_inches` columns

Now we can see "the child was 4 feet tall on Jan 1 2018, then 5 feet fall on Jan 1 2020", etc. Concretely, our UI can pull back `SELECT * FROM patient_heights WHERE patient_id = 1` and graph the height over time.

This is "effective time"--_when_ **in the real world** did this new value become effective, become true, for the given entity, _even though_ the old value is still correct for the previous real-world time period.

I.e. while **system time fully replaces the old value with the new value**, insinuating the old value was fundamentally incorrect & now has no use (except for auditing), in **effective time the old value is still correct** for it's real-world time period, but now we have **a new value for a new time period**.

## When Does Effectiveness Matter?

We can model our new `heightInInches` attribute two different ways: just as a **single column**, or as a **range of values over time**.

Which should you use?

I assert that **it depends on what your users care about**.

Let's go back to the `Author.firstName` example: do we need to track the "effectiveness" of `firstName`?

If I'm Amazon.com, or a bookstore, or a payroll application, probably not--an author's first name, in those systems, can be a single, psuedo-immutable fact. I say "psuedo-immutable" because we can update it to fix typos, but, in general, the users in the UI do not need to know "the Author's first name was Bob for the 1st 30 years of their life, and then they changed their name to Fred".

Further, not only do the users "not care about this", but they also **do not want the cognitive burden or UX overhead** of even being able to enter, or reason about, this nuance of "Fred's birth name was Bob, but now it's Fred", for *every single attribute of every single entity* in the system.

*But*, if you're building the database system for a courthouse, and your user is the courthouse clerk, that user *does* really care about "what was this person's legal name over time?".

Basically, I believe that **most attributes** in your system can be just simple fields, with no effective time; however, depending on your domain, and **typically the most important aspect of your domain**, your users likely *will* care about "how this real-world value changed over time" (height of a patient, legal name of a citizen, etc.), and so for those, and only those, you should incorporate "effectiveness tracking" into your domain model.

However, even once decided that an attribute warrants effectiveness tracking, how you model this depends on your domain, and specifically how your users likely **already handle this change in their own real-life workflows**. Let's look at some examples.

## Examples

### Purchase Orders

An example of "a value that changes over time" might be "how many bricks did we order for this construction project?".

For example, at the start of the project, we ordered 2,000 bricks, and later we realized we needed another 500 bricks--this seems like a perfect example of "the effective value for 'how many bricks we need' changed over time".

So, should we jump right to an out-of-the-box bitemporal system like XTDB or a home-grown `Perspective` type, that adds an `effective_date` & `system_date` columns to our `purchase_orders` table?

My current assertion is no, because how the users think of a Purchase Order "changing over time" is already modeled in their workflows: they create a contract modification, called a Change Order, that goes through its own "get internal approval, send to trade to sign, watch for e-signature" workflow before "2500 bricks" becomes the official "new value".

So, our system might have a `purchase_orders` table, with a `date` column (denoting when the PO "became effective"), but then we'd also have a `change_orders` table, with a `purchase_order_id` FK, and its own `date` column, against noting "when the CO was effective".

This lets us model "change over time" (the PO established an initial "bricks ordered" as 2,000, but then the CO bumped it up to 2,500), but represented in the real-world artifacts/materialized first-class entities.

### Legal Name Changes

Thinking back to the courthouse example, this same approach of "real-world change modeled via entities" could be used there as well: maybe a `BirthCertificate` entity establishes a person's original given name, and then a `NameChangeApplication` denotes each legal name change, with metadata about when it was signed (effective), who approved it (do legal name changes require approval? I'm not sure...), etc.

### Bank Transactions

Even the prototypical "effective time" example, of a `BankTransaction` has "effectiveness" fundamentally built into its real-world data model: the transaction date.

### Versions of a Contract

These all seem relatively easy so far, but drilling into Beck's specific example, of "financial contracts managed over 20 years", I see a complicating, nuanced ask for both:

* The user wants to know "what did the system think our contract was 'as of last week'" (solvable with just an audit trail), **and** if they also need:
* The system's **own business logic** needs to know "what was the contract as-of two years ago", because maybe in our niche contract-billing use case, we've agreed that *even future* bills will calc against what the "known-at-the-time" contract was, and not the "fixed to be correct" contract is.

E.g. this is a rare case where system behavior itself must be able to **query data from historical system times** (not *non-auditing* purposes, i.e. performing actual business logic, to derive new behavior).

I don't think I've ever worked on a system that needed it--frankly, I'd tempted to assert it's actually a 3rd dimension, where we teach the domain about an additional "known time" or have dual `Contract`/`ContractVersion` entities. See the appendix on "Known Time != System Time" for more, but that musing aside, this "business logic needs to read prior system times" is the prototypical example for when your system needs bitemporal capabilities.

### Similarities

In all of these examples, "effectiveness", in my opinion, is best modeled directly via entities that describe "how the change was triggered in the real world", and not by leaning on a bitemporal framework.

(...I guess, to be fair to Beck's post, maybe databases like XTDB, and projects like `pg_bitemporal`, led me to assume Beck's post is asserting our *entire* domain model should be modeled bitemporally, when really "bitemporal"-ness is just a schema pattern to be applied to specific entities within our model, which is exactly how I would apply it; although, even then, I think I would lean in to more domain-specific naming, `ContractVersion`, etc., and away from super-generic, bitemporal-ish terminology like `posting` & `effective` columns.)

After some thought, all of my examples (save perhaps Beck's) are really just using Snodgrass's term of "application-time period tables", or [valid-time tables](https://en.wikipedia.org/wiki/Valid_time). Which is great, and makes sense, as even one of my first "big" systems used valid-times to track insurance benefit plan years.

## Conclusion

So, in conclusion, in terms of bitemporal modeling, I think:

1. The 1st bitemporal dimension, system time, is extremely important, and every system should have an audit trail
   * Given this matters to _all_ attributes, you should use a system-wide solution like CyanAudit
   * Bonus points for your UI being able to "time travel" back to a given system timestamp, i.e. if you use a database/ORM that supports `SELECT * FROM authors AS OF TIMESTAMP '2023-01-01 12:00:00'`
2. The 2nd bitemporal dimension, effective time, is only important to the most intricate/differentiating parts of your domain model, and unnecessary overhead for the rest.
   * You can divide attributes into 80/20 buckets of "psuedo-immutable facts" (like an author's name, just use a `first_column` column) vs. "facts that have *multiple correct values* over time *that our users specifically care about*" (like a patient's height, use a `PatientMeasurement`s table) 
   * For attributes that need effectiveness, you should model these as explicit entities that the users already recognize (i.e. change orders, transaction dates, patient measurements)
3. If you really have business logic that relies on "known at" time (rare IMO), personally I would treat that separately than "system time", and model this as "versions" (see appendix below)
   * Perhaps this is what most people mean they say "bitemporal", is explicitly materializing known-ness for business logic to access.
   * Instead of using dates to reason about "known-ness", I think it's much easier to think of this as versions--we had v1 of a contract, v2 of a contract, etc., and yes, we need to "find the version...as of some date", but that seems a much simpler mental model than "posting date vs. effective date"

Coming back to the `Perspective` class from Kent Beck's post, I think it's unlikely I'd use it, because it couples two dimensions that are fundamentally different, and I think is actually more confusing and unnecessary to try and solve them via the same abstraction.

Particularly for system time, because each slice of system time is basically a unique, "internally consistent" view of the world at that point in time, I can't imagine ever wanting to **accidentally "mix" data across separate system times** (i.e. forget to have the `self.posting_date <= other.posting_date` from the `Perspective` class).

And, if users or product do ask for that behavior (reading data across system times), I'd suspect that's *really* an ask for either **effectiveness** (like patient heights, hopefully) that we hadn't realized yet, or *maybe* **effectiveness and known-ness** (even rarer, like billing for contracts based on their known-at time).

Maybe the biggest difference is just terminology: I think of "system time" fundamentally as an artifact of the database/storage technology, that business logic itself should never be able to cross/intermix, and a dimension that applies to all data, whereas "known time" is so rare, intricate, and generally confusing to deal with, that we should model it explicitly, and only as necessary.

## Appendix: Choosing Your Dimensions

When evaluating "what dimensions does this attribute need?", think does your *business logic* (or UI) depend on:

1. Nothing (no dimensions) i.e. the author's first name "is and has always been Bob"
   * These are the psuedo-immutable facts, i.e. 80-90% of attributes in your schema
   * Use the audit trail to see them evolve over time
2. Effective time (one dimension), i.e. the child's height over time, purchase orders w/change orders
   * You can model "effectiveness" *without* "known time" explicitly modeled in your domain
   * Use the audit trail to see them evolve over time, i.e. your *business logic* doesn't need to "time travel" to previous known-ness 
3. Known time (one dimension), i.e. versioned architectural plans...
   * We know "Architectural Plans v2" changed "# of bricks from 200 -> 300", and we want to have both "the old value + new value" materialized in our domain so that we can show/calc diffs in the UI, but it's not like "200 bricks" is still meaningful in some prior time period (what effective time represents)
4. Known time _and_ effective time (two dimensions), i.e. Beck's contract billing
    * Your *business logic* itself needs to "time travel" (known-ness) _and then_, after filtering to "facts at known time", applies additional filtering for "effectiveness"

Basically:

* Some real-world values have "effectiveness" (height of a child, citizen's given name), some don't
* Sometimes business logic needs to "time travel" to prior known-ness (versions of architectural plans)
* Sometimes we need to *both* "time travel" (version) entities that themselves also have (effectiveness) (versions of a contract)

But all of these seem like they can be modeled in your domain.

## Appendix: Known Time !== System Time

After writing most of this post, I'm now asserting that "known-time" is not the same thing "system time": "system time" is a physical attribute of your storage system, that marches ever onwards, whereas "known time" is explicitly versioning specific entities within your domain model. 

Thinking of Beck's use case: "the contract was 'known as' $20k, and we've fixed it to be $40k, but we want to bill it with the historical/known-at $20k".

Usually for this use case, we focus on the "$20k" old value, and think, well, the database snapshot from back then would have the "$20k" value, so we should use the system-time dimension to go back and recover the old value.

But, what if we focus on how the "$40k" new value actually replaces the $20k old value?

I think the assumption is that this transition is simply whenever the `UPDATE contracts SET value = 40 WHERE id = 1` statement runs. And that edit / `UPDATE`, which is recorded implicitly in the system-time dimension, creates the old value/new value transition we want to track.

But, what if the "fixed contract value" actually needs to go through approvals? Or the "Edit Contract" UI is not a desktop fat-client that does a single, final `UPDATE` mutation, but is actually doing lots of auto-saves while the fixed `Contract` entity is wip?

Both of these would cause edits that move the system-time dimension forward, with "changes to the `Contract`", but those changes have not yet actually invalidated/replaced the old contract value yet. They would need to be staged somewhere in the "next version of the contract".

This makes me think that we should materialize the notion of "versions of the `Contract`" directly into our domain model. I.e. when we're asked to "bill the contract with the 'known at' values...", we should model it with `ContractVersion`s, similarly to how we modeled the `PurchaseOrder` and `ChangeOrder` flow.

This makes bitemporal-ness a lot more pedestrian:

* if you need "known at" for auditing, use an audit trail,
* if you need "known at" for business logic, add "versions" to your schema,
* if you need "effective at" for business logic, add date/date ranges to your schema.

And that's it.

Which makes me unclear/skeptical of what a "bitemporal database" like XTDB would bring to the table--granted, it would be great to have system time/auditing built into the database (instead of using a 3rd party solution like CyanAudit)...but, other than that, any notion of "effectiveness" or "business logic needs to access old values" (known-ness) I think I'd want modeled as first-class notions in the schema, and not metadata passed around as query params.

If you think you need to "cross system-time" to perform business logic (i.e. not auditing), you likely have a hidden entity (contract versions, change orders), that you should model explicitly in your domain.
