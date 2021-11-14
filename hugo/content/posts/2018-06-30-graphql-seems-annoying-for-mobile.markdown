---
date: "2018-06-30T00:00:00Z"
section: Architecture
title: GraphQL Seems Annoying For Mobile
---

{{page.title}}
==============

I am generally a fan of GraphQL.

However, I'm starting to suspect it's not that great, at least out-of-the-box, for mobile clients.

It seems like there are two primary pain points with mobile clients:

1. Detangling GraphQL responses into local/offline storage
2. Mutations are completely opaque
3. Queries are completely opaque

I'll muse about each.

Mapping GraphQL To Local Storage Sucks
--------------------------------------

I think the power of GraphQL in web clients is obvious: instead of making `N` REST calls, getting back `N` promises, and having to munge all those into one giant promise, the GraphQL endpoint does all of that, and you get a single promise for the entire graph/shape of the data you want.

Obviously really cool.

However, I think web clients are cheating a bit, by (validly) assuming they're always connected, and so leveraging the ability to go directly from the wire to the screen.

In mobile clients, especially existing clients that are swapping out REST calls for GraphQL, it's still extremely common to go:

* 1st go from the wire to local storage (sqlite, core data, Realm, etc.)
* 2nd go from the local storage to the UI

E.g. they use the local storage as a buffer between the server and UI, which makes sense as it guarantees (for the most part) a nice offline experience.

These local storage databases are often object-ish/relational-ish, basically normalized views of entities. Which is good.

However, that previously-amazing "big blob on data" that GraphQL can give you does not map directly to objects/tables of your local storage, so you end up doing a tedious, error-prone DTO mapping operation, going from the GraphQL types to your local types.

This is doable, but not very sexy.

But Apollo Caching Does This, Right?
------------------------------------

The Apollo family of clients does have cache normalization approaches that are supposed to help with this.

But there are two wrinkles:

1. Your app may still be using local storage, and so you have to maintain both while in transition
2. Even in pure GraphQL, updating the cache is inherently a mess. See the next sections for why.

GraphQL Mutations are Completely Opaque
---------------------------------------

Per official guidance, mutations should be business events, `likeStory`, `upVote`, etc.

It took me awhile to realize this is best-practice: in a world where mobile clients never upgrade, if you keep the semantic meaning behind user events, you're server code (which is always upgraded) can respond with the latest business logic.

E.g. if in v1 `likeStory` meant "create a like object", that might be baked into the app.

Now you release v2, and you want `likeStory` to mean "create a like object and also do x, y, z". Without the command pattern of `likeStory` going to the server, if it just saw a "huh, this like showed up", the server may not be able to tell "oh right, this is a `likeStory` change, I need to do x, y, and z now".

So, that makes sense; unfortunately it means **reimplementing the side-effects of every offline-first mutation in your app**.

Which, to a certain extent, in a REST/entity world, this is not very different; e.g. in the old-school local storage approach, your app has to know the business logic of "like story" == "make inserts into tables x/y/z".

So, far enough, now in the GraphQL world, the app still has to know the business logic of "like story == make updates into nodes x/y/z".





### But Apollo Does This For You Right?

Granted, the Apollo series of GraphQL clients do attempt to do this, by identifying nodes/edges by `ID` and normalizing/caching them.

Why not use that?



, which is internal normalization and caching of GraphQL results. Why not use that?






