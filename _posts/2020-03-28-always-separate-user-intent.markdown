---
layout: post
title: Always Separate User Intent
section: Architecture
---

{{page.title}}
==============

I've had a rule of thumb for data modeling that unfortunately I forget on a regular basis, so I thought I'd write it down to maybe help myself actually use it more.

The rule of thumb is "always separate user intent from derived behavior/business logic".

This rule is particularly applicable to things like `state` or `status` fields, which have a way of becoming "half-user controlled" and "half-system controlled".

As the most recent example where I've run across this, consider a system of tasks for a stereotypical "tasks have predecessors/successor in a project plan":

<img src="/images/always-separate-user-intent - tasks.jpg" class="image" />

In terms of data model, we'll focus on just a few things:

* There is a task `status` field that has three potential values: `NotStarted`, `InProgress`, and `Complete`
* The requirements state that the system handles all `NotStarted <-> InProgress` transitions, i.e. it "auto-starts" tasks once preceeding tasks are `Complete`.
* However only the user can say "this task is actually done (or not done)".

An Okay Way
-----------

An initial attempt at modeling this is a single `Task.status` field that is an enum of `NotStarted`, `InProgress`, and `Complete`.

Then we use business logic to do "not rocket science but still somewhat nuanced" things like:

* Anytime a predecessor task changes _maybe_ change the successor Task's `status`, but only if it's not `Complete`
* In the UI, treat `status = Complete` as "you checked complete" but `status = NotStarted | InProgress` as "you didn't check complete"

This is all fine and not that bad, but we end up with a "sometimes the field is written by X and sometimes it is written by Y":

<img src="/images/always-separate-user-intent - single-status.jpg" class="image" />

Which is not terrible, but generally more of a "business logic is hidden in susceptible-to-being-spaghetti 'push' code".

I.e. it's pretty common in this setup for, if the user _unchecks_ "task is complete", to forget to re-run the "ah right, set it back to the 'based on predecessors' value" logic.

A Better Way
------------

Generally a cleaner way of modeling things is to strictly delineate user intent from derived behavior, i.e.:

* The user intent of "this is complete yes/no" is it's own "thing" (database field)
* The calculated "potential status based on predecessors" logic is it's own thing (derived field)
* The calculated combination of "status based on user intent or potential status based on predecessors" is it's own thing (another derived field)

I.e. our data model would move from having a single `status` field to:

* `Task.is_complete` is a boolean that is directly/always controlled by the user intent to mark "yes, this is/is not done"
* `Task.status_based_on_predecessors` (probably not stored/persisted, so not a real column-in-the-db) does the calc of "this task should be `InProgress` if all predecessors are `Complete`, otherwise `NotStarted`"
* `Task.status` still exists, but is now derived (although likely still persisted for simplicity of reads) by the calculation "if `is_complete` then `Complete` else `status_based_on_predecessors`" i.e. `InProgress` or `NotStarted`

This moves the model to be more like a DAG of inputs with nodes of calculated values:

<img src="/images/always-separate-user-intent - separate-intent.jpg" class="image" />

Which makes the application logic more functional, more reactive, rather than  `if` statements sprinkled in various places.

Granted, a separate but tempting tangent is that reactive / data flow paradigms have not generally taken hold on the server-side yet, especially at a "more than just lifecycle hooks within a single micro-service/monolith/ORM codebase" scale, so you still have to generally nudge/wire these derived values together, but I think the end result is still cleaner than the original "fuzzy ownership of a single field" approach.


