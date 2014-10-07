---
layout: post
title: Moving to Gradle
---

{{page.title}}
==============

For my open source projects, for awhile I've been using [Ant](http://ant.apache.org) + [Ivy](http://ant.apache.org/ivy/) + [IvyDE](http://ant.apache.org/ivy/ivyde/), and more recently [buildr](http://buildr.apache.org) + Ivy + IvyDE, as my preferred build environment.

There were several things I liked about this setup:

1. With Ant, I always new exactly what was happening, and why, and could fix it within minutes, albeit with some more lines of XML,

   (As surprising as it is, even to me, we actually have a well-organized, low-boilerplate Ant build system at work that is a fork of the Spring's old [common-build](https://github.com/astubbs/spring-modules/tree/master/projects/common-build) project (it basically uses Maven-style conventions so that 90%+ of a project's build logic is imported for free), so I'm not much of an Ant hater.)

2. With Ivy, I could get at Maven's transitive dependencies and repositories, without actually using Maven, and

3. With IvyDE, I could open projects in Eclipse and have cross-project references automatically hooked up.

All nice.

However, there was one major downside:

* Basically no one else used this setup.

  Especially IvyDE is very far from a "most Java programmers will already have it installed" Eclipse plugin.

Nonetheless, for a few years, I persisted, rationalizing that the setup was "good enough" for me (because it was), and I had not found an obviously better alternative (buildr was close; if buildr had seen the uptake the Gradle has, I'd be happy with it).

I am not entirely sure what changed, maybe it was the recent surge in new build systems (Gradle getting momentum, Pants from Twitter, and Buck from Facebook), or Ivy being a frustratingly dwindling community (despite it powering the Maven side of many of these new build systems, like Gradle; which is frustrating, because it should have a really robust community because of this huge shadow usage, but instead the Ivy dev community is small and slow).

But whatever the catalyst, I decided to try growing as a person, and use Gradle for a few projects.

Even more surprising, I eschewed a hacked-together "Gradle + Ivy + IvyDE" setup (because on principle I think dependencies should be in their own file, and not mixed into build script logic), and use stock Gradle.

Turns out it does not suck.

The first project I converted was [pageobjects](https://github.com/stephenh/pageobjects), since it's very small and would be a could canary project. I also got it building on Travis, which due to wanting to `scp` the release artifacts to my Maven repo, was actually the most frustrating part (I needed the right combination of wagon ssh (not sshexe), ssh-keygen to white list the host as known, and password without a space in it; see [here](https://github.com/stephenh/pageobjects/blob/master/build.gradle) and [here](https://github.com/stephenh/pageobjects/blob/master/.travis.yml)).

After that, I converted [todomvc-tessell](https://github.com/stephenh/todomvc-tessell) to see how a GWT/Tessell project would go (fine), and then after that, [Tessell](http://www.tessell.org) proper. So far, so good.

I think the most differentiating thing about Gradle (especially vs. my prior preferred build setup) is:

* Lots of other people actually use it.

Which of course means there are Stack Overflow articles, and forum posts, and active bug trackers, and great docs, and all sorts of goodies that make learning easy.

This is actually annoying for me to admit, because I have several open source projects with zero community, because I don't invest the time in docs, or making getting started easy, or any community building.

So, anyway, with that, here are my Gradle-so-far notes/gripes:

1. Holy shit the [daemon setting](http://www.gradle.org/docs/current/userguide/gradle_daemon.html) should be the default, because it turns Gradle from "how do people use this?" slow to "basically as fast as buildr".

   I understand CI servers blah blah (can Gradle auto-detect when running in a terminal vs. headless?), but the out of the box experience without this flag is really awful.

2. Publishing source jars isn't the default, and isn't even a one-line opt-in. Wtf?

   It makes me think I'm missing something, as currently these eight lines will be in every `build.gradle` of my projects:

       task sourcesJar(type: Jar, dependsOn: classes) {
         classifier 'sources'
         from sourceSets.main.allSource
       }
 
       artifacts {
         archives sourcesJar
       }
   {: class="brush:plain"}

   Not exactly great, but not a huge deal.

3. For projects that use either [Tessell](http://www.tessell.org) or [dtonator](http://www.dtonator.org), I setup Eclipse to use [External Tool Builders](https://www.ibm.com/developerworks/opensource/tutorials/os-eclipse-tools/) to run their code generators.

   This is basically a way for Eclipse to run your code generator anytime the user saves a file (within a certain directory in the workspace), but without writing an Eclipse plugin. It's really handy.

   Previously, I'd have Eclipse run a `java` command, with the classpath set to whatever jars Ivy/IvyDE had copied into my local project `./lib` directory, e.g.:

       java -cp ./lib/'*' com.foo.MyGenerator some args
   {: class="brush:plain"}

   This worked well, as invoking `java` is quick, and the jars are already copied to lib, so it's fast enough to be ran on file save, and not get annoying.

   However, Gradle does not copy the libs to the local project directory, and even if the CLI build could be scripted to do it, I doubt the Eclipse Gradle could be similarly instrumented (I prefer to have projects setup where, if a developer is using Eclipse, they can stay only in Eclipse, and not have to sometimes toggle this Eclipse button, and other times toggle this CLI command).

   Fortunately, and very surprisingly, solely to do the should-be-the-default daemon flag, Gradle is actually fast enough to just run the entire gradle command on each wave, e.g. an external tool builder that runs:

       ./gradlew my-codegen-target
   {: class="brush:plain"}

   Every time is technically slower, but still acceptably fast, and has the bonus of reusing the `my-codegen-target` logic that the CLI build is going to need anyway.

   (I am almost disappointed this worked, because the alternative was that I was going to have to finally write an Eclipse plugin to run the Tessell/dtonator code generators, which, despite likely being a huge PITA, I'd like to do for at least one of my projects at some point.)

4. The Eclipse/STS Gradle plugin works well; it definitely has more of a "just works" feel than any Ivy/IvyDE setup I've used before.

   However, it's slightly behind IvyDE on features (and, granted, likely always will be given Ivy's tendency to be over-configurable), most particularly in terms of hooking up in-workspace projects (see [STS-2834](https://issuetracker.springsource.com/browse/STS-2834)).

   At work, we have several hundred projects, too many for a traditional multi-project Maven/Gradle build (and the projects are too unrelated for it to make sense anyway), so we heavily rely on IvyDE being able to dynamically hook up only the N projects you actually have open.

   So, that is a key feature for us/me, although I don't anticipate it being very hard for STS Gradle to do, and the issue is fairly well voted/watched. And it doesn't affect any of my open source projects.

5. I am not a Gradle expert, but so far I'm impressed by the architectural choice of Gradle differentiating the planning phase vs. the execution phase, which allows IDEs like Eclipse/IntelliJ to invoke a tooling API to probe the planning phase, but then do their own thing for the execution phase. Makes sense.

6. Travis is cool; I especially like how it will build both a regular ["pushed a branch" build](https://travis-ci.org/stephenh/tessell/builds/37016388), and then also another ["pushed a tag" build](https://travis-ci.org/stephenh/tessell/builds/37016386) (even if the tag's commit hash had already been built as part of a "pushed a branch" build).

   What this allows is some conditional logic in the `.travis.yml` file to only publish artifacts for builds that are for a tag (e.g. the `TRAVIS_TAG` variable is set):

       after_success:
         - test -n "$TRAVIS_TAG"
            && ssh-keyscan -H repo.joist.ws >> ~/.ssh/known_hosts
            && gradle uploadArchives
   {: class="brush:plain"}

   This means I can make a change, push master, and see if it builds. Then, and only then, once it's built, I can make a tag, and push the tag, and it will also get built (without needing a new commit).

   This is really nice because I can avoid burning tags on commits that won't build (e.g. if, like my Hudson setup before, I had to tag a revision before pushing it to the server, and so could end up tagging an inherently broken revision).

7. I still am not cool enough to be publishing to Maven central. Some day.

So, that's it for now.

Unlike most of my Ivy/IvyDE posts, I don't have any hard-won snippets of "wow, this was hard to figure out, so here's what posterity needs to know". Instead everything I'm doing with Gradle, even if it's immediately out-of-the-box, was pretty easy to Google for and find answers. Which is basically the point.


