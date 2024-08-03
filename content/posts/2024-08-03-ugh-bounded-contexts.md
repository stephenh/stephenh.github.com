---
date: "2024-08-03T00:00:00Z"
title: Ugh Bounded Contexts
categories:
  - Architecture
---

I generally consider myself a fan and practitioner of Domain-Driven Design (DDD).

I really like ubiquitous language. I really like domain models.

Personally, I'm less enamoured with the various design patterns that have stood up around DDD, particularly in the .NET world, where every entity has its own `Repository` and maybe its own `Service` and lots of "Enterprise Patterns" that sound a lot like the DAOs and EJBs of the early 2000s. But `:shrug:` maybe those are fine.

### Whatever You Want-ism

But my least favorite part of DDD is the term **bounded context**, because the "bounds" (which is the most important part of the term) of any "bounded context" has a tendency to become **whatever you want them to be**.

Would you like "author & books" to be in the same bounded context? Great, just do it!

Would you like "author" and "books" to be in *separate* bounded contexts? No problem, do that instead!

This "whatever you want-ism" that permeates every conversation I've ever had involving bounded contexts, basically makes it useless to me as a term.

So given this is a blog post, of course I'm going to define what, for me, are "good bounds" and "bad bounds" when using the term "bounded context".

### Good Bounds

For me, the canonical use case for bounded contexts is translating "my entity" into "your entity", i.e. "my application's concept of `Author`" into "your application's concept of `Author`".

For example, if I'm making a library management application, I'll have "my own `Author`" entity in my domain model, that deeply represents what my application considers "an author" to be, and integrates "my concept of author" across the rest of my library management application's domain model.

However, when I need to download authors from a publisher's API, it's very likely that their API will have a slightly different notion of what an `Author` is. It will have slightly different fields, slightly different relationships, etc. Or maybe they even call their authors something different, like a `Client` or `Opportunity`.

This is all fine, and completely expected. We each have our own concept of `Author`.

For me, this is the **most clear**, **most unambiguous**, example of "bounded contexts"--I have my `Author` and you have yours.

And, as our applications talk to each other (i.e. via either asynchronous or synchronous API calls), we need to use the DDD pattern Access Control Layer pattern (whether explicitly or implicitly called that in our codebases) to translate "my `Author`" into "your `Author`", as we cross boundaries.

Makes sense!

### Bad Bounds

With that "good bounds" established as our north star, what would "bad bounds" be?

For me, the titular "ugh" moment comes when I see the term "bounded contexts" used to split up what is fundamentally a single domain model.

For example, within our singular library management system, we decide our domain model "is too big", and decide to split it up, by attempting to draw "the least terrible" grouping possible, i.e.:

* The `Author` entity is now part of the "authorship service" (a purported bounded context), and
* The `Book` entity is now part of the "reading service" (another asserted bounded context)

And the assertion is "the authorship service" **must have no notion of "a Book"**, and the "reading service" **must have no notion of "an Author"**, and instead must make API calls between each other, any time our library management system (whether the UI or any business logic) needs to hop between the "author" and "book" models.

The rationale for this split is numerous...

* "Separation of concerns",
* "Single responsibility principle",
* "Decoupling"
* "Team ownership"
* Etc, etc.

These rationale are debatable, but even if they were all true, they miss the point: at the end of the day, there is still a **single library management system** that wants **a singular definition of an author**.

I.e. unless/until your services can *truly stand on their own*, as *independently-useful services* (neigh products) where they *each have their own version of 'an author'*, or *their own version 'a book'*, which *integrates into a holistic model*, then really you do not have "separate bounded contexts", and instead **you're creating a distributed monolith**.

Which, maybe that's fine!

Maybe you really do want a distributed monolith, **but let's call it what it is**.

When you split up your domain model, entity by entity, you're not creating "separate bounded contexts", where each "bounded context" is a *self-sufficient*, *independent*, *coherent* domain model; instead, you're deciding, as an implementation concern, to split what is "a single domain model" up into a distributed monolith.

...wait a sec, this turned into a microservices vs. monolith post. Gotcha! :-)

### Domain Model Bounds

...so, wait, aren't I just moving "what are 'the bounds' of my bounded context?" problem to "what are 'the bounds' of my domain model?"

**Yes, exactly!**

I don't think bounded contexts were meant to "carve up domain models"; they were meant to show it's permissible, and preferable, to *translate between domain models*.

I.e. within a Fortune 500 company, with 100s/1000s of applications, we can't expect everyone to "have the same `Author` model". 

But, *within a given application*, each application should have its "most canonical" definition of "its `Author`", to keep its codebase as clean and idiomatic as possible, and then isolate the "translation between my `Author` and the shit-show of 10s/100s of other applications' `Author`s" to an isolated "edge", "gateway" layer on the externals of the system (the Access Control Layer).

### Rules of Thumb

So, if "the bounds of my domain model" dictate "the bounds of my bounded context", then what is the boundary of my domain model?

Good question! Personally, I'll have a few rules of thumb:

- Any single user-facing UI is effectively a **single domain model**, and so a **single bounded context**
  - This holds *regardless of the number of screens in your UI*
  - Rationale: within a single UI, it would be nonsensical to have "two different `Author` models" exposed to the user, it would be confusing both to the user and to the engineers.
- Any single line-of-business application is effectively a **single domain model**, and so a **single bounded context**

I.e. to have truly "separate bounded contexts", and hence "separate domain models", you need to have **separate applications** and basically **separate business products**.

If you don't have "truly separate products", and hence not "truly separate domain models", that's fine, you can still carve up your domain model into microservices, or "right-sized services", or what not--**but don't call those bounded contexts**.

In my opinion, you should realize that **you're still creating a single domain model**, and it *will* be a monolith--you're just deciding whether you want "a monolith in a single codebase" or "a monolith that is distributed across codebases", and then I'll leave it as an exercise to the reader which of those two choices you personally prefer.

### Appendix: Joist Pitch

If you find yourself agreeing with the assertions in this post, my current "hobby project built to make my day-job project not suck" is [Joist](https://joist-orm.io/), whose mission is to make building & maintaining large, unified domain models as pleasant as possible--please check it out! :-)

