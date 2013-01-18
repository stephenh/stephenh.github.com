---
layout: post
title: How to Sanely Use Ivy's Artifact Tags
---

{{page.title}}
==============

[Ivy](http://ant.apache.org/ivy/), everyone's favorite "it's not Maven" dependency manager, has a unique, idiosyncratic feature I was fighting with today: artifact tags to override which jars/artifacts you use from upstream projects.

While Maven has only project-to-project dependencies (i.e. you get all the jars in each upstream project whether you want them or not), Ivy adds the concept of configurations to select subsets of artifacts within your dependencies. E.g., in an `ivy.xml` file:

    <dependency org="upstream" name="project" rev="1.0"
        conf="default->someSubsetConf" />
{: class=brush:xml}

By using `someSubsetConf`, you can select a specific set of artifacts (only those that its own `ivy.xml` file declares as part of it's `someSubsetConf`) from the upstream project.

Ivy goes further, and that if the upstream project doesn't have a configuration in its `ivy.xml` file that suits your needs, you can request specific artifacts directly, e.g.:

    <dependency org="upstream" name="project" rev="1.0">
      <artifact name="onlyTheOneYouWant"/>
    </dependency>
{: class=brush:xml}

While this flexibility, which is very characteristic of Ivy, is often times nice, I do sometimes wonder whether Maven's non-flexibility and hence simplicity in not having confs and artifact overrides is the better choice in the long run.

Nonetheless, I use Ivy, and have used `artifact` tags on several occasions, but they never worked the way I thought they would, so I finally sat down and tried to systematically understand their semantics.

The Short Version
-----------------

1. Prefer to not use `artifact` tags--if possible, change the upstream project's configurations to match your needs and just rely on configuration-to-configuration mapping. It's more intuitive, less boilerplate.

   If you must use `artifact` tags, then:

2. *Always* add a `conf` attribute to your `artifact` tag, and

3. *Always* add a `conf` attribute to the parent `dependency` tag that is the union of all of the confs used by `artifact` tags within that dependency.

For example:

    <dependency org="upstream" name="project"
        rev="1.0" conf="conf1,conf2">
      <artifact name="artifact1" conf="conf1"/>
      <artifact name="artifact2" conf="conf2"/>
    </dependency>
{: class=brush:xml}

Will put `artifact1` in your `conf1` and `artifact2` in your `conf2`, just as you would expect. Simple.

**Be warned:** if you don't include these `conf` attributes exactly as I've described, things will very likely not work they way you expect.

If you don't care why, that's fine, this template should serve you well. If you do want to understand the incantation, that's what the next section is about.

The Long Version
----------------

This section describes each of the variations of `dependency` and `artifact` tags I used to derive Ivy's semantics and decipher the docs.

Note that I used Ivy 2.3.0-rc1, which as of this writing is current, and the `springframework` dependency comes from [Bizo](http://www.bizo.com)'s internal Ivy repository, so it doesn't match the Maven central namespace or anything like that. Substitute your own dependency with a non-trivial amount of artifacts if you want to follow along.

The base `ivy.xml` file I was using looked like:

    ...

    <configurations>
      <conf name="default"/>
      <conf name="buildtime" visibility="private"/>
      <conf name="test" visibility="private"/>
      <conf name="sources"/>
    </configurations>

    <dependencies
        defaultconfmapping="sources->sources();%->default"
        defaultconf="default;sources">
      ...
    </dependencies>
{: class=brush:xml}

And now, each of the variations:

1. Just a regular `dependency` tag:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE"/>
   {: class=brush:xml}

   Pulls in:

   * default: all `default` spring artifacts (web, servlets, test, etc.)
   * buildtime, test: no spring artifacts
   * sources: all `sources` spring artifacts (web, servlets, test, etc.)

   As expected, given our `ivy.xml` file's `defaultconf="default;sources"` setting.

   This is actually fine, and shows the intuitiveness of configuration-to-configuration mapping.

   But the idea is that the Spring `default` conf (in our internal repository) anyway pulls in a lot of various Spring jars we don't need, so we're going to try and use `artifact` to cut that down some.

2. Add just an `artifact` tag:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE">
         <artifact name="org.springframework.web" />
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime, test: no spring artifacts
   * sources: web *jar* (not sources)

   Wtf? Ivy docs on [artifact](http://ant.apache.org/ivy/history/latest-milestone/ivyfile/dependency-artifact.html):

   "By default, if no (artifact) configuration is specified, artifacts specification applies to all master configurations."

   What is a "master configuration? Ivy docs on [dependency](http://ant.apache.org/ivy/history/latest-milestone/ivyfile/dependency.html):

   "This mapping (`conf` attribute of `dependency` tag) indicates which configurations of the dependency are required in which configurations of the current module, also called master configurations."

   So, due to `defaultconf="default;sources"`, those are our "master configurations" for this artifact, and the web *jar* artifact is put in both the default and sources confs.

   **Take away:** Leaving off `artifact`'s `conf` attribute puts the artifact in any master configuration, which is probably not what you want. Add a `conf`.

3. Add an `artifact` tag with `conf` attribute:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE">
         <artifact name="org.springframework.web" conf="default"/>
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime, test: no spring artifacts
   * sources: *all spring sources*

   Wtf? Ivy docs on [artifact](http://ant.apache.org/ivy/history/latest-milestone/ivyfile/dependency-artifact.html):

   "do not forget that if you do not specify any specification for a particular configuration (none of the artifact's confs include the master configuration) then no specification will apply for this configuration and it will be resolved not taking into account any specification."

   Since we used `conf=default` but had no `conf=sources` anywhere, sources fell back to using the default mapping, and pulled in all sources artifacts.

   **Take away**: If you add an `artifact` `conf`, set the parent `dependency` `conf` to include only those confs that you've mapped.

4. Add an `artifact` tag with `conf` attribute and `dependency` `conf`:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE" conf="default">
         <artifact name="org.springframework.web" conf="default"/>
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime, test: no spring artifacts
   * sources: no spring artifacts

   As expected.

5. Add two `artifact` tags with `conf` attributes:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE">
         <artifact name="org.springframework.web" conf="default"/>
         <artifact name="org.springframework.web-sources" type="sources" ext="jar" conf="sources"/>
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime, test: no spring artifacts
   * sources: web sources

   As expected. All master configurations had `artifact` tag overrides, so none of them (`master` or `sources`) fell back to their default mapping.

6. Add two `artifact` tags with one non-"master" `conf` attribute:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE">
         <artifact name="org.springframework.web" conf="default"/>
         <artifact name="org.springframework.test" conf="test"/>
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime: no spring artifacts
   * test: *no* spring artifacts
   * sources: all spring sources

   Wtf? Ivy docs on [artifact](http://ant.apache.org/ivy/history/latest-milestone/ivyfile/dependency-artifact.html):

   `conf` attribute is "comma separated list of the *master configurations* in which this artifact should be included."

   `test` is not a master configuration, so it is essentially ignored.

   **Take away:** if you add an `artifact` `conf`, ensure it is a master configuration, or just add it to the `dependency` `conf` to make sure

7. Two `artifact` tags, both with "master" `conf` attributes:

       <dependency org="springframework" name="spring"
           rev="3.0.6.RELEASE" conf="default,test">
         <artifact name="org.springframework.web" conf="default"/>
         <artifact name="org.springframework.test" conf="test"/>
       </dependency>
   {: class=brush:xml}

   Pulls in:

   * default: web jar
   * buildtime: no spring artifacts
   * test: test jar
   * sources: no spring sources

   As expected, given the behavior discovered so far.

Note on Transitive Dependencies
-------------------------------

Just a quick note, but while `artifact` let's you pick apart an upstream project's artifacts for only those you want, this doesn't have any affect on the transitive dependencies you inherit from the project--those are still based strictly on configurations.

Usually this just means you'll end up pulling in more transitive dependencies than you need, but I think it re-enforces the notion the `artfact` override is a hack and that finding a way to do configuration-to-configuration mappings is a better way to do things with Ivy.

Conclusion
----------

Don't use `artifact` tags. If you do, always specify *both* the `dependency` `conf` and the `artifact` `conf`.

