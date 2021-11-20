---
date: "2010-08-22T00:00:00Z"
categories:
  - Joist
title: Joist Tip, Fast Database Resets
---

I reread parts of [Growing Object-Oriented Software, Guided by Tests][goos] (GOOS) today. The verbose name aside, it's a great book.

I also like it because they share my opinion that persistence tests must commit to the database to be worthwhile. Yes!

Abusing Transactions for Resetting Test Data
--------------------------------------------

Ruby on Rails, as nice as it is, seems to have popularized this notion that you can leverage transactions to get relatively quick database tests--instead of having to delete data after each test, you run the each test in its own transaction, and then roll the transaction back before continuing on to the next test.

This allows each test to have a clean database--which is very good for test independence and reproducibility. And rolling back uncommitted data is, admittedly, really fast.

But it also means that any commit-time persistence logic is being skipped--foreign key constraints, unique constraints, etc. Which, unless you're just testing queries, is kind of the point of the test being a persistence test.

This approach also assumes that your test is not exercising any code that does its own transaction management. Depending on the feature/architecture, this may/may not be a good assumption--but it is definitely not always true.

So we need to find another way to get a clean database, preferably as quickly as possible.

Domain-Level Resetting Test Data
--------------------------------

What GOOS suggests is a pretty common pattern of allowing each test to commit its data, and then in `setUp`, iterating over your domain objects to explicitly delete them:

```java
for (Class domainClass : someListOfDomainClasses) {
  persistenceLayer.deleteAll(domainClass);
}
```

This can be a little tricky as you don't want to trigger any foreign key constraints if you, say, delete the `FooParent` rows before the `FooChild` rows that have foreign keys to them. The usual hack is something like `set foreign_key_constraints=0` for MySQL or deferred key constraints for PostgreSQL.

A large system I worked on used this technique, and it works well. However, as the system grew, things started to slow down. With 500+ tables, calling `delete * from table` for each table, before each test, adds up to a lot of SQL statements going over the wire.

Database-Level Resetting Test Data
----------------------------------

To minimize the amount of SQL calls involved in a reset, we can go a level closer to the data and use a stored procedure to do database-level resetting of test data.

While I'm not usually a fan of stored procedures, in this case, it makes sense--there is 1 SQL call to kick off a slew of database operations:

```java
// postgres
execute("select * from flush_test_database()");

// mysql
execute("call flush_test_database()");
```

The stored procedure then executes the 500+ `delete` calls directly against the database.

This is pretty easy to setup, especially if you generate the stored procedure an at opportune time in the developer's workflow.

For example, [Joist][joist] is an ORM purpose-built for large schemas. It already has a build-time code generator that generates the boilerplate aspects of domain objects by introspecting the database schema. After doing so, it is easy to add a final step that also creates the `flush_test_database` stored procedure.

Postgres Implementation
-----------------------

The stored procedure for Postgres looks like:

```sql
CREATE OR REPLACE FUNCTION flush_test_database() RETURNS integer AS
$BODY$
BEGIN
SET CONSTRAINTS ALL DEFERRED;
-- repeated for each domain class
ALTER SEQUENCE domain_table RESTART WITH 1 INCREMENT BY 1;
DELETE FROM domain_table;
RETURN 0;
END;
$BODY$
  LANGUAGE 'plpgsql' VOLATILE
  COST 100;
ALTER FUNCTION flush_test_database() SECURITY DEFINER;
```

Note that the `SECURITY DEFINER` part is important as it will allow callers of the stored procedure (e.g. your application's database user) to alter sequences that it does not own (e.g. because they are owned by the root `postgres` user).

See [GenerateFlushFunction.java][flush] for the exact code.

MySQL Implementation
--------------------

MySQL is even easier as `TRUNCATE TABLE` resets the auto increment column:

```sql
CREATE PROCEDURE flush_test_database()
BEGIN
SET FOREIGN_KEY_CHECKS=0;
-- repeated for each domain class
TRUNCATE TABLE domain_table;
SET FOREIGN_KEY_CHECKS=1;
SELECT 1;
END
```

Again, you can see [GenerateFlushFunction.java][flush] for the exact code.

Time Savings
------------

On a 500+ table schema, domain-level resetting with 1-call-per-table takes ~200ms.

Against the same schema, database-level resetting with just 1 call takes ~5ms.

So we save ~1/5th of a second. This is not a lot--until you have a huge test suite. If you have 5000 persistence tests, that's ~16 minutes saved off your test suite runtime.

Limited Applicability
---------------------

Thankfully, few projects get big enough to need this level of optimization. And, pessimistically, if they do, shaving 15 minutes off their build time is usually the least of their concerns. :-)

Nonetheless, [Joist][joist] tries to get things like this right, to make your next enterprise project that much less painful.

[goos]: http://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627
[joist]: http://joist.ws
[flush]: http://github.com/stephenh/joist/blob/master/migrations/src/main/java/joist/codegen/passes/GenerateFlushFunction.java
