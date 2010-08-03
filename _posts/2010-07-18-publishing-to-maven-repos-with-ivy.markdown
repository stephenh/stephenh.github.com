---
layout: post
title: Publishing to Maven Repos with Ivy
---

Publishing to Maven Repos with Ivy
==================================

Publishing to Maven repositories is a fact of life for projects in the Java community.

While I am not a fan of Maven itself, I readily admit that the standard shared repository/transitive-metadata approach they have driven has been a great thing for the community. While I was initially skeptical, downloading dependencies and getting them out of source code repos is a good thing. 

Using Ivy
---------

That being said, I prefer to leverage Maven repositories from a safe, arms length distance via the excellent [Ivy](http://ant.apache.org/ivy) (and [IvyDE](http://ant.apache.org/ivy/ivyde/)) tool which, besides other features, can understand the Maven repository format both as a source for dependencies and destination for publishing projects.

While Ivy-to-Maven works well, it did take me a few tries to get it right, so here are the various settings/files that so far are doing the job.

`ivysettings.xml`
-----------------

This is the [gwt-mpv-dev `ivysettings.xml`](http://github.com/stephenh/gwt-mpv/tree/master/dev/ivysettings.xml), with comments added.

    <ivysettings>
      <!--
        This property is used later in the ivy.xml file to set
        the project's revision. Unless overridden, it defaults
        to the Maven SNAPSHOT convention, as that it works well
        for publishing local test builds to ~/.m2/repository.
      -->
      <property name="revision" value="SNAPSHOT" override="false"/>

      <!-- "default" is defined later in the file. -->
      <settings defaultResolver="default"/>

      <!-- Pulls in the "public" resolver for ibiblio-hosted jars. -->
      <include url="${ivy.default.settings.dir}/ivysettings-public.xml"/>

      <resolvers>
        <!-- add any 3rd-party maven repos here... -->
        <ibiblio name="joist" m2compatible="true" root="http://repo.joist.ws"/>

        <!--
          for *retrieving* artifacts for local testing builds,
          we'll use maven's own .m2/repository.
        -->
        <ibiblio name="local-m2" m2compatible="true" root="file://${user.home}/.m2/repository"/>

        <!--
          for *publishing* artifacts for local testing builds,
          as the previous ibiblio resolver does not support
          publishing
        -->
        <filesystem name="local-m2-publish" m2compatible="true">
          <artifact pattern="${user.home}/.m2/repository/[organisation]/[module]/[revision]/[artifact]-[revision](-[classifier]).[ext]"/>
        </filesystem>

        <!--
          for publishing release artifacts via an sshfs-mounted share
        -->
        <filesystem name="share-m2" m2compatible="true">
          <artifact pattern="${user.home}/repo/[organisation]/[module]/[revision]/[artifact]-[revision](-[classifier]).[ext]"/>
        </filesystem>

        <!-- strings the separate resolvers all together -->
        <chain name="default">
          <resolver ref="local-m2"/>
          <resolver ref="joist"/>
          <resolver ref="public"/>
        </chain>
      </resolvers>
    </ivysettings>
{: class=brush:xml}

The primary gotcha in this `ivysettings.xml` was having to use two separate resolvers for the same `~/.m2/repository`. This is because:

* Only the `ibiblio` resolver will parse poms and follow the pom's transitive dependencies.

  (Technically the `filesystem` or `url` resolvers could retrieve jars with a Maven-ish artifact pattern, but the pom dependencies would be skipped.)

* The `ibiblio` resolver does not support publishing, so we have to fall back to the `filesystem` resolver with a Maven-ish artifact pattern to publish.

So, with the current Ivy 2.1.0 capabilities, it takes two resolvers for a single Maven repo if you want to both retrieve from and publish to it.

`ivy.xml`
---------

This is the [gwt-mpv-dev `ivy.xml`](http://github.com/stephenh/gwt-mpv/tree/master/dev/ivy.xml), again with comments. 

    <ivy-module version="2.0" xmlns:m="http://ant.apache.org/ivy/maven">
      <!--
        We set the revision to the revision property from
        ivysettings.xml, which defaults to SNAPSHOT. This
        is overriden when publishing.
      -->
      <info organisation="org.gwtmpv" module="gwt-mpv-dev" revision="${revision}"/>

      <!--
        I'm not a huge fan of a separate sources conf,
        but that is how Ivy's ibiblio resolver converts
        poms, so we'll stay consistent with that.
      -->
      <configurations>
        <conf name="default"/>
        <conf name="sources"/>
      </configurations>

      <publications>
        <!--
          We explicitly list a pom as an artifact of our
          project. This way the Ivy publish task will
          upload the pom to the maven repo, along with
          the jars and sources.
        -->
        <artifact type="pom" ext="pom" conf="default"/>

        <!--
          This is the main jar, nothing special.
        -->
        <artifact type="jar" ext="jar" conf="default"/>

        <!--
          To publish sources to a maven repo, the
          m:classifier="sources" is required.
        -->
        <artifact type="source" ext="jar" conf="sources" m:classifier="sources"/>
      </publications>

      <!--
        defaultconf == we want the jars + sources for our dependencies
        defaultconfmapping == unless specified otherwise, our confs map
          to default for our dependencies
      -->
      <dependencies defaultconfmapping="sources->sources(),%->default" defaultconf="default,sources">
        <!--
          gwt-mpv-user is published simultaneously with
          gwt-mpv-dev, so depend on the same exact revision.
        -->
        <dependency org="org.gwtmpv" name="gwt-mpv-user" rev="${revision}" conf="default"/>

        <!-- other dependencies -->
        <dependency org="com.google.gwt" name="gwt-dev" rev="2.1.0.M1" conf="default"/>
      </dependencies>
    </ivy-module>
{: class=brush:xml}

`build.xml`
-----------

Finally, here is the Ivy-related part of the [gwt-mpv-dev `build.xml`](http://github.com/stephenh/gwt-mpv/tree/master/dev/build.xml):

    <property name="ivy.jar.version" value="2.1.0"/>
    <property name="ivy.jar.name" value="ivy-${ivy.jar.version}.jar"/>
    <property name="ivy.home" value="${user.home}/.ivy2"/>
    <available property="ivy.installed" file="${ivy.home}/${ivy.jar.name}"/>

    <!-- 
      this is called once and auto-installs the ivy jar into
      ~/.ivy2 so that users only have to have ant to build.
    -->
    <target name="ivy-install" unless="ivy.installed">
      <mkdir dir="${ivy.home}"/>
      <get src="http://repo1.maven.org/maven2/org/apache/ivy/ivy/${ivy.jar.version}/${ivy.jar.name}" dest="${ivy.home}/${ivy.jar.name}"/>
    </target>

    <!--
      this is called automatically and just inits ivy
    -->
    <target name="ivy-init" depends="ivy-install">
      <taskdef resource="org/apache/ivy/ant/antlib.xml" uri="antlib:org.apache.ivy.ant" classpath="${ivy.home}/${ivy.jar.name}"/>
      <ivy:resolve/>
    </target>

    <!--
      called by the user to download jars into bin/lib/
    -->
    <target name="ivy-retrieve" depends="ivy-init" description="downloads jars for the project">
      <ivy:retrieve pattern="bin/lib/[conf]/[type]s/[artifact].[ext]" conf="*" type="*"/>
    </target>

    <!--
      makes a pom for the project based off the ivy.xml file
    -->
    <target name="gen-pom" depends="ivy-init">
      <ivy:makepom ivyfile="ivy.xml" pomfile="bin/poms/${ant.project.name}.pom">
        <!--
          Mapping confs to scopes is important, otherwise
          unmapped confs are included as optional. If you
          have private confs, the best option seems to
          be marking them as provided or system. See
          IVY-1201 for an ehancement request.
        -->
        <mapping conf="default" scope="compile"/>
      </ivy:makepom>
    </target>

    <!--
      publishes to ~/.m2/repository so that other testing
      builds on our local machine can see it
    -->
    <target name="ivy-publish-local" depends="jar,ivy-init,gen-pom" description="publish jar/source to maven repo mounted at ~/.m2/repository">
      <ivy:publish resolver="local-m2-publish" forcedeliver="true" overwrite="true" publishivy="false">
        <artifacts pattern="bin/[type]s/[artifact].[ext]"/>
      </ivy:publish>
      <!-- snapshots only exist locally, so kick the cache. -->
      <delete>
        <fileset dir="${ivy.cache.dir}/${ivy.organisation}/${ivy.module}" includes="**/*SNAPSHOT*"/>
      </delete>
    </target>

    <!--
      pubishes to the ~/repo directory, which should be something
      like an sshfs-mount of the public maven repository you are
      publishing to
    -->
    <target name="ivy-publish-share" depends="jar,ivy-init,gen-pom" description="publish jar/source to maven repo mounted at ~/repo">
      <ivy:publish resolver="share-m2" forcedeliver="true" overwrite="true" publishivy="false">
        <artifacts pattern="bin/[type]s/[artifact].[ext]" />
      </ivy:publish>
    </target>
{: class=brush:xml}

Making Poms
-----------

The `build.xml` file above uses Ivy's `makepom` Ant task to convert our project's `ivy.xml` into a `project.pom` before uploading it to the Maven repository.

This is generally acceptable, insofar as Ivy will get all of the dependencies translated correctly, but you'll end up with a very minimal pom.

So if you want to add more elements to the pom, it is probably easiest to just hand-maintain a `project.pom.template` and use a simple Ant filter to update the version on each build before being uploaded.

For example, [gwt-mpv-dev-0.1.pom](http://repo.joist.ws/org/gwtmpv/gwt-mpv-dev/0.1/gwt-mpv-dev-0.1.pom) was built automatically by `makepom`, while [gwt-mpv-apt-1.3.pom](http://repo.joist.ws/org/gwtmpv/gwt-mpv-apt/1.3/gwt-mpv-apt-1.3.pom) was built from a hand-maintained template.

Local Testing Builds
--------------------

So far I have not published `SNAPSHOT` versions publicly, but they are very handy for sharing in-development changes between projects on your local machine. Just doing:

    ant ivy-publish-local
{: class=brush:plain}

Will publish a jar to `~/.m2` for other local projects to pull in your latest/uncommitted changes.

Since we're going through the `local-m2` `<ibiblio/>` resolver, Ivy automatically handles latest-`SNAPSHOT` checking and we don't have to bother with any `~/.ivy2/cache`-busting tricks like I talked about in [Ivy Is Useful](/2009/04/23/ivy-is-useful.html).

Though if you're using [IvyDE](http://ant.apache.org/ivy/ivyde/) and workspace resolution of dependencies, Eclipse should setup all of the cross-project references correctly and you won't have to constantly publish `SNAPSHOT` jars just for local consumption each time you make a change.

Doing Releases
--------------

With the above setup, I can now publish `gwt-mpv` to the [joist repo](http://repo.joist.ws/org/gwtmpv) via:

    ant -Drevision=x.y ivy-publish-share
{: class=brush:plain}

It Works
--------

While this looks like a lot of code, my inline comments added a lot--it is generally ~50 lines of `ivysettings.xml` and `ivy.xml` per-project and then ~50 lines of straight-forward `build.xml` Ant code.

While this is more than, say, 10 LOC, it hasn't been burdensome enough for me to investigate anything else, e.g. [Buildr](http://buildr.apache.org), or even near burdensome enough to consider using Maven itself.

I should probably throw the common files into a shared git repository and then git submodule them around instead of being reduced to copy/paste. But I haven't gotten around to it yet, and it seems like each project always has some tweak here or there that would be annoying to generalize.

Nonetheless, this has been working well for me. If I made any errors or omissions, please let me know.


