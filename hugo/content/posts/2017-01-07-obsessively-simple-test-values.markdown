---
date: "2017-01-07T00:00:00Z"
section: Testing
title: Obsessively Simple Test Values
---

{{page.title}}
==============

One of the things I look for when writing and code reviewing tests is how simple the test values are.

By test values, I mean the dates, strings, dollar amounts, etc. that are used to exercise the boundary cases.

Dates
-----

For example, I might write a test that does something with account balances (I'm just making up the "account balance" scenario, whatever business logic being tested is not important for illustration purposes):

```java
// Given an account
val a1 = newAccount(LocalDate.of(2016, 1, 7), LocalDate.of(2016, 1, 10));

// When we balance it after it's closed
a1.runBalance(LocalDate.of(2016, 1, 11));

// Then something...
```

When reading this test, I wonder: "why did the author choose Jan 7th as the start date? Why did they choose the 10th as the end date? Those are kind of 'odd' dates...is there something special about them?"

In reality, the author probably choose the 7th because the day they wrote the test was January 7th. And they picked the 10th because, eh, it just needs to be open for a few days, and how long it's open is not really important to the balance logic.

If you follow this pattern, of choosing bespoke or `/dev/random` values for each test, invariably each test ends up with slightly different dates, e.g. the next test method, or the next test file, or the test written by someone else on the team, will look something like:

```java
// Given an account
val a1 = newAccount(LocalDate.of(2016, 5, 2), LocalDate.of(2016, 5, 30));

// When we audit it
a1.runAudit(LocalDate.of(2016, 5, 30));

// Then something...
```

My mental dialog is similarly confused and spastic: "Hm, why May 2nd? May 2nd to 30th is *almost* a entire month... is that important to this test, that it's not the full month? Is May 30th the last day of the month? Fuck, I don't remember how many days are in May...is it 30 or 31? 30 days has September, April, June, and November... All right, so May has 31 days ...wait, what is this test doing again?"

Instead, to silence my mental chatter, I prefer using obsessively simple dates:

```java
// Given an account
val a1 = newAccount(LocalDate.of(2016, 1, 1), LocalDate.of(2016, 1, 31));

// When we balance it next month
a1.runBalance(LocalDate.of(2016, 2, 1));

// Then something...
```

To me, it's more obvious 1/1 and 1/31 are dummy/place holder dates. Especially because now every test in the project should prefer to use these "standard dummy" dates, so our audit test looks a lot like our balance test:

```java
// Given an account
val a1 = newAccount(LocalDate.of(2016, 1, 1), LocalDate.of(2016, 1, 31));

// When we audit it on the last day of the month
a1.runAudit(LocalDate.of(2016, 1, 31));

// Then something...
```

And for dates in particular, using some fields with the date names really cleans it up, and makes it more apparent you're just using standard/dummy dates:

```java
// Given an account
val a1 = newAccount(jan1, jan31);

// When we audit it on the last day of the month
a1.runAudit(jan31);

// Then something...
```

So you can define some "standard" dates like `jan1`, `jan2`, `jan31`, `feb1`, `dec31`, that will cover ~80%+ of date-based scenarios in a common base class/utility file.

This also means that when you do have a test that covers a truly special date, it will stand out, instead of being lost in the noise of "well, who knows whether these dates are important or not".

Multiple Related Values
-----------------------

Besides just dates, I also like using obsessively simple interrelated values, e.g. when multiple monetary values are used in a test.

E.g. a test for an account/campaign budget might look something like (I'm using an advertising domain example, where an advertiser has an account, and a campaign, and we need to have available budget for both account and campaign for impressions to serve):

```java
// Given our budgets are mostly spent
val a1 = newAccount().budget(1000).spent(495)
val c1 = newCampaign().budget(500).spent(200)
...
```

We have multiple values being used, my mental chatter is: "Okay, $1000 budget, sure, $495 spent...huh, why did they choose $495? The account has $505 left...Why $505? Is the fact that it's $495 spent instead of $500 spent important? The campaign has $300 left, and it used a nicer 'round' difference of $500 budget - $200 spent = $300 left... I wonder why the account has this $5 odd amount in it's remaining. And is it important for this boundary case that the account has more available?"

Again, my inner dialog is perhaps being overly-spastic, but we can quiet it by something like:

```java
// Given our budgets are mostly spent
val a1 = newAccount().budget(1000).spent(900)
val c1 = newCampaign().budget(1000).spent(900)
...
```

This is very much less noise, it's more obviously the $1000 and $900 were chosen to leave a nice/even $100 left in each the account and the campaign. Simple, I can move on and read the rest of the test.

One wrinkle is that ocassionally you'd prefer having different values at different levels of your entity hierarchy to ensure your implementation is not getting numbers confused, e.g. in the previous scenario the assertions might be:

```java
// Given our budgets are mostly spent
val a1 = newAccount().budget(1000).spent(900)
val c1 = newCampaign().budget(1000).spent(900)

...

assertThat(a1.left(), is(100));
assertThat(c1.left(), is(100));
```

It's not obvious if the `c1.left()` is, internally in it's implementation, accidentally calling `a1.left()` and naively returning it without doing it's own calculation (e.g. maybe it should `min` the two or what not), and so returning the wrong answer.

Using different test values at each level of the hierarchy will clarify this, but we can still use very dumb/obvious values will doing so, e.g.:

```java
// Given our budgets are mostly spent
val a1 = newAccount().budget(1000).spent(900)
val c1 = newCampaign().budget(100).spent(90)

...

assertThat(a1.left(), is(100));
assertThat(c1.left(), is(10));
```

Now it's clearer to see each level is being calculated separately, but the parallelism between "account spent 90% of it's budget, campaign spent 90% of it's budget, using dumb/easy numbers" is obvious and the math is easy.

Business Logic Test are Not Fuzz Tests
--------------------------------------

One rationale I've heard for using more random values in tests is that you might stumble across a boundary condition, e.g. maybe your code works with nice even/round numbers like $1000 and $900, but on an odd number like $423.13 then it breaks, say due to rounding or what not.

That is a very valid concern, especially with floating point numbers (I hate floating point), but I think it's a mistake to combine our semantic boundary tests with what is basically fuzz testing (fuzz testing is throwing a lot of random values at your functions to make sure they handle boundary cases).

Fuzz testing is great, but combining fuzz-style values into your regular tests just obfuscates them.

If you want fuzz testing (which usually uses automated/random input), or even a manual/explicit `shouldRoundFloatingPointCorrectly`, that is great, it should just be it's own dedicated test, so we know explicitly what it's for.

Strings and Names
-----------------

Same sort of thing for strings; although, unfortunately, I have somewhat of a cranky-old-man approach to name fields (e.g. account name, or customer name, or what not).

For example, I twitch when reading tests that use account names like "ted's account", or hey, Star Wars is out this weekend so I'll use account names like "vader sucks" or "sith rulz".

...yes, that's cute.

But when I'm debugging that just doesn't help me.

What does help me is being boring, e.g.:

```java
// Given an account
val a1 = newAccount("a1");
```

Now when I'm debugging some annoying, hard-to-find bug, and I look in the database, my account name, "a1", matches my variable name. Hey, that makes my life easier.

Boring is Productive
--------------------

So, I feel a little bad about this, especially the last point about boring names, because I don't want to remove all the fun from programming.

But I guess what's most fun to me is being productive, and being OCD about test values, dates, monetary values, names, etc., is one of the little (or big) things that keeps me productive as the codebase keeps growing, tests keep getting added, code reviews keep coming in, etc.


