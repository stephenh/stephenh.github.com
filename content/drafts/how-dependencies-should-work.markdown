---
layout: draft
title: How Dependencies Should Work
---

This is my assertion, my plea, to the developers of build tools, especially those in the Java ecosystem (e.g. [Buildr](http://buildr.apache.org), [Gradle](http://gradle.org/), [Maven](http://maven.apache.org), etc.).

Very simply: *please keep a project's dependency information decoupled from the rest of build file.*

More concretely, I think projects should follow Ivy's lead and use a separate file, e.g. `ivy.xml`, to maintain a project's dependencies.

I'm not saying this separate file has to be Ivy-based (that would have been nice, but Ivy seems to have missed its window of opportunity); but it should probably, in the long term, work out to a kind of accepted standard, kind of like the Maven repository layout.

Allows Mixing CLI and IDE Tools
-------------------------------

I have several reasons that I think this is a good idea, but the primary one is that it *allows separate tools, e.g. an IDE and the CLI build, to share dependencies without directly knowing about each other*.

I find it quite powerful to use, say, [IvyDE](http://ant.apache.org/ivy/ivyde/) in Eclipse and [buildr](http://buildr.apache.org) on the CLI, two build tool projects that don't know a thing about each other, and as long as each loads the `ivy.xml` file, everything *just works*.

Why do I use an IvyDE+Buildr combination? For one reason: "Resolve dependencies in workspace".

This is an IvyDE feature where, if Project A depends on Project B, but I already have Project B open in the IDE, then the plugin automatically adds the cross-project dependency to Project A's classpath instead of using the `project-b.jar` file. For me, this is a huge productivity boost for iteratively working across multiple projects, as you can avoid the expensive step of constantly rebuilding `project-b.jar`.

Buildr doesn't have an Eclipse plugin (nor does Gradle), which is fine, I don't expect them to write Eclipse plugins, which are generally a pita. However, I also don't find static generation of `.classpath` files, `mvn eclipse:eclipse` style, to be a suitable method of injecting dependencies from the build tool into the IDE.

At least with the code I work on, which is lots of small projects that I only have a few open at any given time, "Resolve dependencies in workspace" is a must have.

Stop Writing Separate IDE Plugins
---------------------------------

This is alluded to in the last point, but if I can use IvyDE+Buildr, why not IvyDE+Gradle? Or, if not IvyDE, whatever the next-generation build-tool agnostic Eclipse/IDE plugin might be.

Personally, I think projects like Buildr and Gradle, who don't have the resources of Maven to go build their own `m2e`-clone plugins, should be delighted to have a build-tool-agnostic IDE plugin like IvyDE (or similar) provide their IDE integration basically for free.

This seems like a great win. Eclipse plugins sucks to write. They're very finicky and take a long time to get production ready.

Given what a different skill set writing an Eclipse plugin is from writing, say, Buildr or Gradle, it seems beneficial these separate tools to pool their collective resources/communities behind IvyDE or an IvyDE-like alternative, instead of wasting their cycles building essentially duplicate, likely inferior plugins.

Note that this point is predicated on the assumption that all an IDE plugin needs is the dependencies (the modules, repository locations, etc. to resolve to jar files)--that no other CLI/IDE magic needs to happen. However, I think this is fine--in my experience, this has been the case.

Granted, it seems like `m2e` bucks this trend, and actively injects more and more Maven build lifecycle smarts into the IDE, rather than just keeping it in the CLI build. I'm not enough of a Maven export to know if/why this is necessary.

But so far on my projects, I haven't needed any tighter CLI tool/IDE plugin integration, while using either Ant+IvyDE or Buildr+IvyDE. Just the dependencies has been all the IDE needs.

Dependencies Don't Need a DSL
-----------------------------

I know some tools, e.g. Buildr and Gradle, take a lot of pride in their not-Ant/not-XML DSLs. Which is great, I'm a big fan of their DSLs for customizing the build, e.g. adding pre/post logic to certain build steps or what not.

However, I see dependency information, which can end up in these DSLs (in both Buildr and Gradle) as being pretty orthogonal to the rest of the build file.

For one, dependencies (and configuration like repository locations) are primarily static. I don't need to declare dependencies in a `while` loop, or do anything that would require a Turing complete environment. Just some basic variables for common strings, and that's good.

Okay, yes, Ivy's `ivy.xml` files aren't hip these days (although I find them much easier to read than Maven `pom.xml` files, FWIW). So, use JSON or YAML or what have you. Or maybe even just clean/tighten up the XML.

