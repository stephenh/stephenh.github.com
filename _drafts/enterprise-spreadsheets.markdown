---
title: Enterprise Spreadsheets
section: Architecture
layout: draft
---

{{page.title}}
==============

Early in my career, I worked in enterprise consulting. I worked with a good friend, and we wandered around to various clients doing various things.

Our largest gig, before going on to other things, ended up being your typical enterprise consulting project: take a ~non-small line of business application with a ~non-small team and make some ~non-small changes to it over a ~non-small amount of time. And that was pretty fun.

Also while working for these clients, my friend coined a term that generalized what we were often asked to build: enterprise spreadsheets.

I.e. at the end of the day, basically all of our IT/enterprise consulting work was "take what is essentially an Excel spreadsheet, shove a crap load of business logic in to it, put it in a 'real database', wrap it with 'real application code', with a 'real UI', and scale it to drive a medium-to-large revenue business, while fucking up as little as possible".

Many systems really are spreadsheets
------------------------------------

Since then, I've come to realize this phrase rings true more than most of us would probably like to admit.

For example, the ads systems I've worked on? Those were "enterprise spreadsheets" of clients and I/Os and campaigns and creatives. The click and impression data, e.g. "big data", were also, perhaps even more so, spreadsheets-in-the-large.

Or the messaging systems I've worked on? Those were "enterprise spreadsheets" of customers and organizations and groups and users and permissions and streams and chats.

Granted, there are niches where this is not the case, e.g. in ads the machine learning around bid optimization is definitely "not a spreadsheet".

So, you may be in an enterprise or startup and doing "not a spreadsheet" work, but it's ~90% likely that you actually are, whether you realize it or not.

Hurray, nothing is new
----------------------

There are a lot of generalizations that came out of realizing your system is "just an enterprise spreadsheet":

* Basically everything is about entities ("sheets" in a spreadsheet or tables in a database or documents in a key/value store)
* Entities will always have fundamental properties. You want those to live in a single source of truth.
* Entities will always have derived properties that you need to calc in some non-shitty manner.
* Entities will always have derived properties that you'll be tempted to cache/materialize in some non-shitty manner.
* Business rules will always exist within (easy) and across (harder) entities and need to be triggered easily and correctly.
* Entities will often scale outside of a single machine.
* Indexes will often scale outside of a single machine.
* Application screens will ~80% of the time be "show me this entity in a slightly unique way that cannot not be buggy or boilerplatey but is also not generic enough to codegen".
* All of these (entities, business rules, and screens) will need to change on a regular basis, and changing them should be easy to reason about and easy to perform.

You can go back to ~1960 mainframe/green screen programming and all of these were true.

You can go back to ~2000 Java EJB programming and all of these were true.

You can go back to ~2010 Rails/jQuery programming and all of these were true.

Today with React/GraphQL/Dynamo all of these are true.

Is this depressing?
-------------------

So, once you accept my assertion that "basically everyone in the tech industry is just building enterprise spreadsheets over and over again", I think there are generally one of two potential reactions to that:

1. This is depressing, I want out.

   E.g. once you've reasoned about "how do I materialize a view" in Oracle, or Postgres, or Dynamo, or ..., is it really that different in the next data store? Usually not.

   For some people, this is very demotivating as there are often not novel challenges on a daily basis.

2. This is a pattern, I want to optimize it.

   This is more optimistic, which is to realize that, yes, everything is the same, so at least try to make things as boring/fast/reliable as possible.

(There is technically a 3rd option, of being generally ambivalent and just continue to punch the clock, which is nothing wrong with that if that's your style.)

