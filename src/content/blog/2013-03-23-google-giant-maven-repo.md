---
title: Google's Build System is a Giant Maven Repo
description: ""
date: 2013-03-23T00:00:00Z
---



At [Bizo](http://www.bizo.com), we occasionally mull over our build system and how it could be improved.

Tangentially, right now our build is based on Ant and Ivy. Yes, yes, I was admittedly skeptical at first too, but our per-project `build.xml` files are less code than most Maven `pom.xml` files I've seen. We use an internal fork of Spring's common-build project, and it is a surprisingly nice setup.

Anyway, I occasionally think about Google's internal build system, and what ideas/approaches we could potentially reuse if we were to revamp our own build system. Their build system isn't open source, but every once in awhile a blog post goes by, e.g. this [Build in the Cloud](http://google-engtools.blogspot.com/2011/08/build-in-cloud-how-build-system-works.html) post.

These Google blog posts describe an interesting setup where:

1. Conceptually, there is one large `trunk/` directory that everyone checks out and builds *all* of their project's upstream dependencies locally.

2. In reality, they cache builds (based on hashes of the input files/compile settings) across machines so you only build locally what has changed.

At first I thought this was a huge breakthrough (always build from trunk!), and while I still think it is, what's interesting is that you can conceptually model it like a huge Maven repository.

Look what happens in Maven:

* You check out `trunk/` and download dependencies where `org=foo.com`, `module=blah`, and `version=X.Y`

This is basically the same thing as in Google, except:

* You check out `trunk/` and download dependencies where `org=google`, `module=path/to/BUILD`, and `version=(hash of file inputs)`.

Google has basically automated the process of keeping `version` up to date, where each time you `svn up`, you're updating the `version`/input hash of your upstream dependencies, and so will now download (or build) the new version.

(I'm sure there are a lot of intricacies here that I'm missing, e.g. how their FUSE file system only downloads the files you actually need, etc., but I believe this is conceptually correct.)

What's interesting is that Maven's `SNAPSHOT` and Ivy's `latest.integration` (which we use) basically try to do the same thing ("always give me the latest upstream dependency"), but have to rely on expensive network pings to check "what's the latest version?" each time you build (or they only check every N minutes, which means you risk stale results).

(Of course, the Maven/Ivy approach is very understandable, given they don't have the benefit of a canonical, company-wise source repo.)

And, granted, as a whole, the Google build system is very different from Maven proper (cross-technology, can locally build anything missing, other things I don't have a clue about), but I was just surprised that the "repository in the cloud" aspect is not as different as I had originally thought.

The main innovation of their repository approach is leveraging their unique position of having all source code locally to use hashes for identifying artifacts.


