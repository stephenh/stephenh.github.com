---
date: "2024-03-04T00:00:00Z"
title: Can, Should, And Of Instead of Is
categories:
- Architecture
draft: true
---

A few times every year, I'm reminded of how annoying it is to change enums.

We use enums for many things in domain modeling, i.e. `type`s of `LargeType` vs. `SmallType` or `status`s of `Active` vs. `Inactive`. At [Homebound](https://www.homebound.com/), out of the current ~300 tables in our production database, nearly 50% are enum tables--they're all over the place.

Usually enums are innocent, and necessary, but invariably they change, and then the pain can range from "not a big deal" to "just awful".

In particular, enums like `type` and `status` are probably the too biggest offenders of a) "there will always be a new type", "there will always be a new status", or the worse "we'll just completely reorg these `type`s!", and b) when that happens, it will a crap shoot to go find all the logic that needs updated.

This pain is also multiplied if we've exposed the enums via an API to the outside world, because now you've got to:

1. Audit your *downstream client* usages of "what needs to change with this new type/status", and worse
2. Roll out the enum change in a way that doesn't immediately break clients

## What's Wrong with Enums?

Fundamentally enums assume they are modeling a taxonomy that is static, and an entity can belong to only 1 value in the taxonomy at a time.

This sort of simplification is actually very useful, it's kinda like [MECE](https://en.wikipedia.org/wiki/MECE_principle) for domain modeling behavior.

So it's hard to say this is "wrong", but it's this same simplicity (fixed set, can be only 1 value at a time) is exactly what makes evolving the set so hard, because the new value...

* New value that is completely distinct/does not overlap with previous values (the easiest)
* New value that is slightly overlapping with a previous value
* New value that effectively splits a previous value
* Removing a value

This 2nd type is the most annoying, b/c enums heavily assume each entity is singularly only a single enum type a time, i.e. an "author is large", a "book is draft", and

## What Can We Do Instead?

Instead of exposing the *current* taxonomy as a single value, and letting clients do what they like, I think it's a better idea to have the client ask precisely what they want to know, in a simple "yes or no" questions.

This frees up the constraints from MECE, i.e. each of these question will never have more than two answers (true or false), and entities are allowed to answer each question independently from how they answer the others. 

* Coupling of `thing.isStatus` is bad
* Should ask `thing.canOperation`?
* Should ask `thinkg.canEdit`?
* Should ask `thing.shouldSomething`?
* Should ask `thing.ofCategory`?

## But What about UX?

Business logic can often get by with "asking can, should, or of", but what about the UX? It's extremely column to have a "Status" column or a "Type" column in the UI.

For these, I've found that best practice, ironically, is to use an opaque string like `statusText` that returns values of `"Active"` or `"Draft"`, and have the UX drop the string directly into the UI.

Granted, it's a slippery slope to the UX now using `statusText === "Active"` for their business logic, and basically side-stepping our goals, but a) hopefully that can be caught by code review, and b) it at least means they have to handle the "unknown" case.

## Protobuf Solved This Already


