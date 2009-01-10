---
layout: post
title: NamedQuery Proposal
---

Recently I [ranted](/2008/12/19/namedquery-considered-stupid) about EJB3 `@NamedQuery` annotations as being a bad use of annotations.

Turns out I was mistaken about the lack of pros--startup-time validation of
queries seems like an admirable goal.

However, I would propose a different implementation: instead of the "name" part of the query being in an non-referrable annotation, the annotation should be used solely as a marker on an otherwise pure Java construct. For example:

<pre name="code" class="java">
    @Sql
    private static final String FIND_FOO = "select * from foo ...";
</pre>

This would alleviate my concerns about type-safety and SQL encapsulation, but still allow the `EntityManager` to find all of the annotated queries on startup for validation.

Until my proposal makes it into EJB4, I also came across [this comment][1], which seems like an acceptable, though verbose, compromise with the current annotation.

[1]: http://freddy33.blogspot.com/2007/07/jpa-namedqueries-and-jdbc-40.html?showComment=1203615720000#c9040118016780285760 

