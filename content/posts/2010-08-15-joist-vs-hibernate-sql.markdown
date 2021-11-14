---
date: "2010-08-15T00:00:00Z"
section: Joist
title: Joist vs. Hibernate SQL
---

Joist vs. Hibernate SQL
=======================

Lately I've been mulling how/whether to implement [prefetching](http://www.draconianoverlord.com/2010/07/16/orm-prefetching.html) in [Joist](http://joist.ws/orm.html).

To explore the idea, I tried out Hibernate's subselect prefetching functionality, and it works really well.

But I've been using Joist for long enough now that I had forgotten what Hibernate's SQL looks like. And how I've tweaked Joist to, out-of-the-box, just do things intelligently (especially for Postgres).

For example, my test case was inputting 1 parent, 2 children, and 4 grandchildren in an object graph, to see what the SELECTs would look like.

Here's Hibernate (using `hibernate.show_sql=true`):

```sql
select nextval ('parent_id_seq')
select nextval ('child_id_seq')
select nextval ('grand_child_id_seq')
select nextval ('grand_child_id_seq')
select nextval ('child_id_seq')
select nextval ('grand_child_id_seq')
select nextval ('grand_child_id_seq')
insert into "parent" (version, "name", id) values (?, ?, ?)
insert into "child" (version, "parent_id", "name", id) values (?, ?, ?, ?)
insert into "grand_child" (version, "child_id", "name", id) values (?, ?, ?, ?)
insert into "grand_child" (version, "child_id", "name", id) values (?, ?, ?, ?)
insert into "child" (version, "parent_id", "name", id) values (?, ?, ?, ?)
insert into "grand_child" (version, "child_id", "name", id) values (?, ?, ?, ?)
insert into "grand_child" (version, "child_id", "name", id) values (?, ?, ?, ?)
select
   parent0_.id as id0_0_,
   parent0_.version as version0_0_,
   parent0_."name" as name3_0_0_
   from "parent" parent0_
   where parent0_.id=?
select
  childs0_.parent_id as parent3_1_,
  childs0_.id as id1_,
  childs0_.id as id1_0_,
  childs0_.version as version1_0_,
  childs0_."parent_id" as parent3_1_0_,
  childs0_."name" as name4_1_0_
  from "child" childs0_
  where childs0_.parent_id=?
select
  grandchild0_.child_id as child3_1_,
  grandchild0_.id as id1_,
  grandchild0_.id as id2_0_,
  grandchild0_.version as version2_0_,
  grandchild0_."child_id" as child3_2_0_,
  grandchild0_."name" as name4_2_0_
  from "grand_child" grandchild0_
  where grandchild0_.child_id in (
    select childs0_.id
    from "child" childs0_
    where childs0_.parent_id=?
  )
```

And here's joist (using `joist.jdbc=TRACE`):

```sql
select nextval('parent_id_seq')
  UNION ALL select nextval('child_id_seq')
  UNION ALL select nextval('child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
  UNION ALL select nextval('grand_child_id_seq')
INSERT INTO "parent" ("id", "name", "version") VALUES (?, ?, ?)
  -- [TRACE] parameters = [1, p, 0]
INSERT INTO "child" ("id", "name", "version", "parent_id") VALUES (?, ?, ?, ?)
  -- [TRACE] parameters = [1, child.0, 0, 1]
  -- [TRACE] parameters = [2, child.1, 0, 1]
INSERT INTO "grand_child" ("id", "name", "version", "child_id") VALUES (?, ?, ?, ?)
  -- [TRACE] parameters = [1, grandchild.0.0, 0, 1]
  -- [TRACE] parameters = [2, grandchild.0.1, 0, 1]
  -- [TRACE] parameters = [3, grandchild.0.2, 0, 1]
  -- [TRACE] parameters = [4, grandchild.1.0, 0, 2]
  -- [TRACE] parameters = [5, grandchild.1.1, 0, 2]
  -- [TRACE] parameters = [6, grandchild.1.2, 0, 2]
SELECT p.id, p.name, p.version
  FROM "parent" p
  WHERE p.id = ?
SELECT c.id, c.name, c.version, c.parent_id
  FROM "child" c
  WHERE c.parent_id = ?
  ORDER BY c.id
SELECT gc.id, gc.name, gc.version, gc.child_id
  FROM "grand_child" gc
  WHERE gc.child_id = ?
  ORDER BY gc.id
SELECT gc.id, gc.name, gc.version, gc.child_id
  FROM "grand_child" gc
  WHERE gc.child_id = ?
  ORDER BY gc.id
```

So, Hibernate had 17 SQL statements, Joist had 8 SQL statements, ~50% less.

This can be a big difference since each SQL statement is typically another over-the-wire network call to the database server.

Granted, this is just Joist taking advantage of Postgres's sequences and so batch-assigning and batch-inserting new instances. (Although Joist does a similar optimization with MySQL, batching inserts and using `getGeneratedKeys` to return all of the new ids).

The other difference is that Joist's SQL is purposefully as much "like-a-human-wrote-it" as possible. Some of Hibernate's generated SQL is just odd--select both `child.id` and `child.parent_id` twice in the same `ResultSet` for instance. Nothing that would really affect anything, but still odd.

At the end though, Hibernate uses prefetching to reload all of the grandchildren with 1 SQL statement, where as Joist has to issue 2 separate `FROM grand_child` queries for each `child_id`. Per above, I don't have that implemented yet.

Joist can definitely never win feature-wise against Hibernate--the crazy thing does about anything you could possibly want from an ORM. But the idea is that Joist can pick an opinionated subset of functionality, and do that really well. And so far that has been working out (for my subset, of course).

