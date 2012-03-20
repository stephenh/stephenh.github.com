---
layout: draft
title: The ORM For Me
---

{{page.title}}
==============

This post is half-ranting about features of ORMs I don't like and half-evangelizing my own ORM, [Joist](http://joist.ws).

I'm sure my thoughts on how I prefer an ORM to work do not hold for every single project out there. I've been fortunate to work on relatively sane schemas and architectures that don't need more esoteric features like handling a schema designed in the 1980s. So, I just wanted explicitly note the disclaimer of "for me" in the title and note that YMMV.

In other words, Joist is opinionated. But since Rails came long, that's a feature, right?

The Schema is the Master
------------------------

A core tenet of my take on ORMs is that the database schema should be the master definition of what the data being stored is, and what the objects look like. Yes, this assumes a sane schema.

Many projects try and let developers right the domain objects first, asserting "objects are the most important thing", and then reverse engineering the schema from there. I disagree with this, for two reasons:

1. It's wrong--at the end of the day, the database really is where the data lives, and trying to pretend it is not will just exasperate the impedance mismatch.

2. Once you've deployed 1.0 and have production data, you'll have to have migration scripts instead of "here, ORM tool, crap out a from-scratch schema for me." Assuming you actually ship, maintenance always lasts longer than initial development, so I think projects should embrace migrations into their workflow from day 1.

No boilerplate
--------------

Given the previous tenet, the following assertion is that anything that can be derived from the schema is waste and should be avoided at all costs.

I did not fully appreciate the boilerplate involved in most Java domain models until working in Rails and seeing a model like:

    class Employee < ActiveRecord::Base
    end
{: class=brush:ruby}

Rails then, of course, uses a sort of startup-time code generation to create getters, setters, etc. Unfortunately, while Java can do runtime code generation (CGLib, etc.), it means the generated code is not available to the programmer in their IDE to do code completion/etc. against.

Hence, in my opinion, build-time code generation is the way ORMs should work. Joist in particular achieves a Rails-like brevity by using a base class that hides all of the cruft:

    public class Employee extends EmployeeCodegen {
    }
{: class=brush:java}

Relationship Management
-----------------------

Another thing I find important is consistency. In the data store, of course (yes, NoSQL is awesome for big data, but ACID makes life a lot simpler if you can leverage it), but also in the domain objects.

A pet peeve is using an ORM where the domain objects become inconsistent, as in:

    Parent p = findSomeParent();
    Child c = new Child();
    c.setParent(p);
    // now, does this assertion pass?
    assertTrue(p.getChildren().contains(c));
{: class=brush:java}

If the assertion fails here, the Parent and Child objects have become inconsistent with each other and you're just asking for heartburn when business logic that is based on the Parent starts looking for Children and doesn't have the latest changes.

This is especially important for validation logic in your domain objects. Something like "all of a parent's `p.getChildren()` must satisfy constraint X" might get skipped if `c.setParent(p)` was called but `p.getChildren()` was not updated.

My theory is that most projects probably don't bother with this because the code to maintain both sides of a relationship is very boilerplate-ish. Which makes it a perfect target for code generation, which is what Joist does.

Tangentially, Hibernate has a feature for collections, setting `inverse=true`, where you can control whether a `child.parent_id` field is updated based on the `child.get/setParent` or the `parent.getChildren().add/remove`. This seems entirely dumb to me, as it's a feature that admits it lets your domain objects get out of sync.

Annotations Suck
----------------

I personally believe annotations in domain objects are an anti-pattern because they violate the DRY principle and are just another form of getter-/setter-style boilerplate.

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

Now, what about the next one-to-many you want to map? Copy/paste another 7 lines. Repeat for each one-to-many (and many-to-many) relation in your project. Even if the mapping is not 7 lines, say it's 2, or even 1, that adds up to a lot of copy/pasting that all developers on the project (who may not all understand the intricacies of what they're pasting) will do.

Or, let's say you decide to map `datetime` columns as `TimePoint`s from the excellent [timeandmoney](http://timeandmoney.sf.net/) library. With annotations, you must 1) use the `TimePoint` type for the fields, getters, and setters and 2) add some sort of `Type` annotation:

    @Type(type="com.yourapp.TimePointCustomType")
    private TimePoint created;
{: class=brush:java}

And then remember to do this for every single `datetime` column in your application.

I consider this to be a violation of DRY. So, in Joist, this decision of "use TimePoints for datetimes" is specified in just one place as a code generation rule:

    codegenConfig.setJavaType(
      "datetime",
      "com.domainlanguage.time.TimePoint",
      "joist.domain.orm.queries.columns.TimePointAliasColumn");
{: class=brush:java}

And now all of the `datetime` columns across the entire application will be mapped correctly.

Note that you can also do pattern matching, e.g. any integer column ending with "_amount" is treated as `Money`:

    codegenConfig.setJavaTypePattern(
      "integer",
      ".*amount$",
      "com.domainlanguage.money.Money",
      "joist.domain.orm.queries.columns.MoneyAliasColumn");
{: class=brush:java}

Of course, there are a few caveats here:

* The annotation may be only 1-2 lines, I admittedly picked a long example; but it is still something that needs maintained instead of inferred from the schema.

* Annotations do allow you to tweak each individual field/collection in your domain model--however *that is not a good thing*.
  
  In my opinion, every collection in your system should be mapped exactly the same way. It keeps with the principle of least surprise. Otherwise developers will, over-time, get confused which mappings settings are used on which collections, which they should use when creating new ones, etc. The complexity of choice for every collection is not needed and not worth it.

  Better to just pick one style and be consistent.

Always Implicit Save
--------------------

I don't like ORM APIs that have methods like `saveOrUpdate(object)`, which you have to call after having modified your domain object. To me this is redundant, and just asking for the developer to make a mistake and forget a step. But modifying a domain object, e.g. any getter or setter call, I think that should automatically get the changes persisted to the database when the transaction commits.

I'm not sure why you would want it work any other way--when would you call a setter but then *not* want it to be saved (other than rolling back the whole transaction)? Seems like a non-feature that adds complication to me.

For Joist, any time you touch a domain object within a Unit of Work (open transaction), it will get validated and saved. Nothing extra to worry about.

Always Implicit Percolation
---------------------------

Along the same lines, some ORMs let you configure percolation, or cascading. E.g. if a `Parent` is persisted, you can configure whether the `parent.getChildren` are persisted.

To me this is another quizzical non-feature. When would you not want the parent's children to also be persisted? Seems like a violation of least surprise if they were not.

Explicit Transaction Management
-------------------------------

Implicit transaction management is very popular these days, especially with some Aspect-Oriented magic where calling service layer methods automatically opens/closes the transaction. E.g. in a web app:

    Employee e1 = employeeService.find(1); // 1 txn here
    e1.setSomething(...);
    employeeService.save(e1); // another txn here
{: class=brush:java}

This leads to a number of cons:

1. My biggest complaint is that it breaks the transaction up so that the business logic is no longer wholly contained within 1 transaction. If multiple entities are retrieved from their respective service APIs, mutated, and then separately committed to their respective service APIs, there is no guarantee our business logic was all-or-nothing.

2. If you do not pre-load all of the Employee's data you need within the `find` API call, you'll suffer from the infamous `LazyInitializationException`. It's easy to think that, no big deal, just pre-load the data within `find`, but I've seen this quickly degenerate where domain objects are over-fetching data to fulfill the union of all the business logic requirements instead of getting only what is needed for each one.

Note that I think course-grained service APIs have their place--primarily when you expose them on the wire to external clients. However, within a JVM, the coarse granularity doesn't make sense, in my opinion.

Admittedly, projects like to leverage these service APIs for mocking, but I think that is a mistake as well. Briefly, because the mocks can never enforce the schema/validation constraints like the real database will, and, with Joist anyway, your database tests should be fast enough to just use the real database instead.

Instead of service APIs, Joist uses a thread-local transaction (Unit of Work) that you generally open as early as possible and close as late as possible (e.g. leave it open within your view). E.g.:

    // in a filter
    UoW.open();

    // ... in servlet/etc.
    // business logic just assumes txn is open
    Employee.queries.findBy("asdf");

    // if you need to ensure this committed, e.g. to get
    // auto-assigned ids
    UoW.commit();

    // back in the filter
    UoW.commit();
    UoW.close();
{: class=brush:java}

Note that, if I was doing this all over again, I would probably not use static methods on the `UoW` class and instead pass around the `UnitOfWork` context. But I haven't gotten to refactoring that yet.

Type Safe Queries
-----------------

