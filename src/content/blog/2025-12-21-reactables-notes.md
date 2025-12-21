---
title: Reactables Notes
description: "Short notes on the Basecamp Reactables pattern"
date: 2025-12-21T00:00:00Z
tags: []
---

Notes from [this podcast/transcript](https://dev.37signals.com/the-rails-delegated-type-pattern/).

I'm interested in the topic b/c "feeds" & "versioning" & "(comments | copying | etc) on anything" are common features are many CRUD/enterprise spreadsheet apps.

* `Event`s are "any write that needs to show up in the feed"
  * This is the driving use case: paginate "all changes/writes in this Basecamp project across all entity types"
  * And show the change as an "old => new" diff

* All `Event`s are "recording x now points to recordable y"
  * I.e. `recording:1` gets mutated from pointing at `message:1` (its recordable) to `message:2` (new recordable)
  * Anything that will be "in the feed" must a `Recording` and use the `Recordable` pattern
  * It's like CTI but the "base type" changes "which subtype row" it's pointing at (versioning)
  * The `recording:1` is similar to our "identity": it's the stable identity that logically persists over time
  
* `Recording` is like a base type, almost like an `Entity` type
  * Not literally every entity/table in the system is a `Recording`, only the "content" entities the user is interacting with--almost like a CMS
  * You end up with billions of rows in `recording`, b/c every message/comment/etc is owned/wrapped by a `recording`

* `Recordable` is a term for "bag of primitives" that is the "current value" (and type) of any given `Recording`
  * Afaict `Recordables` have no FKs--all FKs are on `Recording`
  * Seems weird, how do you show/version FK changes? I.e. `message.category_id` changing from `c1` to `c2` -- maybe `message.category_name` is materialized in the `Message` recordable, so it's a dumb/static value to diff?

* Recordings are a tree of entities
  * I.e. a `Project` owns `MessageBoard` owns `Message`s, and `Message`s own `Comment`s are all actually nested `Recording`s with their respective subtypes 
  * Because all FKs are on the `Recording` (weird?) really "any `Recording` can own any child", but only `MessageBoard` opts in to "owning `Message`s" and `Message` opts in to "owning `Comment`s"
    * I.e. if you want `Message`s (a recordable) to be categorized, then *all* recordings are now "Categorizable" (can point to a `Category`), but only the `Message` subtype opts in
    * Opt in is probably something cute like a Ruby `include HasMessages`

* The `Recording`s mean you can/must use polymorphism for everything
  * I.e. a single `copy` controller, a single `archive` controller, a single `move` controller that all accept a `Recording` id and "just work" for all `Recordable`s
  * Each `Recordable` likely has to implement it's own `doCopy()` logic?
  * Makes it very easy to add new entities, like "we need a `HillChart`", oh and just "turn on" comments, "turn on" etc.

* `Bucket`s are at the top of the tree (?) and act as a unit of permissions
  * Moving/copying between buckets requires the `move` controller

---

Relating to Homebound:

* We've had `Reference` / `Referencable`
* Also `Collaboration` and `Commentable`
* I wonder how/if they show trees/parent+child changes as "a single row" in their feeds--they probably don't & just "say no"

---

Global undo pattern:

* Should every mutation be a `Command`, and `Event` know "what command they were"
* Then each `Command` implements its own `undo()` method?
  * Seems tedious 👎
* A universal `undo` as "just put the recordings back to the old recordables" seems nice
  * Any `undo` must fundamentally capture/know the old values
* Would auto-save create a diluge of `Event`s? Maybe "same user/within edit window" actually mutates the current recordables?
  * Only if same mutation, i.e. `saveUser` then immediate `copyUser` should not combine
* Each low-level `Event` of recording x -> y is ideally grouped into a `Transaction`s / `Action`s that can be undone as a whole.
* Basically creating an application-level WAL log
  * ...every "content" table has a `first_id` / `final_id` pattern...
  * This would 2x the number of tables across the app
* Eventually prune/age off `Transaction`s?
