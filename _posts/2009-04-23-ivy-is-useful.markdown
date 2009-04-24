---
layout: post
title: Ivy is Useful
---

Ivy is Useful
=============

After being burned by Maven, I've shunned any sort of dependency management solution that is not just checking jars into the SCM.

However, I finally ran into a "parent-with-sub-project" type of arrangement in [Joist](http://joist.ws), and so needed a way to locally publish SNAPSHOT/in-progress jars for the subsequent builds to find them.

After hacking around with my own Ant-based home directory jar cache, I decided to kick Ivy's tires, and I've been quite pleased.

Here's a few things I've learned:

* [IvyDE](http://ant.apache.org/ivy/ivyde/) rocks, especially being able to recognize other open Eclipse projects and put them on the classpath instead of the cached SNAPSHOT jars, so now you can just hit save and not have to worry about updating jars.

  You have to enable this in Java Build Path, Libraries, ivy.xml, Advanced, check Resolve dependencies in workspace.

* [IvyDE](http://ant.apache.org/ivy/ivyde/) is still immature--the `ivy.xml` has to resolve of its dependencies perfectly or else you are kind of screwed. It's best to get you `ivy.xml`, `ivysettings.xml` working with Ant first, then try Eclipse and IvyDE.

  Opening/closing the Eclipse project seems like the best way to get IvyDE to "try again".

* I use a small variation of the Ivy documentation's bootstrapping logic to auto-install Ivy (and JSch) into `~/.ivy2` so that Ant users do not need to download it by hand

<pre name="code" class="xml">
    &lt;project name="ivybootstrap" xmlns:ivy="antlib:org.apache.ivy.ant"&gt;
      &lt;!--
      The "ivy.bootstrap" target ensures ivy and JSCH are downloaded and installed
      in the user's $HOME/.ivy2 directory so we can implicitly taskdef them into
      this ant context without messing with the $ANT_HOME/lib directory or
      otherwise having the user explicitly go download ivy.
      --&gt;

      &lt;property name="ivy.jar.version" value="2.0.0"/&gt;
      &lt;property name="ivy.jar.name" value="ivy-${ivy.jar.version}.jar"/&gt;
      &lt;property name="ivy.home" value="${user.home}/.ivy2"/&gt;
      &lt;available property="ivy.installed" file="${ivy.home}/${ivy.jar.name}"/&gt;

      &lt;property name="jsch.jar.version" value="0.1.29"/&gt;
      &lt;property name="jsch.jar.name" value="jsch-${jsch.jar.version}.jar"/&gt;
      &lt;available property="jsch.installed" file="${ivy.home}/${jsch.jar.name}"/&gt;

      &lt;target name="ivy.install" unless="ivy.installed"&gt;
        &lt;mkdir dir="${ivy.home}"/&gt;
        &lt;get src="http://repo1.maven.org/maven2/org/apache/ivy/ivy/${ivy.jar.version}/${ivy.jar.name}" dest="${ivy.home}/${ivy.jar.name}"/&gt;
      &lt;/target&gt;

      &lt;target name="jsch.install" unless="jsch.installed"&gt;
        &lt;get src="http://repo1.maven.org/maven2/jsch/jsch/${jsch.jar.version}/${jsch.jar.name}" dest="${ivy.home}/${jsch.jar.name}"/&gt;
      &lt;/target&gt;

      &lt;target name="ivy.bootstrap" depends="ivy.install,jsch.install" unless="ivy.bootstrapped"&gt;
        &lt;taskdef resource="org/apache/ivy/ant/antlib.xml" uri="antlib:org.apache.ivy.ant" classpath="${ivy.home}/${ivy.jar.name};${ivy.home}/${jsch.jar.name}"/&gt;
        &lt;property name="ivy.bootstrapped" value="true"/&gt; &lt;!-- Avoid re-bootstrapping because it causes classloader issues. --&gt;
      &lt;/target&gt;
    &lt;/project&gt;
</pre>

* The default settings gave me a fit trying to get SNAPSHOTs to work--ivy is pretty insistent about caching as much as it possibly can.

  Which is cool, but it grew annoying when it would not check the *local* repo, `~/.ivy2/local`, for a newly-published SNAPSHOT just because a SNAPSHOT already existed in the cache, `~/.ivy2/cache`.

  I ended up using a `local-checkmodified` resolver to bust through: 

<pre name="code" class="xml">
    &lt;ivysettings&gt;
      &lt;settings defaultResolver="default"/&gt;
      &lt;include url="${ivy.default.settings.dir}/ivysettings-public.xml"/&gt;
      &lt;include url="${ivy.default.settings.dir}/ivysettings-local.xml"/&gt;
      &lt;resolvers&gt;
        &lt;!-- Copy/paste from ivysettings-local.xml bith with checkmodified/changingPattern to bust the cache for snapshots. --&gt;
        &lt;filesystem name="local-checkmodified" checkmodified="true" changingPattern=".*SNAPSHOT"&gt;
          &lt;ivy pattern="${ivy.local.default.root}/${ivy.local.default.ivy.pattern}" /&gt;
          &lt;artifact pattern="${ivy.local.default.root}/${ivy.local.default.artifact.pattern}" /&gt;
        &lt;/filesystem&gt;

        &lt;!-- Repeating the checkmodified/changingPattern incantation here is very important. --&gt;
        &lt;chain name="default" checkmodified="true" changingPattern=".*SNAPSHOT"&gt;
          &lt;resolver ref="local-checkmodified"/&gt;
          &lt;resolver ref="public"/&gt;
        &lt;/chain&gt;
      &lt;/resolvers&gt;
    &lt;/ivysettings&gt;
</pre>

  I would be hesitant to use the `checkmodified` flag on any resolver that was not local, so would not publish SNAPSHOTs to a publicly-accessible repository.

Overall I've found Ivy pleasant and look forward to future releases, especially of IvyDE.

