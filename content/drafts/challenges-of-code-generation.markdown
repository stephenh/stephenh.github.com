---
title: The Two Challenges of Code Generation
layout: post
---

I like code generation. More specifically, I like up-front, writes-`.java`-files code generation. I think that, when done well, it can dramatically affect the quality and productivity of a project.

That said, doing code generation well is hard--a few things are easy, like structuring the code generator nicely, etc., but I've found two things are consistently tricky:

1. Triggering when the generator should run
2. Having access to all of the necessary metadata 

In my experience, whether you handle these two challenges well will make or break whether users think your code generation is amazing and helpful, or an annoying crutch.

When Life is Good
-----------------

Sometimes these challenges are not really issues at all. For example, take [Joist](http://www.joist.ws), which generates Java code for an ORM layer. When we look at the challenges:

1. When to run? Every time the schema changes.
2. Where's the data? In the schema.

A pretty natural workflow emerges:

* Developer writes migration files (as Java classes)
* Developer manually runs the generator
* The generator connects to the database, scans schema, outputs code.

Seems pretty easy.

However, now we'll see that, even in this "life is good" example, things can be a bit tricker. To be executed, the migration Java files need compiled--but since we haven't generated any domain object code yet, our main codebase won't compile. As a result, the migrations must live in their own project/source folder so they can be compiled on their own.

Fortunately, this is a very reasonable thing to ask, as there generally should not be any shared code between the build-time migrations and your run-time codebase. So splitting them up has no serious consequences (and is probably actually best practice).

One final note is that we can actually tweak the above workflow to remove the manual developer step:


* Developer writes migration files (as Java classes)
* Eclipse sees the file changes, and *automatically* runs the generator as an External Tool Builder
* The generator connects to the database, scans schema, outputs code.

This ends up being a pretty nice workflow. Even when a developer does `svn up`, if Eclipse sees the migration files change, it will just do the right thing.

When Life is Hard
-----------------

dtonator, classes, domain objects.



