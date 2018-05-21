---
layout: post
title: Dammit, MySQL
section: Favorites
---

Dammit, MySQL
=============

After being a happy PostgreSQL user for years, I've finally had to use MySQL for the last 6+ months.

I have to admit, I was starting to think it wasn't all that bad--that the "MySQL is a toy" line was outdated.

It's not.

Here is my current laundry list of "dammit, MySQL" complaints:

* DDL Doesn't Respect Transactions
* No Deferred Foreign Key Constraints
* No Deferred Unique Key Constraints
* ANSI Mode Defaults Off
* Not Really Not Nulls
* Auto-Changing Timestamps
* Crappy Error Messages

DDL Doesn't Respect Transactions
--------------------------------

My biggest complaint is that MySQL's DDL operations (`CREATE TABLE`, `ADD COLUMN`, etc.) do not occur within transactions.

Well, probably--in typical MySQL fashion, you can execute `CREATE TABLE`/etc. within a transaction (e.g. after a `BEGIN`) and, instead of failing, MySQL will blithely commit all existing work in your transaction, create the table, and then let you continue on your merry way.

This makes deployments a crap shoot--whether you're using [migrations](http://joist.ws/ormMigrations.html) or a hand-coded SQL upgrade script, you better hope the whole thing applies cleanly, because if your script blows up halfway through, you're stuck with a schema that is somewhere between versions.

Getting back to a deployable state, or even one where you can rerun the fixed upgrade script, means either manually teasing the schema back to the old version, or reverting to a snapshot and starting all over.

And this isn't just MyISAM--this is the InnoDB engine as well.

[PostgreSQL](http://www.postgresql.org), on the other hand, executes all DDL within a real transaction, and if one `CREATE TABLE`/`ADD COLUMN` fails, from experience, I know the entire schema rolls back to the prior state.

No Deferred Foreign Key Constraints
-----------------------------------

Deferred foreign key constraints mean you can do:

```sql
BEGIN;
INSERT INTO child (id, parent_id, name) VALUES (2, 1, 'child');
INSERT INTO parent (id, name) VALUES (1, 'parent');
COMMIT;
```

Note that technically we've inserted `child.parent_id=1`, but `parent.id=1` is not in the database yet.

Having deferred foreign key constraints means this is okay as long as the `parent.id=1` row shows up before the transaction commits.

Not having deferred foreign key constraints means `INSERT INTO child` blows up right away. You instead have to ensure `INSERT INTO parent` comes first.

While this doesn't seem to be a big deal, the ability to defer foreign keys and freely order `INSERTs` within a transaction makes technologies like ORMs much simpler.

It also becomes crucial if you have a two-way relationship between rows, e.g.:

```sql
BEGIN;
INSERT INTO child (id, parent_id, name) VALUES (2, 1, 'child');
INSERT INTO parent (id, name, current_child_id) VALUES (1, 'parent', 1);
COMMIT;
```

Both statements depend on the other--there is no way to execute these two statements if you lack deferred foreign key constraints.

You are reduced to making one of them `nullable`, e.g. `parent.current_child_id`, and then creating a partially-valid `Parent` and fully-valid `Child`, forcing your ORM to flush to SQL, then going back and updating `Parent` to point to the new `Child`, and doing a final flush+commit.

[MySQL](http://www.mysql.com) still doesn't have deferred foreign key constraints, [PostgreSQL](http://www.postgresql.org) has had them for as long as I've used it. Even SQLite [has](http://www.sqlite.org/foreignkeys.html#fk_deferred) deferred foreign keys constraints.

No Deferred Unique Key Constraints
----------------------------------

Deferred unique constraints are similar, but mean you can temporarily violate a unique constraint, as long as you clean things up before the transaction commits. E.g.:

```sql
BEGIN;
INSERT INTO user (id, username) VALUES (1, 'bob');
INSERT INTO user (id, username) VALUES (2, 'fred');
COMMIT;

-- want to change bob->fred, fred->bob
BEGIN;
UPDATE user SET username = 'fred' WHERE id = 1;
UPDATE user SET username = 'bob' WHERE id = 2;
COMMIT;
```

Without deferred unique constraints, changing `bob -> fred` would blow up immediately. Instead you have to dance around the issue by using a temporary value, e.g.:

```sql
BEGIN;
UPDATE user SET username = 'temp' WHERE id = 1;
UPDATE user SET username = 'bob' WHERE id = 2;
UPDATE user SET username = 'fred' WHERE id = 1;
COMMIT;
```

Like foreign key constraints, this extra hoop means two explicit unit of work flushes as you change `User1` to a temp value, flush, change `User2` to the right value, flush, and finally change `User1` to the right value, flush and commit.

With deferred unique constraints, it is very simple to set `User1` to the new value, set `User2` to the new value, and have your ORM auto-flush. It will just work.

[MySQL](http://www.mysql.com) doesn't have deferred unique constraints, [PostgreSQL](http://www.postgresql.org) just got them in (the nearly released) 9.0.

ANSI Mode Defaults Off
----------------------

I was dumbfounded to learn about MySQL's [sql-mode](http://dev.mysql.com/doc/refman/5.1/en/server-sql-mode.html) option.

What kind of product:

1. Lets users *disable standards compliance* as a feature?
2. Sets the default mode to **not standards complaint**?

With MySQL, you can use `ANSI` mode, which affects such non-trivial things as *it actually uses the same escape character as the SQL standard*. Amazing!

[PostgreSQL](http://www.postgresql.org) doesn't screw around like this, it just always implements the standard.

Not Really Not Nulls
--------------------

Also hidden in the [sql-mode](http://dev.mysql.com/doc/refman/5.1/en/server-sql-mode.html) docs was an option to make `NOT NULL` actually mean `NOT NULL`.

For example, adding the `TRADITIONAL` SQL mode restores the sanity:

```sql
mysql> create table user (username varchar(50) not null);
Query OK, 0 rows affected (0.00 sec)

-- this works when it really should not
mysql> insert into user () values ();
Query OK, 1 row affected, 1 warning (0.00 sec)

mysql> set sql_mode='ANSI';
Query OK, 0 rows affected (0.00 sec)

mysql> insert into user () values ();
Query OK, 1 row affected, 1 warning (0.00 sec)

mysql> set sql_mode='ANSI,TRADITIONAL';
Query OK, 0 rows affected (0.00 sec)

-- finally, it blows up
mysql> insert into user () values ();
ERROR 1364 (HY000): Field 'username' doesn't have a default value
```

So, does your MySQL database have some `NOT NULL` columns? Are you really sure they don't have `null` values in them? Have you checked your SQL mode?

If you use [PostgreSQL](http://www.postgresql.org), you can be sure that your `NOT NULL` columns do not have `null` values in them.

(**Update:** I was wrong--MySQL will not insert `null`, but instead insert a default value, e.g. 0 for int or empty-string for strings. Personally, since I did not include a `DEFAULT` clause in my DDL, I did not expect the database to add a `DEFAULT` value for me.)

Auto-Changing Timestamps
------------------------

What would most developers assume happens if today you run:

```sql
CREATE TABLE employee (
  id int,
  name varchar(50),
  created timestamp
);
INSERT INTO employee (id, name, timestamp) (1, 'bob', NOW());
```

Then tomorrow you do:

```sql
UPDATE employee SET name = 'fred';
```

Quick, what's `created`? Yesterday, right? Ah ha! No. It's [today](http://dev.mysql.com/doc/refman/5.0/en/timestamp.html):

*"With neither DEFAULT nor ON UPDATE clauses, it is the same as DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP."*

See that `ON UPDATE CURRENT_TIMESTAMP`? That means MySQL **changes the column value each time you update the row**.

What MySQL developer ever thought that this was a good default behavior?  I'm trying to think if this is the worst offender of "least surprise" or the if `NOT REALLY NOT NULL` is worse. It's close.

Crappy Error Messages
---------------------

To top it all off, MySQL error messages are a joke. This beauty:

```plain
Can't create table 'foo.#sql-338_90' (errno: 150)
```

Simply means "you tried to reference a non-existent table".

For as long as MySQL has been around, and how many countless users have run into this issue, you'd think they'd consider displaying a better error message.

Even [git](http://www.git-scm.org) is better at fixing its ease-of-use issues than MySQL.

More often than not, [PostgreSQL](http://www.postgresql.org) errors say plainly what really went wrong.

Dammit, AWS
-----------

Unfortunately, [RDS](http://aws.amazon.com/rds/) is awesome, and RDS uses MySQL.

I, and [many others](http://developer.amazonwebservices.com/connect/thread.jspa?threadID=37834), are pulling for Amazon to add PostgreSQL support. Maybe with the first-class replication in the 9.0 release, it will happen sooner rather than later. I can hope.

