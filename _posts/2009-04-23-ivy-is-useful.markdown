---
layout: post
title: Ivy is Useful
section: Java
---

Ivy is Useful
=============

After being burned by Maven, I've shunned any sort of dependency management solution that is not just checking jars into the SCM.

However, I finally ran into a "parent-with-sub-project" type of arrangement in [Joist](http://joist.ws), and so needed a way to locally publish SNAPSHOT/in-progress jars for the subsequent builds to find them.

After hacking around with my own Ant-based home directory jar cache, I decided to kick Ivy's tires, and I've been quite pleased.

Here's a few things I've learned:

* [IvyDE](http://ant.apache.org/ivy/ivyde/) rocks, especially being able to recognize other open Eclipse projects and put them on the classpath instead of the cached SNAPSHOT jars, so now you can just hit save and not have to worry about updating jars.

  You have to enable this in Java Build Path, Libraries, `ivy.xml`, Advanced, check Resolve dependencies in workspace.

* [IvyDE](http://ant.apache.org/ivy/ivyde/) is still immature--the `ivy.xml` has to resolve of its dependencies perfectly or else you are kind of screwed. It's best to get you `ivy.xml`, `ivysettings.xml` working with Ant first, then try Eclipse and IvyDE.

  Opening/closing the Eclipse project seems like the best way to get IvyDE to "try again".

* I use a small variation of the Ivy documentation's bootstrapping logic to auto-install Ivy (and JSch) into `~/.ivy2` so that Ant users do not need to download it by hand

  ```xml
  <project name="ivybootstrap" xmlns:ivy="antlib:org.apache.ivy.ant">
    <!--
    The "ivy.bootstrap" target ensures ivy and JSCH are downloaded and installed
    in the user's $HOME/.ivy2 directory so we can implicitly taskdef them into
    this ant context without messing with the $ANT_HOME/lib directory or
    otherwise having the user explicitly go download ivy.
    -->

    <property name="ivy.jar.version" value="2.0.0"/>
    <property name="ivy.jar.name" value="ivy-${ivy.jar.version}.jar"/>
    <property name="ivy.home" value="${user.home}/.ivy2"/>
    <available property="ivy.installed" file="${ivy.home}/${ivy.jar.name}"/>

    <property name="jsch.jar.version" value="0.1.29"/>
    <property name="jsch.jar.name" value="jsch-${jsch.jar.version}.jar"/>
    <available property="jsch.installed" file="${ivy.home}/${jsch.jar.name}"/>

    <target name="ivy.install" unless="ivy.installed">
      <mkdir dir="${ivy.home}"/>
      <get src="http://repo1.maven.org/maven2/org/apache/ivy/ivy/${ivy.jar.version}/${ivy.jar.name}" dest="${ivy.home}/${ivy.jar.name}"/>
    </target>

    <target name="jsch.install" unless="jsch.installed">
      <get src="http://repo1.maven.org/maven2/jsch/jsch/${jsch.jar.version}/${jsch.jar.name}" dest="${ivy.home}/${jsch.jar.name}"/>
    </target>

    <target name="ivy.bootstrap" depends="ivy.install,jsch.install" unless="ivy.bootstrapped">
      <taskdef resource="org/apache/ivy/ant/antlib.xml" uri="antlib:org.apache.ivy.ant" classpath="${ivy.home}/${ivy.jar.name};${ivy.home}/${jsch.jar.name}"/>
      <property name="ivy.bootstrapped" value="true"/> <!-- Avoid re-bootstrapping because it causes classloader issues. -->
    </target>
  </project>
  ```

* The default settings gave me a fit trying to get SNAPSHOTs to work--Ivy is pretty insistent about caching as much as it possibly can.

  Which is cool, but it grew annoying when it would not check the *local* repo, `~/.ivy2/local`, for a newly-published SNAPSHOT just because a SNAPSHOT already existed in the cache, `~/.ivy2/cache`.

  I ended up using a `local-snapshot` resolver to bust through: 

  ```xml
  <ivysettings>
    <settings defaultResolver="default"/>
    <include url="${ivy.default.settings.dir}/ivysettings-public.xml"/>
    <include url="${ivy.default.settings.dir}/ivysettings-local.xml"/>
    <resolvers>
      <!-- Copy/paste from ivysettings-local.xml with with changingPattern to bust the cache for snapshots. -->
      <filesystem name="local-snapshot" changingPattern=".*SNAPSHOT">
        <ivy pattern="${ivy.local.default.root}/${ivy.local.default.ivy.pattern}" />
        <artifact pattern="${ivy.local.default.root}/${ivy.local.default.artifact.pattern}" />
      </filesystem>

      <!-- Repeating the changingPattern incantation here is very important. -->
      <chain name="default" changingPattern=".*SNAPSHOT">
        <resolver ref="local-snapshot"/>
        <resolver ref="public"/>
      </chain>
    </resolvers>
  </ivysettings>
  ```

  **Update:** I previously had `checkmodified=true` set on both `localhost-snapshot` and `chain` resolvers, however, I don't believe this is required.

Overall I've found Ivy pleasant and look forward to future releases, especially of IvyDE.

