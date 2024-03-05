---
date: "2024-03-04T00:00:00Z"
title: Using Single Table Inheritance to Evolve Entities
categories:
  - Joist
draft: true
---

## Context

At [work](https://www.homebound.com), we've had a system in production for long enough that now we get the pleasure of building v2-s (...or v3-s...) of our features.

While continual improvement is exciting, given each v1 feature is in active use, we end up "changing the wings of the airplane while in flight".

<div style="font-style: italic; display: flex; flex-direction: column; align-items: center">
  <img src="/images/sti/changing-wings.jpeg" style="width:30em;"/>
  Changing the wings of the airplane while in flight, courtesy of Gemini
</div>


For smaller changes, we can handle this with short-lived feature flags, and generally immediately migrating the whole system to the latest & greatest code/features.

But v2 features are often big enough changes that they are a) time-consuming to roll out, and b) sufficiently different from their v1 that clear upgrade paths may not exist for existing production data.

Our latest `Task` migration, for our "schedules v3" initiative was a particularly acute example of this, and in this post we'll talk through how we diagnosed and solved the problem, specifically with [Single Table Inheritance (STI)](https://martinfowler.com/eaaCatalog/singleTableInheritance.html) in our [Joist](https://joist-orm.io/docs/advanced/single-table-inheritance) in-house ORM.

## The Challenge

Without covering too many specifics, the `Task` entity is a core part of our system--besides the obvious features of scheduling (PERT planning, Gantt charts, assignees, etc.), `Task` is also integral to other scheduling-adjacent features like task checklists, required sign-off documentation, and trade cost/client revenue information.

### ...this seems coupled?

There is a tangent/future post about "how did Task get so co-mingled with other features", but my tldr is cross-feature cohesion is essentially the raison d'etre (reason for being) for custom software systems, because it lets users (and data) stay highly-contextual & inter-connected, vs. the users using ~4-5 different silo-d SaaS/internal products that fundamentally don't integrate with each other.

And so you pick your poison: use disconnected, silo-d OTS/SaaS products and stitch their disparate domain models together via glue code as best you can, or build a custom system that is highly integrated from the ground up.

That said, per this topic, you'll have "v1 to v2" migrations in either approach, i.e. with disconnected systems moving from Schedule Vendor 1 to Schedule Vendor 2, so the challenge of "changing the wings while in flight" still exists.

## Goals

So our goals were to:

1. Leave existing data/projects using Task v1 largely in-place,
2. Setup new data/projects using Task v2 (when released), and
3. Have the rest of the system be largely agnostic about the v1/v2 dichotomy

And, of course, minimize both our short-term and long-term pain.

## Auditing Existing Usage

The first step was to understand how `Task` was being used in the system, so we could understand the impact of our changes.

Given our system in a monolith, this was very easy to do for all incoming and outgoing connections to `Task`, by looking at the `TaskOpts` file in Joist, reduced for brevity here:

```ts
export interface TaskOpts {
  // All primitive columns & enums...
  durationInDays: number;
  startDate: Date;
  isStartNode?: boolean | null;
  baselineStartDate?: Date | null;
  internalNote?: string | null;
  
  // Also any "outgoing" FKs to other parts of the system
  internalUser?: InternalUser | InternalUserId | null;
  tradePartner?: TradePartner | TradePartnerId | null;
  invoice?: Invoice | null;
  
  // Also well as any "incoming" FKs that depend on task
  billLineItems?: BillLineItem[];
  homeownerContractDraws?: HomeownerContractDraw[];
  requiredTaskDocuments?: RequiredTaskDocument[];
  documents?: Document[];
  jobLogNotes?: JobLogNote[];
}
```

In total, we had:

* 23 columns
* 7 outgoing relations
* 17 incoming relations

Which in total was about 50 pieces of data to consider.

<div style="font-style: italic; display: flex; flex-direction: column; align-items: center">
  <img src="/images/sti/task-audit.png" style="width:50em;"/>
  Audit of our Task relations
</div>

## Approaches


* Context
  * Tasks V1 -> Tasks V2
* Goals
  * (Eventually) jettison the old Tasks V1 functionality
  * Add new functionality for Tasks V2
  * Minimize the pain of: new v2, breaking v1, and future maintenance costs
* Audited usage
  * Basically just read the `TaskOpts` file in Joist, this showed us all outgoing & incoming connections

Options

* New Entity
* Shared Entity
  * Adhoc 
  * CTI (breaking SQL changes, not true domain polymorphism)
  * STI (non-breaking)

Steps

* Add type_id to `tasks`, default it to v1
* Add `TaskV1` as the sole STI subtype
* Move initial V1-specific columns into `TaskV1` subtype
* Keep as many callers as possible using the `newTask` base type
* Move callers/tests that break to `newTaskV1` subtype
* Introduce `TaskV2` as second STI subtype
