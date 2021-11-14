---
date: "2012-09-16T00:00:00Z"
title: Aggregate Roots in SQL
---

{{page.title}}
==============

I'm reading through a paper on Google's [Spanner](http://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en/us/archive/spanner-osdi2012.pdf), a distributed database that maintains transactions.

One interesting snippet is how they've added aggregate roots as a first-class concern in the schema, which is still SQL-eque, e.g.:

    CREATE TABLE Users {
      uid INT64 NOT NULL,
      email STRING
    } PRIMARY KEY (uid), DIRECTORY;

    CREATE TABLE Albums {
      uid INT64 NOT NULL,
      aid INT64 NOT NULL,
      name STRING
    } PRIMARY KEY (uid, aid),
    INTERLEAVE IN PARENT Users ON DELETE CASCADE;

Where `DIRECTORY` declares `Users` as a top-level aggregate root, and `INTERLEAVE IN` declares `Albums` as a member of the `Users` aggregate root.

(I'm using "aggregate root", as terminology from Evan's [Domain Driven Design](http://en.wikipedia.org/wiki/Domain-driven_design).)

I think this is a pretty exciting, albeit somewhat obvious, evolution of relational schemas to handle NoSQL-scale datasets.

Obviously people have been doing this by hand for a long time, but moving it into the database just makes sense. (It's likely other systems I'm not aware of had already done this; this is just the first I've seen, and especially one that builds it into the SQL schema).

I haven't finished the paper yet, so I don't know if they support cross-aggregate root joins, but they seem to definitely support cross-root transactions.

So, this has me wondering: if giving the database locality hints works so well, why wasn't this done before? E.g. for just regular/pre-NoSQL/on-spinning-disks databases?

Even without being distributed, it seems like it'd make sense for a database to be able to layout related data (all of the records within an aggregate root) close together on disk, to minimize IO.

E.g. if all of an employee's transactions where in basically-sequential order on disk, retrieving them would be cache-/IO-friendly and so very fast.

A few thoughts:

1. With SSDs removing the spinning disk, I suppose physical layout on disk isn't that important anymore, at least for single-machine databases. Although that doesn't answer why it wasn't done before...

2. It would require the database to constantly reorder data to fit the aggregate root grouping; this would likely be expensive, especially to do real-time.

   However, this reminds me of Google's [BigTable](http://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en/us/archive/bigtable-osdi06.pdf), which, after committing the data to a redo log to ensure consistency, delays the larger on-disk data reordering/compaction so that it's only done infrequently and not as part of a client request.

3. Perhaps this is actually doable and pretty routine/old-hat with various databases out there?

   I haven't noticed it before, but that does not mean much.

4. Perhaps it actually would not help that much.

   I'm not an expert on RDMBS literature, or a wide variety of systems, so perhaps this was tried already and deemed not worth it. Seems unlikely to my current intuition, but I suppose I should trust 30 years of RDMBS research over my 5 minutes of musing.

Seems like a good question for an RDMBS implementation expert, not that I know any to go bug them about it..

