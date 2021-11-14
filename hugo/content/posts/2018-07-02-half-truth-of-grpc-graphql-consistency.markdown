---
date: "2018-07-02T00:00:00Z"
section: Architecture
title: The Half-Truth of GRPC &amp; GraphQL Consistency
---

{{page.title}}
==============

I've been reading a lot of docs and blog posts on GRPC and GraphQL lately; both of which seem like cool, well-built technologies.

I buy into GraphQL being game-changing for the client.

And I also buy into GRPC being super-high-performance, HTTP/2, etc., etc.

That said, I have a somewhat major nit-pick for both technologies, and it's around their purported superiority in terms of API consistency.

If you read any GRPC blog post, they invariably tout how, in contrast to REST, GRPC parameters are uniform and de facto consistent.

E.g. while REST gives you lots of freedom in where to put parameters:

```
POST /employee/:does_id_go_here?id=or_id_here
Header: or_id_here
```

With an IDL, like GRPC and GraphQL, you define it declaratively:

```
message EmployeeInput {
  string id = 1;
}
```

And then it's automatically/uniformly put in the same spot.

And the same thing with GraphQL, e.g.:

```
type EmployeeInput {
  id: String
}
```

And, per the blog posts, this is the 1st/universal evidence of REST being inferior (granted, they go on to other reasons, but typically start here).

Syntax- vs. Semantic-Level Consistency
--------------------------------------

However, my annoyance is that this "where does the parameter go" is a small sliver of the overall picture of an API's consistency.

To me, "where does this parameter go" (or "how is it encoded on the wire") is important, but is low, "syntax-level" consistency (making up terminology), and ignores a whole different layer of "semantic-level" consistency.

A brief list of these semantic-level concerns are:

* Are inputs uniform across all similar endpoints? When I submit a new employee or a new employer, are the inputs a list of fields, or one field that is a struct? Is it the same struct that I get on read? Or a different struct with a subset of fields?
* Are the success results uniform across all similar endpoints? What does the "entity created" look like for all of your entity endpoints? Is the new object's id always returned? Is that field name always the same? Is a copy of the new entity returned?
* Are the errors results uniform? If there is an error code, is it always in the same spot? If the name field was invalid, is that error message always in the same spot?
* Are dates encoded uniformly in the inputs? The outputs? Are they always strings? Longs? Millis? What about other user types?
* Is paging conistent across all applicable queries? Is it always start/offset?
* Is sorting consistent across all endpoints? How do I say "sort by name asc"?
* Is filtering consistent across all endpoints? How do I say "only return unpaid invoices"? How do I say "only return invoices whose companies are in the state of California"?

The answer with GRPC is that none of these are defined by GRPC itself (and same with GraphQL, for the most part), so you're perfectly free to be wildly inconsistent across your entire API.

Which, to a certain extent, I get, GRPC shouldn't box anyone in on "where's how you have to do paging"--that's fine, but let's not pretend it is enforcing some magical level of consistency, because it is not.

Where Are The Entities?
-----------------------

Continuing my rant/tangent, what both of GRPC (more so) and GraphQL (less so, but still) are woefully mute on is: what are the entities?

Entities, and consistency for entities, has been core to any system I've worked on (which are admittedly all, at the end of the day, "enterprise spreadsheets", e.g. CRUD + a ton of business logic).

So, echoing some of the previous list, for me what's really important, when we talk about API consistency, is *entity consistency*:

* What's the name of the `ID` field? `id`? `key`? `primaryKey`? (GraphQL at least has an `ID` type which is great.)
* How do I create an entity? What's the message name (GRPC)? What's the mutation name (GraphQL)?
* How do I update/delete an entity? (Same thing.)
* How do I query an entity? (Same thing.)

For me, this is the true consistency, semantic-level, entity-level consistency, that can make or break the simplicity of building business systems in the large.

Why Does Entity-Level Consistency Matter?
-----------------------------------------

There are two reasons:

1. Developer Productivity

   When you have consistency, life just gets easier. Developers know where to look, they know where to change things, debugging is not as stressful. They just go faster.

   Granted, developer speed is a hard metric to quantify, and developers are also good at just buckling down and dealing with the lack of consistency.

   As a friend of mine remarked once, if you've not been in a super-consistent system, it's hard to appreciate how easy life can be.

2. Tooling

   Consistency can make tooling dramatically easier to build (because there are less edge cases to handle), so a number of problems become more generalizable:

   * Writing generic API libraries around your endpoints
   * Providing CRUD stubs for your system
   * Mapping calls/results to local/offline caches
   * ...other things... (ha)

   That if you try to build these on top of "just a random bunch GRPC messages" or "just a random bunch GraphQL mutations", would likely become a mess.

   But if you step back, and constraint your input, they are more likely to be doable.

Hibernate vs. Joist
-------------------

A small, concrete example from my past around consistency and ease of tooling is [Hibernate](http://hibernate.org/), the Goliath of Java ORMs, and [Joist](http://joist.ws/), my now-dead ORM hobby project.

Hibernate is for "not consistent at all" schemas: it has annotations and mapping files to model any possible database schema you will ever see. It has the complexity that comes with that mission, and was ~100K LOC (IIRC, when I looked ~10 years ago).

Joist is for "super consistent" schemas: it assumes all of your entity tables look like `X` (the primary column is `id`, it's a sequence number, there is a `version` column for op-locks, etc.). Your join tables always look like `Y` (it also has an `id` column, the other columns are deterministically named, etc.).

Because of this, Joist is dramatically simpler, and only ~10K LOC (which still seems too big).

So, not that you should go write your own ORM; but, if you have a entity consistency, you *at least have that option*.

Well, you can technically attempt bespoke tooling without entity consistency, but you risk it being a quagmire.

In my opinion, you should cheat and get entity consistency first, and then your tooling will at least be easier.

REST Almost Got Consistency Right
---------------------------------

Back to REST and GRPC/GraphQL, another irksome aspect is that, despite REST not being the cool kid anymore, it *almost* got this right.

(As a disclaimer, I'm going to purposefully talk about pragmatic-REST and not Fielding-/HATEOS-purist REST.)

REST is about resources, which, if you squint, are entities.

And given how easily REST verbs map to CRUD operations, we're ~90% of the way to entity consistency.

...except that REST stopped at resources, and didn't encode the last ~10% of "what is the id", "what *exactly* does the path look like", etc.

So, ironically, REST is *closer to semantic-level consistency than GRPC* (resources are/can be entities), but has essentially no syntax-level consistency (you're free to encode your resource inputs/outputs however you like).

Which, to be fair, I understand why web-/Fielding/document-style REST does not need these tight constraints, but ~90% of all JSON APIs are, in my opinion, basically entity APIs, that would do well to adopt a strict subset of conventions.

Granted, Entities Can Look Different
------------------------------------

I also understand that entities will look different across the industry, and so it's not realistic for REST itself, or GRPC itself, to encode very tight, semantic-level details.

E.g. I'm sure Google's entities likely look slightly (or extremely) different than your entities or my entities.

So, I admit it makes sense for GRPC to punt on entity consistency.

Especially since GRPC is meant for lower-level, raw RPC calls, e.g. when building distributed systems, where non-entity communication is a major use case.

However, my suspicion is that a ton of GRPC users are adopting GRPC precisely as a "better JSON API" or a "better entity API" solution, and kind of missing the point that it doesn't actually bring any entity-specific strengths or conventions to the table.

GraphQL was Really Close
------------------------

I was initially very impressed with GraphQL (and still am), especially when I saw their `type Foo { id: ID... }` notation...finally! An IDL that is about entities!

They also talk very generically, e.g. [Thinking in Graphs](https://graphql.org/learn/thinking-in-graphs/), which sounds "entity-ish", if you make your graph nodes entities. I'd be fine with that.

However, I was disappointed to see that they have basically zero consistency around mutations. Mutations can be anything, can do anything, can be named anything, and are completely opaque-/server-defined implementation details.

Unfortunately, I think they did this on purpose, as "opaque, named mutations" are basically an encoding of the command pattern, where the client must trigger explicit "perform action X" commands, and the server will respond appropriately. Which, for long-lived mobile applications, the flexibility to update "what does command `X` do" without an app update is admittedly very nice.

However, personally, I think ~80% of an application's mutations are boilerplate CRUD. And, granted, some small percentage, e.g. ~20% or so, will have to be done server-side, because they are non-CRUD, or require special server-side logic/resources.

And so, while I think I understand their motivation, I wish GraphQL would have been more opinionated about "this is what CRUD mutations look like".

(I have more thoughts on GraphQL and offline apps, but am deferring that to another post.)

(Facebook is also generally competent, so perhaps their opaque mutations == command-pattern really is best-practice, and I will come around. Not sure yet.)

Just Use Your Own Convention
----------------------------

So, anyway, none of REST, nor GRPC, nor GraphQL are panaceas for "if you use this, you'll automatically have amazing API consistency".

It will still come down to trying, finding, documenting, and enforcing your own conventions.

As is our lot in life as software engineers. (...although maybe that is why we shouldn't call ourselves engineers? I think real engineering professions have this sort of stuff figured out and standardized.)

I do muse that, maybe someday, a true entity-based IDL will become popular (the closest I've seen so far is [dsl-platform](https://docs.dsl-platform.com/ddd-aggregate-root). Maybe not something that Google, Amazon, and a two-person start-up can all use. But something that solves the 80% case.

