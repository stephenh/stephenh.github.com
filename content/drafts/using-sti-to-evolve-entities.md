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
  <img src="/images/sti/changing-wings.jpeg" style="width:40em;"/>
  Changing the wings of the airplane while in flight, courtesy of Gemini
</div>


For smaller changes, we can handle this with short-lived feature flags, and generally immediately migrating the whole system to the latest & greatest code/features.

But v2 features are often big enough changes that they are a) time-consuming to roll out, and b) sufficiently different from their v1 that clear upgrade paths may not exist for existing production data.

Our latest `Task` migration, for our "schedules v3" initiative was a particularly acute example of this, and in this post we'll talk through how we diagnosed and solved the problem, specifically with [Single Table Inheritance (STI)](https://martinfowler.com/eaaCatalog/singleTableInheritance.html) with [Joist](https://joist-orm.io/docs/advanced/single-table-inheritance), our in-house ORM.

## The Challenge

Without covering too many specifics, the `Task` entity is a core part of our system, as it handles both:

1. Core/obvious scheduling features (PERT planning, Gantt charts, assignees, etc.), as well as
2. Scheduling-adjacent features like task checklists, required sign-off documentation, and trade cost/client revenue information.

The challenge is that we want to swap like ~50% of #1 to a fairly drastic, probabilistic-based scheduling approach, but keep: a) the __other__ 50% of #1, and all of #2 blithely unaware about the new scheduling approach.

### ...these seems coupled?

There is a tangent/future post about "how did Task get co-mingled with other features", but my tldr is cross-feature cohesion is essentially the raison d'etre (reason for being) for custom software systems, because it lets users (and data) stay highly-contextual & inter-connected (within the same UI, you have task & financial information side-by-side, and each feature "knows about the other" to drive automation), vs. the users using ~4-5 different silo-d SaaS/internal products that fundamentally don't integrate with each other.

And so you pick your poison: use disconnected, silo-d OTS/SaaS products and stitch their disparate domain models together via glue code as best you can, or build a custom system that is highly integrated from the ground up.

That said, per this topic, you'll have "v1 to v2" migrations in either approach, i.e. with disconnected systems moving from Schedule Vendor 1 to Schedule Vendor 2, so the challenge of "changing the wings while in flight" still exists.

## Goals

So our goals were to:

1. Leave existing data/projects using Task v1 largely in-place,
2. Setup new data/projects using Task v2 (when released),
3. Have the "Task v1" and "Task v2" features know as little about the other as possible, and
4. Have rest of the system be largely agnostic about the v1/v2 dichotomy

And, of course, minimize both our short-term and long-term pain.

## Auditing Existing Usage

Our first step was to understand how `Task` was used in the system, to understand the impact of our proposed changes.

Given our system is a monolith, this was actually pretty easy to do: all incoming and outgoing connections (i.e. foreign keys from `tasks` to other tables, and foreign keys from other tables to `tasks`) to `Task` are listed in Joist's `TaskOpts` type, which a small sample looks like:

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

Joist also produces a "reactivity" report that further shows how `Task` is connected to the rest of the system, beyond the immediate foreign keys, via Joist's reactive rules & reactive fields features:

```txt
Task will trigger reactions in:
  HomeownerNote
    [homeownerVisible] -> homeownerNotes HomeownerNote.ts:127
  RequiredTaskDocument
    [documents] -> requiredTaskDocuments RequiredTaskDocument.ts:8
  ScheduleSubPhase
    [scheduleSubPhase,endDate,globalTask] -> scheduleSubPhase targetEndDate
```

Somewhat surprisingly, `Task` did not have a meaningful amount of reactivity, which was actually good news for our purposes!

So, just looking at `TaskOpts`, in total we had:

* 23 columns
* 7 outgoing relations
* 17 incoming relations

Which in total was about 50 pieces of data to consider.

We laid each of these out in a spreadsheet, with notes on "what is staying vs. being deprecated". This sheet had 50 lines, one for each field/relation, and a representative first handful were:

<div style="font-style: italic; display: flex; flex-direction: column; align-items: center">
  <img src="/images/sti/task-audit.png" style="width:50em;"/>
  Audit of our Task relations
</div>

## High Level Approaches

We generally had three approaches to consider:

1. Create an entirely new entity/table, like `tasks_v2` / `TasksV2`, or
2. Reuse the existing entity, and somehow manage the v1/v2 differentiation
3. Split the new entity/feature out into an entirely new service/its own domain model

The 3rd option was both too expensive to tackle immediately, and also lacked consensus on being the best long-term approach, so we focused on the first two approaches.

### Approach 1. Create a new Entity

In this approach, we'd create a new `tasks_v2` / `TaskV2` entity, which would have a clean-slate implementation.

* Pro: Clean slate for the new Task v2 feature

  This is the best for Task v2 feature itself, because there would be no legacy "if Task v1 / else Task v2" code immediately within the v2 scheduling system.

* Con: All non-deprecated Task v1 & Task-adjacent features need to **re-integrate** with Task v2

   Basically the opposite of the 'Pro', all other features would need to have "if Task v1 / else Task v2" handling in __their__ code.

At first, we liked the clean-break of creating a new entity, as did our product team, as to their eyes this was an entirely new scheduling system.

However, the goal of the Task v2 project was not solely to implement "just the new scheduling features" in isolation, but to also ensure the continuity of how `Task` integrates with the rest of the system.

Per the above audit, as we dug into the `TaskOpts` & started realizing how many other features would need to be taught about "the new task" entity, in a way that would add boilerplate to their integration without any change/upside to their specific integration, we started doubting this option. 

### Approach 2. Reuse the existing Entity

In this approach, we keep a single `Task` entity, which basically flips the pros & cons compared to the prior approach:

* Pro: Existing Task-aware features can stay largely untouched
* Con: Unclear how to manage the v1/v2 differentiation

So we're basically choosing whose life to make easier: the new Task v2 feature, or the entire rest of the system.

We also like to think of our system through the lens of a unified domain model, and [Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html), and within those contexts, **we were not actually introducing a new concept**, a new entity, to the domain. No user would speak of "two types of tasks on a project" (even though the v2 task will admittedly have a lot more functionality, it's still the same concept)--or, if they did, their "type of task" language would likely be a conceptual type like "construction task" vs. "sales task".

When articulated this way, that there is a single `Task` concept that both users and the majority of existing Task-adjacent code would like to keep using, without "which Task entity do I care about?" complications, we changed our mind and started digging into the easiest way to make Approach 2 work.

## Tactical Implementation Options

Digging into Approach 2, there were also several tactical options to "reusing the `Task` entity":

1. Add adhoc `if/else` handling to each v1-/v2-specific location within `Task.ts` & our `Task`-related GraphQL resolvers.

   In this approach, we'd add the v2-specific columns to the `tasks` table, deprecate the v1-specific columns in the `tasks` table, and then just generally add "if v1/v2" checks at random spots in the codebase. Like `old_column` is required for v1 tasks, `new_column` is required for v2 tasks.

   The "if v1/v2" checks would also be necessary in our domain validation rules (i.e. required rules and other business invariants), lifecycle hooks (i.e. on soft-delete, perform some side effect), and Joist reactive fields.

   This is doable, but it doesn't create any fundamental code-level differentiation between v1 & v2 tasks, and instead just scatters the differences randomly in the codebase.

   * Pro: Doesn't break any existing data/Looker reports that use `tasks`
   * Con: Requires making task v1/v2-specific columns nullable (shared table)
   * Con: No code-level differentiation between v1 & v2 tasks

2. Use [Class Table Inheritance](https://joist-orm.io/docs/advanced/class-table-inheritance) to model `TaskV1` and `TaskV2` as subtypes of `Task`, with a shared `tasks` "base table" and separate `tasks_v1` and `tasks_v2` sub-tables.

   We like judiciously using CTI, because it keeps a very clean modeling of "this entity has polymorphic subtypes" within both the database schema and the domain model. For example, it lets each subtype have strong database-level constraints and subtype-specific FKs (both outgoing & incoming); (the Joist STI documentation goes more into these details).
   
   However, needing to move the `TaskV1` columns would defeat the goal of minimizing outside observability of the change, and also we don't really want "TaskV1" and "TaskV2" concepts in our domain model, which is what CTI is best suited for. We're looking more of an implementation hack. 

   * Pro: Code-level differentiation between `TaskV1` and `TaskV2` sub-types
   * Pro: Allows keeping task v1/v2-specific columns not-nullable (dedicated sub-tables)
   * Con: Breaks existing data/Looker reports that use `tasks` (task v1 columns move to `tasks_v1` sub-table)
   

3. Use [Single Table Inheritance](https://joist-orm.io/docs/advanced/single-table-inheritance) to model `TaskV1` and `TaskV2` as subtypes of `Task`, but all in a single shared `tasks` table.

   While CTI is a purist approach to modeling polymorphic subtypes, STI is a more pragmatic approach that allows for a shared table, and so doesn't break existing data/Looker reports that use `tasks`.

   * Pro: Code-level differentiation between `TaskV1` and `TaskV2` sub-types
   * Pro: Doesn't break existing data/Looker reports that use `tasks`
   * Con: Requires making task v1/v2-specific columns nullable

Because of the pros/cons discussed above, we've historically preferred using CTI in our domain model, but for this project decided that STI to be the best approach.

## Adding STI Support to Joist

One wrinkle was that our in-house ORM, Joist, did not support STI at the time we were evaluating approaches.

This introduced initial risk into the decision, but thankfully it was ~a hack day of effort to [add support for STI](https://github.com/stephenh/joist-ts/pull/966). This was primarily because Joist already had CTI support, which is generally the harder of the two models to implement, so adding STI was a relatively minor effort.

While building the STI support in Joist, we implemented a few features to make it "more CTI-ish":

* Domain-level enforcement of not null

  To mitigate the lack of `NOT NULL` constraints in the database itself, we added support for `stiNotNull: true` flags in the `joist-config.json` file, for Joist to do domain-level enforcement of not-null fields, as well as mark the field as required / non-optional in the type system.

* Tagging of FKs for "v1" or "v2" tasks

   When an incoming foreign key points to the `tasks` table, i.e. something like `trade_payment.task_id`, it can be useful to know whether the FK was meant to point at "any task" or a specific v1/v2 subtype (which, per above, is a "pro" of CTI that STI lacks).

   I.e. usually FKs that are implementation details of the v1 feature should point to "only v1 tasks", while implementation details of the v2 feature should only to "only v2 tasks". 

   To mitigate this, we added support for tagging incoming foreign keys with `stiType: "TaskV1" | "TaskV2"` in `joist-config.json`, which Joist will then use to: a) validate the FK value is the correct type at runtime, and b) use the respective `TaskV1` / `TaskV2` type in the type system.

Both of these features made the STI-based `Task` base types and subtypes much more "CTI-ish" in dev ergonomics, which we liked.

## Tangent on Naming

While I've used `TaskV1` and `TaskV2` as the "v1" and "v2" entity names in this post, having "v1" and "v2" in entity names is admittedly kind of gross, so we brainstormed some alternative names and ended up:

* `ScheduleTask` as the "v1" task name, which worked well because the previous system was very "schedule-centric", and
* `PlanTask` as the "v2" task name, as the new system is more "probabilistic planning-centric".

These are admittedly somewhat arbitrary, but we liked the idea of, a year from now when we've aged the `ScheduleTask` / v1 feature entirely out of the system (fingers crossed!), we'll be left with a good/proper name for `PlanTask`.

## Implementation Steps

* Add type_id to `tasks`, default it to v1
* Add `TaskV1` as the sole STI subtype
* Move initial V1-specific columns into `TaskV1` subtype
* Keep as many callers as possible using the `newTask` base type
* Move callers/tests that break to `newTaskV1` subtype
* Introduce `TaskV2` as second STI subtype
