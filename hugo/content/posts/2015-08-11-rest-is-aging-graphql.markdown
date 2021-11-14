---
date: "2015-08-11T00:00:00Z"
section: Architecture
title: REST is Aging, GraphQL is the New Thing
---

{{page.title}}
==============

I am currently not a LISP/Clojure programmer, but a few weeks ago I watched the [Om Next](https://www.youtube.com/watch?v=ByNs9TG30E8) video, just to see what all the cool kids are up to. (Not meant sarcastically, some of the React/Om stuff is spiffy.)

In the talk, David mentioned Facebook's GraphQL. Which I had heard of before, but didn't know really anything about.

If you are like me, the [GraphQL introductory blog post](http://facebook.github.io/react/blog/2015/05/01/graphql-introduction.html) is a great read.

Personally, I think this blog post's critique of REST is spot on. They touch on all of the complaints I have about REST:

* Basically all implementations use ad-hoc/bespoke endpoints, so two of them, e.g. `/employee` and `/employer`, will have the same basic semantics, but it's very easy for subtle differences to sneak in.
* There is rarely a schema available for the REST API, which makes tooling hard, and instead every client has to hand-code their client logic. ([Swagger](http://swagger.io/) is an exception here, though I've not had a chance to use it yet.)
* Per-entity endpoints sucks for cross-entity batching (which is especially missed on mobile)

But they also go further and point out several things I had not thought of:

* REST API rarely allow clients to dictate the fields they need, so `GET /employee` has to return everything that any client wants, which bloats responses for clients that only need a minimal amount of data.
* Because of this, many REST APIs that are really for an internal (web/mobile) client talking to an internal front-end server, end up having many view-specific endpoints. This adds to the coupling of the systems, and just adds more boilerplate work each time the client-side developer decides they need a slightly different chunk of data.
* They advocate/support client-driven queries, which historically I've been very skeptical about, due to things like security (e.g. a client saying "give me someone else's data), limiting abuse (e.g. a client saying "give me all the data"), validation rules, etc., being harder to handle more generically. But I'm coming around to making a lot of sense.
  * (Packaging up N-levels of a client-specified graph hierarchy in 1 wire result also reminds me of Google's [F1](http://research.google.com/pubs/pub38125.html), which drives Adwords. What's different is that the N-levels of F1 was from the raw data store to the front-end server (e.g. go get me customer X + their addresses from shard1, and then I'll turn it into JSON), instead of all the way to the client.)

When I think of the workflow for our main application at work, it has a lot of these pretty standard deficiencies...each front-end view needs a new `get entity`, `save entity` server-side end point. We have some basic tooling to reduce the boilerplate, e.g. we do what I'd always wrinkled my nose out, and map to/from DTOs, albeit mostly with [dtonator](http://www.dtonator.org). It'd be really nice to not have to do this.

Which, if you think of SQL, which is a ubiquitous/very successful data access language, it does not require a new port, or new server-side (e.g. database-side) code changes, each time you add a new table. (Obviously it would not be safe to expose a raw SQL connection to clients.)

But I think there is a principle in there...that ideally your system-to-system protocol should not change with each new entity you add to your system.

However, this doesn't mean clients have to sling maps of `{"name": "foo", "address": "123"}` around (who knows what other attributes there are?); ironically, generating type-safe client code actually becomes much easier given a consistent, "entity-generic" underlying protocol.

My general approval said, I think there are a few interesting things:

* So far GraphQL seems only like a query language; obviously the Create, Update, and Delete in CRUD are also important, and I can only anticipate that eventually GraphQL will incorporate writes back from the client to the server. (Surely Facebook's internal GraphQL systems already do this.) 

  (Update: the day after I wrote this draft, Facebook released [Relay](https://github.com/facebook/relay), which does handle updates. I've not looked in to it yet.)

* One of REST's advantages was that, given each end point was bespoke, it made it very easy for entities/endpoints to talk to completely separate backends. In large scale systems, it's pretty common to use a handful of data stores, each one fitting a certain use case.

  However, a simple/obvious GraphQL implementation would sit on top of a single database (whether that's relational or NoSQL, the point is it'd be the same for all entities).

  It will be interesting if GraphQL attempts to bridge "each entity can come from a different data store". I've worked on a system that attempted to do this in the past, and I think it can be a nightmare.

  However, going back to David Nolen's Om Next talk, if he really wants clients to have single unified view of the world, and a GraphQL-enabled server is providing this unified world view, it seems like some amount of "stitch cross-database entities together" would be needed, just to handle the reality of what most systems look like today.

* If a client is making client-driven queries, and you're also leveraging strong typing, I think eventually (at leasted in typed languages) you get a boutique DTO per query. E.g. you'll have `EmployeeQuery1Dto`, `EmployeeQuery2Dto`, which with a slightly different set of fields and nested sub-entities.

  This is great for minimizing data fetched, but it seems to complicate code reuse. E.g. if you want to have a `EmployeeDisplayLogic`, how can it work with both `EmployeeQuery1Dto` and `EmployeeQuery2Dto`?

  In boring languages like Java, both DTOs would need to implement some sort of `EmployeeDisplayable` interface. In a fancier language like Scala, you could potentially use structural types (not entirely sure how that'd work). In a hipster language like Javascript, you probably just don't care, unless [Flow](http://flowtype.org/) complains.

  (Granted, if GraphQL is serving web and mobile clients, the mobile clients will be the more boring/traditional languages like Java/Swift, so it will be interesting to see how it's modeled there. ...er, right, [maybe not](https://facebook.github.io/react-native/). Cheaters. :-))

Anyway, wrapping up, I personally find GraphQL really compelling. And actually a lot of the Facebook open source technology these days looks really nice. I wish it was not so JavaScript centric, but that's how it goes. 

I also think it's interesting, just in terms of watching the industry evolve, that REST, which was the unquestioned best practice for years now (and good reasons), is, like all things eventually do, starting to show it's age, develop more nuanced pros/cons, and have the next generation of alternatives grow up.


