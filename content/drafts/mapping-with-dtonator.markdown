---
draft: true
title: Mapping with Dtonator
---

Mapping between domain objects and DTOs can be one of the more tedious aspects of a system.

It's fine if you're, say, integrating with a vendor and only mapping 4-5 of your domain objects system onto 4-5 DTOs for their remote API.

But if you end up with lots of DTOs, e.g. exposing half/most/all of your domain model as DTOs, then you're on a quick path to boilerplate if you don't find a way to simplify or automate your mapping.

I used to roll my eyes at systems that were rife with DTOs, primarily because they were so prone to boilerplate. "Why would you *do* that?" At the time, I asserted a few alternatives:

1. If the DTOs are going to another internal system, just let that system integrate with your domain model directly (e.g. as a jar file in memory), and talk SQL back to your database just like your regular application does.

   This is a pretty easy win if it works for you, but it's not a panacea. Obviously it doesn't work for external systems, whom you can't trust with an open connection to your database.

   And it also means you have more applications directly coupled to your database, meaning you have to coordinate releases/migrations/etc. around them as well as your primary application.

2. Just expose your domain objects directly. I.e. have your API serialization layer ([Jackson](http://jackson.codehaus.org/) or what not) map directly from the wire protocol (JSON/XML) to/from your domain objects.

   This can be good too--however, I think it's actually rather rare, for a few reasons.

   For one, you'd need to be careful about security--that even if your serialization tool supported it, you don't want to open up your entire domain layer to the wire.

   E.g. if a client is sending an employee, you don't want them to be able to write into the employee's employer just by sending `employee.employer.name = 'ha!'` as one of the JSON values. (While the possibility of user's doing this might seem remote, but it was actually a bug in Rails that was used to hack GitHub.)

   Also, clients often request specific data, either to minimize the payload size (leave out large fields) or minimize wire calls (bring it all back in 1 request instead of N requests).

   Typically serialization frameworks don't map directly onto your domain objects

