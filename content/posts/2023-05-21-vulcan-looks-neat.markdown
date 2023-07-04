---
date: "2023-05-21T00:00:00Z"
title: Vulcan.io Looks Amazing
categories:
  - Architecture
---

A friendly recently pointed me to [James Long](https://twitter.com/jlongster)'s YouTube talk on [CRDTs for Mortals](https://www.youtube.com/watch?v=DEcwa68f-jY&t=1s).

IANAE on CRDTs, as I only check in on them ~once/year whenever a CRDT post goes by HackerNews, and historically it seems like they've focused on document editors, i.e. collaborative google docs, rich text editing, etc., which is interesting but not something I've personally needed/worked on.

However, James's application of CRDTs was to entities--rows in a database--for offline first applications, which is much closer to the sort of problems that I care about.

At first, I didn't see how the CRDTs of "collaborative rich text editing" would apply to offline sync of entities, but James's adroit point is that "CRDT" just means "any conflict free algorithm", and you can achieve this over entities (with trade-offs) with essentially a fancy `history` / audit table.

I'm very familiar with traditional audit logs like [CyanAudit](https://pgxn.org/dist/cyanaudit/), which are a) centrally-/backend-controlled, b) record writes _after_ they happen, and c) always march forward in time (w/inserts ordered by like the Postgres `NOW()` function)--but how can these solve offline sync?

The primary "trick" with James's approach is that the `history` table is allowed to have out-of-order-to-us rows added to it, whenever we receive events from any offline peers (i.e. the server receiving client `history` rows, or the client receiving server `history` rows). But then as long as both sides use [logical clocks](https://martinfowler.com/articles/patterns-of-distributed-systems/hybrid-clock.html) to order their copies of the `history` table, and update their primary entity tables based on that ordering, they will both converge to the same values.

And that's basically it: the `history` table is now a deterministic CRDT by treating each entity row as a "LWW Map" (last-write-wins map).

I suppose this is (grossly) similar to using an `updated_at` column to decide "last write wins", but it has the advantage of:

1. Using logical clocks to handle clock drift/skew across machines, and
2. Support last-write-per-column instead of just last-write-per-row

And the best part is that, while writes need to go through the `history` table (essentially like a CQRS stream of write events--albeit ordered by logical clocks), the rest of the app gets stock entity/database tables, like `authors`, `books`, etc. to do its reads from, and can be blithely unaware/decoupled from the complicated/offline sync part of the system.

Coincidentally, the wrinkle of "send all writes through the `history` table" is something that [Joist](https://joist-orm.io/) could do very easily--instead of issuing `INSERT`s directly to the `authors`, `books`, etc. tables during `em.flush`, it could do the appropriate `writeHistory('authors', 'title', ...)` operations and then both the application's read business logic _and_ write business logic would be decoupled from the offline sync logic.

Granted, all of this so far is just me catching up to what James built three years ago. :-) 

However, what's also neat is that, after searching for "sqlite crdts", I came across [Vulcan.io](https://vlcn.io/), which is the same basic approach but rolled up/productionalized as a SQLite extension that just implements the magic for you.

Besides just overall polish/maturity, I think a really neat approach is that Vulcan is extending their CRDT support from just "last write wins" to things like "atomic counters" and even the traditional "rich text editing", _but_ in a very generic/seamless way, by [using special column data types](https://vlcn.io/cr-sqlite/custom-syntax) to denote which CRDT algorithm each column should use.

This seems super-neat.

Overall, I think my only concern with the CRDT/Vulcan approach is that both the basic "last write wins" and even more advanced "counter" / "peritext" CRDTs don't actually enforce transactional semantics--like representing in `history` which transactions each event was part of, and then ensuring transactional integrity while applying the potentially-out-of-order writes.

That said, for hobby projects/many Q&D CRUD apps, I think the productivity win of Vulcan would be so huge that it would offset any gotchas wrt to transactional out-of-order-ness.

For applications that need more serious "server-controlled business logic", personally I'd still want to use [Replicache](https://replicache.dev/), or at least their model of dual-implementing mutations/command patterns on both the client + server, such that we don't sync/trust raw client-side CRUD data, but instead let the server replay each of the client's logical commands, and have the server authoratively decide the outcome.

The biggest downside of Replicache itself is that it's implemented as a key/value store, and not a SQLite database with a regular schema--imo this is a big limitation, and would likely keep me from using Replicache, although ironically it seems like it's been a boon to their [Reflect](https://reflect.net/) product, which is Replicache on top of Cloudfare's [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/), which seems like a perfect pairing.







