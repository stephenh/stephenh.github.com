---
layout: draft
title: The Perfect ORM For Me
---

{{page.title}}
==============

This post is half-ranting about features of ORMs I don't like and half-evangelizing my own ORM, [Joist](http://joist.ws), so, first, I'll just explicitly note the disclaimer of "for me" in the title, and, second, please take it with a grain of salt.

These are my personal opinions about how I prefer an ORM to work, and I'm sure do not hold for every single project out there. I've been fortunate to work on relatively sane schemas and architectures that don't need more esoteric features.

So, Joist can be opinionated it what it supports, but since Rails came long, that's a feature, not a bug, right?

* Implicit save--as soon as an instance is touched
* Implicit percolation

The Schema is the Master
------------------------

asdf

No boilerplate
--------------

asdf

Relationship Management
-----------------------

In my opinion, any domain objects/ORM approach should pass this assertion:

    Parent p = findSomeParent();
    Child c = new Child();
    c.setParent(p);
    // is the relationship maintained?
    assertTrue(p.getChildren().contains(c));
{: class=brush:java}

If the domain objects/ORM do not maintain this consistent view of "parent knows child, child knows parent", I think it's very likely business logic will get confused when programmers inevitably forget to update both sides of the relationship manually.

This is especially important for validation logic in your domain objects. Something like "all of a parent's `p.getChildren()` must satisfy constraint X" might get skipped if `c.setParent(p)` was called but `p.getChildren()` was not updated.

Joist does this right, and whenever one side of the relationship changes, automatically percolates the change to the other side.

Tangentially, 
* All collections are inverse=true is okay

No Annotations
--------------

I personally believe annotations in an ORM are an anti-pattern because they violate the DRY principle.

For example, if you want describe a one-to-many relation in Hibernate/JPA, it might look like:

    @OneToMany(
        cascade = { CascadeType.ALL },
        fetch = FetchType.EAGER,
        mappedBy = "parent",
        orphanRemoval = true,
        targetEntity = Child.class)
    @OrderBy("id")
    private Set<Child> children;
{: class=brush:java}

Now, what about the next one-to-many you want to map? Copy/paste another 7 lines. Repeat for each one-to-many (and many-to-many) relation in your project. Even if the mapping is not 7 lines, that adds up to a lot of copy/pasting that all developers on the project (who may not all understand the intricacies of what they're pasting) will do.

Or, let's say you decide to map `datetime` columns as `TimeStamp`s from the excellent [timeandmoney](http://timeandmoney.sf.net/) library. With annotations, you must remember for every `datetime` column in your application to 1) use the `TimeStamp` type for the field/getters/setters and 2) add some sort of `Type` annotation:

    @Type(type="com.yourapp.TimeStampCustomType")
    private TimeStamp created;
{: class=brush:java}

In Joist, this decision "use TimeStamps for datetimes" is specified in exactly one place as a code generation rule:

    codegenConfig.setJavaType(
      "datetime",
      "com.domainlanguage.time.TimePoint",
      "joist.domain.orm.queries.columns.TimePointAliasColumn");
{: class=brush:java}

And now all of your `datetime` columns across the entire application will be mapped correctly.

Note that you can also do pattern matching, e.g. any integer column ending with "_amount" is treated as `Money`:

    codegenConfig.setJavaTypePattern(
      "integer",
      ".*amount$",
      "com.domainlanguage.money.Money",
      "joist.domain.orm.queries.columns.MoneyAliasColumn");
{: class=brush:java}

Of course, there are a few caveats here:

* The annotation may be only 1-2 lines, I admittedly picked a long example; but it is still something that needs maintained instead of inferred from the schema.

* Annotations do allow you to tweak each individual collection in your system--however *that is not a good thing*.
  
  In my opinion, every collection in your system should be mapped exactly the same way. It keeps with the principle of least surprise. Otherwise developers will, over-time, get confused which mappings settings are used on which collections, which they should use when creating new ones, etc. The complexity of choice for every collection is not needed and not worth it.

  Better to just pick one style and be consistent.

Features I Don't Care About
---------------------------

* Aggressive eager fetching of child relationships. By "aggressive", I mean fetching a parent + children in 1 SQL call instead of 2 (1 for parent, 1 for children), typically by using inner or outer joins in the 1 SQL call.

  My impression is that this aggressive "1 call instead of 2 calls" level of optimization is not necessary, at least in an ORM, where you're generally accepting a chatty JDBC connection as a fact of life.

  Aggressive eager fetching does have one very typical use case: when using proxy/AOP-driven transaction management, it's a shortcut to pre-load the parts of the object graph you need before its returned from the transaction managed method and then the user is no longer able to lazy-load values.

  (Note that the term "eager fetching" can also apply to the N+1 problem, which Joist does solve.)


* Inverse=false collections. In Hibernate, inverse=false collections allow you to map a parent/child relationship where the child doesn't have a `get/setParent`.

