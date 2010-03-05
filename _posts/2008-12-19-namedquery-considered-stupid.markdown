---
layout: post
title: NamedQuery Considered Stupid
---

<h2>{{ page.title }}</h2>

I was recently exposed to JPA's NamedQuery annotation. I cannot imagine a more useless way to store your queries.

(Well...okay, it's not XML, but still...) 

A few examples from Google show the basic syntax:

    @Entity
    @NamedQuery(
        name="findAllEmployeesByFirstName",
        queryString="SELECT OBJECT(e) FROM Employee e WHERE e.firstName = :firstName")
    public class Employee {
    }
{: class=brush:java}

Then somewhere else, you can do:

    Query queryEmployeesByFirstName = em.createNamedQuery("findAllEmployeesByFirstName");
    queryEmployeeByFirstName.setParameter("firstName", "John");
    Collection employees = queryEmployessByFirstName.getResultList();
{: class=brush:java}

(I'm using the [first google hit](http://download.oracle.com/docs/cd/B32110_01/web.1013/b28221/ent30qry001.htm) for "JPA @NamedQuery" for the examples.)

I'm confused about the benefits of this annotation-based approach.

If pulling queries out of methods is a must, I would opt for a static final String. This would get you:

* Compile time enforcement of the `findAllEmployeesByFirstName` variable
* Ctrl-Shift-G find references in Eclipse
* Ability to add a `private` scope to limit scope of the string

All of these, to me, are huge pros.

Instead, with the annotation, it's not compile-type checked, you can't easily find its references, and the "somewhere else" that calls `createNamedQuery` could be anywhere in your codebase that has access to the EntityManager. Chaos.

The only benefit I can guess about this approach is that you'd get to reuse the `findAllEmployeesByFirstName` in multiple places without retyping the SQL query. But I fail to see how this is even worth accomplishing--my personal preference is to isolate the query in its own method and then just have multiple people call the method:

    public Collection findAllEmployeesByFirstName(String firstName) {
        Query queryEmployeesByFirstName = em.createQuery(
            "SELECT OBJECT(e) FROM Employee e WHERE e.firstName = :firstName");
        queryEmployeeByFirstName.setParameter("firstName", "John");
        return queryEmployessByFirstName.getResultList();
    }
{: class=brush:java}

And there you go, reuse and encapsulation all in one go, and all Plain Old Java.

But, alas, JPA and NamedQueries are a standard, and so countless Java programmers will think they're following best practice by just doing what the standards/examples/books say they should instead of stopping to think critically about it.

(Sun, if you're reading this, can you please work on something more constructive than JPA...like catching Java up to C#? I don't even need LINQ...just lambdas and static extension methods, that's all I ask.)

To me this is just yet another example of annotations being abused as a non-XML configuration panacea where pure Java constructs would work just fine.

**Update:** Turns out I'm uneducated, named queries can be on-startup verified against the database--cool, but that's [still wrong](/2009/01/06/namedquery-proposal.html).

