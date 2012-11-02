---
layout: post
title: What's Wrong with a Schema?
---

{{page.title}}
==============

Lately I've been wondering why schema-less databases are so popular lately.

Most any NoSQL store is schema-less. And while perhaps schema-less-ness is an integral part of NoSQL (e.g. most NoSQL databases are just opaque key/value stores), I would assert it's an orthogonal concern, and that document-oriented databases, e.g. [MongoDB](http://www.mongodb.org/), could arguably have a schema.

However, MongoDB doesn't just say it's schema-less for technical reasons related to being a NoSQL store, it actually touts its lack of a schema as a benefit, claiming it is "agile" and offers "simplicity and power".

I find all of this confusing, as I actually *want* a schema.

I think the database enforcing a basic level of data consistency is a good thing. Granted, there will always invariants that the database cannot enforce, sans stored procedures. So, at some point you have to rely on most/all non-trivial database writes coming via your domain objects/business logic.

Nonetheless, for basic constraints (column length, not null, unique, foreign keys, etc.), it seems like a generally good idea for the database to do these checks for you.

This post is a general outline of my thoughts on the issue.

Coordinating Migrations Sucks, But That's Good
----------------------------------------------

I think one primary aspect of schemas that people find annoying is having to coordinate releases of multiple applications around when the database will have a new schema version applied.

I agree; this is annoying. However, I think it's misguided to blame the schema for this. It's not the core issue. The core issue is multiple applications sharing a database. The schema just makes this contract explicit.

In that regard, I think it is naive to think a schema-less database "solves" this issue for you. It does not make the coordination problem go away, it just makes it less visible. Now it is each application's responsibility to work sanely with both new and old versions of documents. Which means it's the responsibility of the programmer. Which means it won't happen.

Perhaps I'm overly pessimistic, but how many programmers version their schema-less documents? Or really remember which fields are new/renamed/changed and so, even if present for 95% of the documents, might not be there for some small subset?

To really do this right, I think you'd basically need to build in-application migrations that promote each document from v1 to v2 to v3, and then ensure all of your clients use the latest migrations when accessing the database. Well, and hope than any clients assuming an older schema aren't going to mess up the data written by newer clients.

Perhaps this is what people do, but I haven't read of it, so I'm skeptical.

Granted, even if you're lacking this sort of in-application versioning diligence, obviously not every application deployment that uses a schema-less database is going to lead to disaster; I'm sure most of them go quite fine.

However, I still think forcing coordination of multiple deployed applications around a schema change is a *good* aspect of schemas. It is making their coupling to each other (via the database and a shared contract of what type of data goes in it, e.g. the schema) explicit.

I want to know all my applications are now being forced to use the new, same schema. Then I know they'll (generally) play nicely with each other and have at least a basic agreement on what the data should look like.

Accepting Downtime for Migrations
---------------------------------

Sometimes, you'll be lucky enough to have a database accessed by only a single application, so the above issue of coordinating migrations across multiple applications isn't an issue. Great!

However, usually it still means taking the old version of the application down, applying the schema changes, and then bringing a new version up. So, downtime. And, yeah, downtime sucks.

But really I think this is a variation of the prior point--but instead of two different applications sharing a database, it's two different versions (pre-/post-upgrade) sharing the same database. Which I think has all the same potential problems as the previous case of separate applications sharing a database, in terms disagreeing what the data should look like.

So, while migrations introduce a deployment complexity, I think the trade-off (that I'm usually quite willing to accept) is simplicity in your application code by not having to deal with multiple older schemas that just no longer make sense in the latest version of the application.

Particularly in a long-lived application, where the maintenance phase is longer than the initial development phase (as it should be in all successful projects), it seems like constantly having to think with "what might the data from last month, six months, 12 months ago look like?" would get tiresome.

Musing further, and thinking specifically of MongoDB's assertion of "schema-less == simplicity". I'm sure this applies during the initial development phase--when there is no production data around, and you as a developer want to put 10 rows of whatever test data you want in your local database, sure, it's simple to not have a schema.

My assertion is that this initial simplicity will not bear itself out throughout the life cycle of an application, and in the long-term will actually become a burden.

Of Course, Sometimes Schema-less is Better
------------------------------------------

Despite my general skepticism, I'm sure scenarios exist where a schema really doesn't work. I don't have a predetermined list, but things like beyond-huge databases, etc. In those cases, I have nothing wrong with being pragmatic about it.

However, it seems like these scenarios would be in the minority, and that most applications would be fine with, and benefit from, a schema.

I think this is similar to the CAP theorem--there are definitely instances of extremely high-volume, high-availability services (Amazon shopping cart, etc.) where they must choose "AP".

However, that doesn't mean that for every system "AP" is now the best fit--"C" has some very nice properties to it that, if it fits your application's constraints (which it generally does for most, IMO), then you should by all means keep "C" and the simplicity that comes with it.

Same thing with schemas--if you really can't use one, I understand; I just question that stance being a default position.

Schemas Don't Have to be Relational
-----------------------------------

I think people, myself included, usually associate database store schemas with relational databases. Which is an understandable association given the long, successful history of relational databases and how they all intrinsically have the notion of a schema.

But other forms of schemas exist (XmlSchema, [jschema](http://jschema.org/), etc.), and I don't see anything wrong with a non-relational database that still had some sort of defined/enforced schema for what the data within it must look like.

If anything, this could be quite nice, because even though relational schemas are ubiquitous, they are very much based on the underlying storage technology (tables/columns), and so don't map directly from higher-/domain-model-level abstractions like entities and parent/child/group relationships.

Granted, relational-to-OO conventions have generally been established, so I don't think the object/relational impedance mismatch is quite the problem it used to, or is made out to, be. But I could see schemas with a slightly higher level of abstraction being useful.

A Schema Facilitates Metaprogramming
------------------------------------

Although slightly tangential, having a schema that can be parsed by other tools is a great way for providing metadata about your system for use in code generation. See projects like [Joist](http://www.joist.ws) that derive the entire domain layer (sans custom business logic) from the relational schema.

Granted, a project's "schema of record" doesn't necessarily have to be relational, or the same schema as your database. E.g. I could see using a custom JSON schema to define your entities/relationships, and then going from there to a relational schema or some domain objects.

This approach would let you express richer abstractions, but might also involve some duplication, as you have to maintain both this new master-schema and, even if you derive the database schema, you'll likely have to maintain migrations to intelligently update the database's existing data into the new schema.

Anyway, I have had considerable success leveraging the metadata available in schemas, especially as systems grow to be more than a handful of entities, and would be disappointed to give that capability up.

It's All About Types
--------------------

Really, my desire for a schema is an extension of my [static typing bigotry](/2010/11/24/why-im-a-static-typing-bigot.html).

Just like how I think type contracts are a good idea for software programs (they provide intrinsic documentation and help programmers avoid mistakes), I think schemas are a great contract to have for databases. They provide the same benefits as types: documentation and helping programmers avoid mistakes.

If anything, database contracts are even more important than type contracts because data is persistent. If your application blows up with `method_missing`, eh, the caller can try again; but if a client writes a row/document with invalid contents, your application(s) will forever have to handle/skip that invalid data until it can be identified and fixed.

Disclaimer
----------

And, just as I must qualify my static typing position, I must qualify my pro-schema position that obviously many successful systems are being built with schema-less databases. And a lot of good things have been said about them. So it's of course impossible for me to pontificate that all schema-less systems are doomed to fail.

But I nonetheless have a personal preference that I assert is supported by the trade-offs I've tried to outline here. If your system can accept the trade-offs, I think schemas are generally worth their trouble in the long run.


