---
title: Using Byteman To Debug Logging
layout: post
---

{{page.title}}
==============

Just as a quick post, I was recently seeing some bizarre behavior in our application's logging output.

After the usual religious debates settled down, we decided on `java.util.logging` + SLF4J for our logging stack.

We have a variety of handlers, e.g. to file, to S3, a WIP one to CloudWatch Logs, and a (self-throttled, to avoid tripping spam flags) email handler. All very normal.

But recently, we noticed our handlers were no longer working. E.g. errors would be happening in production, but we wouldn't get our usual email notifications about them. Which was very disturbing. It's like flying blind. Is the system on fire? Who knows!

The handlers/notifications would work fine when our processes booted up, but after awhile, our custom loggers would just stop working.

The first hint was that the console log output changed, e.g. after anywhere from ~2 to 40 minutes after process start, it'd go from "INFO" first format (which was the one we'd configured) to "timestamp" first (which was foreign to us):

```plain
INFO   11/27/15 14:40:20 Foo3$               - WorkingA
INFO   11/27/15 14:40:20 Foo3$               - WorkingA
2015-11-27 14:40:20 INFO [Foo3$] WorkingD
2015-11-27 14:40:20 INFO [Foo3$] WorkingD
```

My first guess that was our beta CloudWatch Logs handler was somehow filling up it's buffer/something, and blowing up `j.l.logging`, such that `j.u.logging` entered some sort of failure mode and reset itself.

However, the post-reset console out was actually *not* the true default `j.u.logging` output, which is this bizarre "two lines of log output per log event" that I personally find less than useful.

So, it was not a pure-, `j.u.logging`-driven reset. This insinuated that some code in our JVM process was taking it upon itself to: a) reset the logging config, and b) installed it's own console handler and formatter.

But who? It was nothing in our source code. So it must be some random jar on our not-exactly-tiny classpath.

So, on a hunch, I decided to use Byteman as an "poor man's breakpoint", and used this Byteman script:

```plain
RULE Blow up LogManager.reset
CLASS java.util.logging.LogManager
METHOD reset()
IF true
DO THROW new RuntimeException("reset!")
ENDRULE
```

With a simple addition to our application's JVM parameters:

```plain
-javaagent:byteman.jar=script:reset.btm,boot:byteman.jar
```

And tada:

```plain
Caused by: java.lang.RuntimeException: reset!
at sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
at sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)
at sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)
at java.lang.reflect.Constructor.newInstance(Constructor.java:422)
at org.jboss.byteman.rule.expression.ThrowExpression.interpret(ThrowExpression.java:230)
at org.jboss.byteman.rule.Action.interpret(Action.java:144)
at org.jboss.byteman.rule.helper.InterpretedHelper.fire(InterpretedHelper.java:171)
at org.jboss.byteman.rule.helper.InterpretedHelper.execute0(InterpretedHelper.java:139)
at org.jboss.byteman.rule.helper.InterpretedHelper.execute(InterpretedHelper.java:101)
at org.jboss.byteman.rule.Rule.execute(Rule.java:717)
at org.jboss.byteman.rule.Rule.execute(Rule.java:686)
at java.util.logging.LogManager.reset(LogManager.java)
at java.util.logging.LogManager.readConfiguration(LogManager.java:1406)
at org.xeril.log.JDKLogFactory.<init>(JDKLogFactory.java:59)
at org.xeril.log.Log.<clinit>(Log.java:18)
... 10 more
```

Turns out the flow was that:

* Our app boots up, everything is fine.
* At some point, we make a call to an external API
* Depending on the API call, the API client instantiates one of its enums
* ...several layers of indirection...
* Someone instantiates this `org.xeril.log.Log` class (which is yet another "should I log to JDK, or Log4j, or, or... abstraction)
* The `org.xeril.log.Log` class has a static field, `jdkLogFactory`, whose *very instantiation* calls `LogManager.readConfiguration(...)` with it's own custom config
* And now none of our handlers are hooked up anymore

This was of course fairly surprising, that Xerial, an ancient XML serialization library would decide upon itself to go ahead and reset the global logging config for whichever project is using it.

To avoid this result, we considered excluding this class from our jar, providing a byte-code compatible alternative .class file, perhaps just first on the classpath. Maybe using Byteman to add an early return to the affected method.

But turns out the easiest thing was just to purposefully initialize this `Log` class immediately when our JVM starts, let it reset the config, and then explicitly re-reset the config back to what we wanted it to be, with our own `LogManager.readConfiguration()` call. Hurray for degenerate solutions.

So, while this is unfortunately basically another day in the life of a software developer working on top of any non-trivial dependency chain, the decision to use Byteman to pinpoint the `LogManager.reset` call, and provide the stack trace of the offending caller, significantly helped the diagnosis of the root cause, so I thought a friendly "don't forget about Byteman" blog post would be a good idea.


