---
layout: post
title: Preferred Build Setup
section: Java
---

{{page.title}}
==============

**Update May 2018** [Gradle](https://gradle.org) has won the current era of Java build tooling.

I'm settling in to a build setup (for Java projects) that I'm reasonably comfortable with.

My current preference is:

* An [Ivy](http://ant.apache.org/ivy/) file to express dependencies
* [Buildr](http://buildr.apache.org) with [ivy4r](https://github.com/klaas1979/ivy4r) to do command line builds
* Eclipse with [IvyDE](http://ant.apache.org/ivy/ivyde/) for Eclipse builds

Requirements
------------

This satisfies my four key requirements:

1. Not be Maven

   This is self-explanatory.

2. Pull dependencies from a Maven repository

   As I've [admitted before][1], I dislike Maven, but it's repo concept has been awesome for the Java community. Except for initially screwing up the group ids (`commons-lang/commons-lang`), they did good.

   While I think Ivy is generally over-engineered (every setting, repo layout, etc., is super extensible), I like having one file (`ivy.xml`) that is for dependencies, and *only* dependencies, that both a CLI tool and an Eclipse plugin can read in.

   (I.e. I don't like encoding my dependencies directly in Buildr's `buildfile`, because then they can't be leveraged by an "in-workspace resolution"-capable Eclipse plugin.)

3. Publish artifacts to a Maven repository

   Buildr publishes very nicely to Maven repositories--with pure Ivy, this took [some ugly hacks][1].

4. Eclipse "in-workspace" dependency resolution

   This is my must-have feature. If project Foo depends on project Bar, and I have both of them open in Eclipse, Foo should not be using bar.jar, but should instead have the Bar project's class files directly on it's classpath. That way I don't have to re-jar Bar each time I want to test the latest changes in Foo.

   This is the primary flaw with any build solution that generates static `.eclipse` files (e.g. Buildr's out of the box eclipse integration, or the old-school `mvn eclipse:eclipse` integration). An Eclipse plugin can tell which projects it does/does not have open, and update each project's cross-project dependencies on the fly.

   Admittedly, the [m2eclipse](http://m2eclipse.sonatype.org/) plugin does this well for Maven. And it seems more solid than IvyDE. Kudos, it's a great feature. But it's still Maven.

Ant vs. Buildr
--------------

I used to have all of this working with Ant, but it was terribly verbose and involved a lot of copy/paste for each new project. That being said, it was simple and "just worked", so I lived with it for quiet awhile.

However, after using Buildr for a few projects, I've been very pleased with it.

In my opinion, Buildr does an good job of having sane "Standard Java project" defaults that you can tweak when needed. Basically it's a better Maven.

My two complaints with Buildr are:

1. Being an embedded DSL in a dynamic language, I find it hard to discover how to do new things. Once you know the right `method_missing`/whatever-backed incantation, it makes sense. But, personally, I think it is too flexible. I'd be willing to sacrifice some succinctness for a less magical DSL. (Of course, I'm a Java programmer.)

2. It has (currently) half-baked dependencies support--the pom it generates for you won't contain any dependencies, making it useless. However, this isn't a big deal since I use `ivy4r` to leverage the external `ivy.xml` file anyway. It'd just be nice if this was supported as a first-class setup.

Aether Possibilities
--------------------

I really like the looks of [Aether](http://aether.sonatype.org/).

I'd love to see someone build a `m2eclipse`-lite Eclipse plugin that read in a minimal, `ivy.xml`-type file (not a huge `pom.xml`), and could replace the admittedly fickle IvyDE.

Buildr is [also potentially getting Aether support](https://github.com/mguymon/buildr-resolver). Granted, it'd use the `buildfile`-based dependencies and not an external XML file.

But if it did, and this `m2eclipse`-lite plugin showed up, I would switch.

Example
-------

This is the build setup for my [pageobjects](https://github.com/stephenh/pageobjects) project. It uses buildr/ivy, and is small and simple, so should be a good example.

### `ivy.xml`

This is where dependencies are declared. The Ivy confs are a lot like Maven's scopes, so you can differentiate compile-time vs. build-time dependencies.

```xml
<ivy-module version="2.0">
  <info organisation="com.bizo" module="pageobjects" revision="${version}"/>
  <configurations>
    <conf name="default" extends="compile"/>
    <conf name="compile"/>
    <conf name="sources"/>
  </configurations>
  <dependencies defaultconfmapping="%->default;sources->sources()">
    <dependency org="org.seleniumhq.selenium" name="selenium" rev="r9790" conf="compile;sources" />
    <dependency org="junit" name="junit" rev="4.8.1" conf="compile;sources" />
  </dependencies>
</ivy-module>
```

Things to note:

* For your dependencies, use `conf` names that map to Maven scope names, so that the Ivy-generated `pom.xml` (for uploading to a Maven repo) maps your dependencies correctly.  

  Otherwise your dependencies will all be listed as `<optional>true</optional>`, which is terribly annoying.

### `ivysettings.xml`

Ivy uses a separate file to configure, among other things, the repositories you want to pull artifacts from. The `ibiblio` resolver works great for any Maven repository.

```xml
<ivysettings>
  <settings defaultResolver="default"/>
  <include url="${ivy.default.settings.dir}/ivysettings-public.xml"/>
  <property name="version" value="SNAPSHOT" override="false"/>
  <resolvers>
    <ibiblio name="local-m2" m2compatible="true" root="file://${user.home}/.m2/repository" changingPattern=".*SNAPSHOT"/>
    <ibiblio name="joist-m2" m2compatible="true" root="http://repo.joist.ws"/>
    <chain name="default" changingPattern=".*SNAPSHOT">
      <resolver ref="public"/>
      <resolver ref="local-m2"/>
      <resolver ref="joist-m2"/>
    </chain>
  </resolvers>
</ivysettings>
```

Things to note:

* `changingPattern` is required for snapshots

   I always set this for at least my `local-m2` resolver so that I can test local builds of other projects. Other than that, I've been using mostly timestamped jars of projects instead of snapshots.

### `.classpath`

This, of course, is the Eclipse classpath file.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<classpath>
  <classpathentry kind="src" path="src/main/java"/>
  <classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER"/>
  <classpathentry kind="con" path="org.apache.ivyde.eclipse.cpcontainer.IVYDE_CONTAINER/?ivyXmlPath=ivy.xml&amp;confs=*&amp;ivySettingsPath=%24%7Bworkspace_loc%3Apageobjects%2Fivysettings.xml%7D&amp;loadSettingsOnDemand=false&amp;propertyFiles="/>
  <classpathentry kind="output" path="target/eclipse"/>
</classpath>
```

Things to note:

* Thanks to the `IVYDE_CONTAINER` line, this file is nice and short and won't change any time you add/remove a dependency

### `buildfile`

This is what drives the Buildr build. It's like a `build.xml` file, but written in Ruby, and baked by [Rake](http://rake.rubyforge.org/):

```ruby
require 'buildr/ivy_extension'

VERSION_NUMBER = ENV['version'] || 'SNAPSHOT'

repositories.remote << "http://www.ibiblio.org/maven2/"
repositories.release_to = 'sftp://joist.ws/var/joist.repo'
repositories.release_to[:permissions] = 0644

# to resolve the ${version} in the ivy.xml
Java.java.lang.System.setProperty("version", VERSION_NUMBER)

define "pageobjects" do
  project.version = VERSION_NUMBER
  project.group = 'com.bizo'
  ivy.compile_conf('compile')

  package_with_sources

  package(:jar).pom.tap do |pom|
    pom.enhance [task('ivy:makepom')]
    pom.from 'target/pom.xml'
  end
end
```

Things to note:

* You pass in the version number with an environment variable, e.g. `version=x.y buildr upload`

* The line `repositories.remote << ...` is there because even though we use Ivy to get the project's actual dependencies, Buildr still needs the standard Maven repo to bootstrap dependencies from.

* `ivy.compile_conf('compile')` is what glues the Ivy-fetched dependencies into Buildr's compile classpath. There is also a `test_conf` method, e.g. `ivy.test_conf('test')`. 

* `package(:jar).pom.tap` is a small 4-line hack to tell Buildr to run `ivy:makepom` and that it's output (`target/pom.xml`) will override Buildr's default pom file for our project

That's It
---------

So, that is what is working well for me these days. I particularly like that my standard Buildr `buildfile` is only ~20 lines long.

For my [joist](http://joist.ws) ORM project, I was able to use a ~50-line `buildfile` to replace ~1200 lines of extremely boilerplate, copy/pasted Ant XML code.

That was quite gratifying--although, in retrospect, somewhat embarrassing that I had let that much Ant code accumulate and was still deluding myself that it was an acceptable setup.

[1]: http://www.draconianoverlord.com/2010/07/18/publishing-to-maven-repos-with-ivy.html


