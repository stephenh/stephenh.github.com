---
title: Joist Execute Class
description: ""
date: 2012-11-02T00:00:00Z
tags: ["Joist-Java"]
---



I was porting a Ruby script to Scala today, and was reintroduced to how shockingly low-level the Java process APIs are.

For example, things you probably take for granted, like:

* Resolving a simple executable name to an absolute path via `PATH` variable
* Passing the current process's environment variables on to the child process
* Managing the stdin, stdout, stderr buffers to ensure they don't get full (which blocks the child process)

Are not done by Java's `java.lang.Runtime` class out-of-the-box. (Which I suppose is understandable, given the APIs must be cross-platform, so cannot make per-platform assumptions.)

This was nonetheless surprising for me, as some of these things I assumed were so basic to process management that it was the OS performing the logic, so they would just magically happen. But no.

So, to the point, [Joist](http://www.joist.ws) has a utility class that is perfect for this: [Execute](https://github.com/stephenh/joist/blob/master/util/src/main/java/joist/util/Execute.java).

I originally wrote it to invoke PgAdmin/MySQL commands to backup/restore the developer's local database, but since it has come in handy for a number of other things.

The usage is very straight forward:

```scala
val result = new Execute("ls")
  .arg("-l")
  .arg("/some/path")
  .toSystemOut()
println(result.exitCode)
```

So, if you're doing similar things, you might find it useful. You can check out:

* [Execute.java](https://github.com/stephenh/joist/blob/master/util/src/main/java/joist/util/Execute.java)
* [ExecuteTest.java](https://github.com/stephenh/joist/blob/master/util/src/test/java/joist/util/ExecuteTest.java)
* [joist-util](http://repo.joist.ws/joist/joist-util/) in the Joist maven repo

In other news, the ~70 lines of Ruby code I was ported ended up being ~50 lines of Scala code. Nice!

Admittedly, I cheated and put some abstractions that were used by another script into a trait, but that's even better anyway.

