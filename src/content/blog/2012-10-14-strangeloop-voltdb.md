---
title: Strangeloop 2012--VoltDB
description: ""
date: 2012-10-14T00:00:00Z
---



I really enjoyed going to Strangeloop this year. The signal-to-noise ratio of the presentations and conversations with other attendees was great.

Embarrassingly, I'm finally getting around to writing some blog posts about it. I had wanted to do a single review post, but that turned out to be unrealistic, so I'll do a series of smaller ones about the specific topics/presentations I enjoyed.

The opening keynote was [VoltDB](http://www.voltdb.com), a next-generation "NewSQL" relational database built by database industry guru [Michael Stonebraker](http://en.wikipedia.org/wiki/Michael_Stonebraker).

A Look at "OldSQL" Architecture
-------------------------------

I was initially skeptical of this keynote, as keynotes are not usually product-based, but most of Stonebraker's talk ended up as a convincing argument that the fundamental architecture of current-generation databases has hit its scalability limits.

While this is not really news in terms of NoSQL/BigData products these days, it was nonetheless interesting to hear, from a relational database expert, a logical explanation of exactly what parts of current relational database architecture are slow and why.

For example, based on profiling (covered in [OLTP Through the Looking Glass](http://nms.csail.mit.edu/~stavros/pubs/OLTP_sigmod08.pdf)), Stonebraker's assertion is that only 10% of time is spent doing real work, like updating the core data structures and indexes, and the other 90% is secondary concerns like waiting for disk IO, locking, etc.

Which means that traditional ways to speed up databases (novel B-tree algorithms/etc.) really can't do much if the rest of the incidental cruft remains.

Deadpans NoSQL
--------------

Given Stonebraker is an old-school RDBMS guy, he also had a unique perspective on NoSQL.

As he tells it, he lived through a phase in the industry (late 60s/70s?), before the relational model "won", and before ACID was taken for granted, where there were competing technologies and data models, each vying for prominence.

His point was that, looking back, relational- and ACID-based models won for a reason--they greatly simplify life for the application programmer.

So, he asserts that NoSQL-style eventual consistency isn't the answer, it's actually a step backwards, with a cheeky quote that "eventual consistency means 'creates garbage'" (ha!).

I am inclined to agree, and have hoped for awhile that eventual consistency will be a passing fade until database technology catches up today's operational constraints. Products like VoltDB and Google's [Spanner](http://research.google.com/archive/spanner.html) make me optimistic that this will be the case.

VoltDB as "NewSQL"
------------------

So, finally, Stonebraker talked about VoltDB as a "NewSQL" approach, which forgoes the traditional architecture by being single-threaded within a partition (no locking), in-memory (no disk, network-based replicas), and moving the computation to the data (stored procedures).

By doing this, VoltDB still provides ACID, but with impressive vertical scalability improvements, and, via partitioning, horizontal scalability as well.

I have to admit that the architecture sounds pretty sexy--it has all of the things you look for in a system that can scale--in-memory, little contention, horizontal scaling.

Where's the Middleware?
-----------------------

My biggest concern about VoltDB is that it requires a huge change to how applications are currently built--you can only invoke stored procedures.

This is because you no longer get cross-wire call transactions, like in SQL/JDBC where you can do "begin transaction, select ..., select ..., update ..., commit", interspersing business logic with your SQL calls, and still have it all complete transactionally and with some amount of read isolation.

Instead, with VoltDB, every wire-call to the database is its own transaction. That's it. This is where VoltDB gets some of its big wins, because it doesn't have to do any locking/versioning to keep a transaction "in flight" while waiting for your application's next wire call (which may take awhile or never come back).

Which makes sense--but it's a huge change to today's N-tier/middleware-based architectures, as you have to move any logic that must be transactional into VoltDB's stored procedures.

This is a tough pill to swallow; any sort of domain model/ORM-based architecture goes away, as they are usually predicated on a chatty SQL connection that still provides cross-wire call transactions.

Moving Computation to Data?
---------------------------

Stonebraker asserts this requirement for stored procedures is "moving the computation to the data", which is a popular approach to BigData; instead of moving TBs of data to your client/middleware machine, you ship your code directly to the database machine.

But VoltDB seems different--the types of computation stored procedures allow you do are not general purpose computations, e.g. making calls to other systems (you can't do anything that will block), nor do any real heavy calculations (again would block), it's just a way to batch a few SQL operations together.

I suppose this is similar to Hive, but the limitation seems more natural for Hive because your almost always doing just variation SQL-ish transformations on your data, and not real business logic.

Anyway, perhaps it is just my bias, but I'd prefer to keep computation at the middleware layer.

Potential Compromise
--------------------

If I were to pick up VoltDB, I think I would try to keep a traditional domain model/ORM-ish architecture, and just use optimistic locking to enforce transaction isolation.

So, if my middleware did something like:

```scala
orm.beginTxn();

// one call to VoltDB
val b1 = BankAccount.load(1);
b1.balance += 10;

// another call to VoltDB
val b2 = BankAccount.load(2);
b2.balance -= 10;

// sends update b1 and b2 as 1 call/transaction
orm.commitTxn();
```

The UPDATEs for `b1` and `b2` would happen atomically.

But what about read isolation? I think optimistic locking would work for this, e.g. the SQL on the wire would really be:

```sql
-- b1 = BankAccount.load(1)
SELECT id, balance, version FROM bank_account WHERE id = 1;
-- b1.balance += 10

-- b2 = BankAccount.load(2)
SELECT id, balance, version FROM bank_account WHERE id = 2;
-- b2.balance += 10

-- orm.commitTxn
UPDATE bank_account SET balance = 20, version = 2
  WHERE id = 1 AND version = 1;
UPDATE bank_account SET balance = 0, version = 3
  WHERE id = 2 AND version = 2;
```

So, now if anyone else has touched either `bank_account` in between my read and my write, the `version = 2` clause will fail, and I'd know the data is stale.

The trick would be that I'd need VoltDB to fail the whole transaction if the `UPDATE` modified count for any of the statements was zero.

This is basically moving isolation enforcement to the client, meaning it would have to fail or retry if the optimistic lock failed. I would be fine with that though, as optimistic locking is easy to build into an ORM.

With a bit of work, I could see an ORM like [Joist](http://joist.ws) supporting VoltDB as a backend just like the traditional MySQL/Postgres backends.

Unfortunately, I don't think VoltDB can do this today--the client API can only invoke stored procedures, so it would require a sort of meta-stored procedure that took a list of tables/values to update and iteratively `eval`'d them.

Operational Concerns
--------------------

My only other concern with VoltDB is that it's a new piece of infrastructure software that requires learning the ins/outs of. And since it owns your data, you want to make especially sure you don't mess something up.

This is not VoltDB's fault, it's just the reality of relying on a new software package. I've seen a few bad things happen before when deploying new software that were not the software's fault, but a configuration misunderstanding or error. You just hope that you catch these sort of things before your data is gone.

In that regard, I'd enjoy seeing a RDS-style offering for VoltDB--I don't want to log into servers, configure clusters or logging, or whatever, I just want a GUI that says "give me X many servers, go!".

Tangentially, it would be awesome if Amazon RDS let vendors build their own integrations, so you really could have a "VoltDB Engine" drop-down option in RDS, but supported by VoltDB instead of Amazon staff.

It is not realistic for Amazon RDS themselves to support/integration all of the myriad of new databases available these days, so it would be great if RDS was more of an open marketplace through which vendors themselves could make their databases available as a PaaS.

Conclusion
----------

I've really enjoyed looking into VoltDB.

I haven't had time to play with the community edition locally yet, but I'm going to try that soon and see how it goes. I'm not really sure what the application development/test/deploy cycle will look like, which I'm sure one of their tutorials will cover.

So, in retrospect I was surprised, but I thought the Stonebraker's VoltDB keynote was very good, and it has me checking out their product. I definitely recommend watching the video, which I'll link to here in a few weeks when Strangeloop makes it available online.

