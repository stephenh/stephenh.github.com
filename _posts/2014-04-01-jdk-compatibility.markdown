---
title: JDK 1.8/1.7 Compatibility Gotcha
layout: post
---

{{page.title}}
==============

To help future weary souls out, here are the Google-friendly queries for what we'll be talking about in this post:

* java.lang.NoClassDefFoundError: java/lang/reflect/Executable
* java.lang.ClassNotFoundException: java.lang.reflect.Executable

Overview
--------

The other day, I built a trunk version of [GWT](http://www.gwtproject.org) with my machine's default JDK, JDK 1.8.

GWT uses Ant/`javac` to build, with the `-source 1.6` and `-target 1.6` flags set. Previously, I had thought this was a very safe/normal thing to do.

However, when running this built-with-1.8 version GWT on a JDK 1.7 JVMs, an exception occurred:

    Caused by: java.lang.ClassNotFoundException: java.lang.reflect.Executable
      at java.net.URLClassLoader$1.run(URLClassLoader.java:366)
      at java.net.URLClassLoader$1.run(URLClassLoader.java:355)
      at java.security.AccessController.doPrivileged(Native Method)
      at java.net.URLClassLoader.findClass(URLClassLoader.java:354)
      at java.lang.ClassLoader.loadClass(ClassLoader.java:425)
      at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:308)
      at java.lang.ClassLoader.loadClass(ClassLoader.java:358)
      at com.google.gwt.dev.shell.JavaDispatchImpl.getMethod(JavaDispatchImpl.java:122)
{: class="brush:bash"}

Normally these sorts of errors are expected when a library uses new JDK 1.8  methods/classes. Then all downstream users also have to use JDK 1.8. 

However, in this case, the GWT source code doesn't reference `Executable` anywhere. The GWT code base is really supposed to be JDK 1.7 compatible.

What Is `java.lang.reflect.Executable` anyway?
----------------------------------------------

Turns out [`Executable`](http://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Executable.html) is the new base class for [`java.lang.reflect.Method`](http://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Method.html) and [`java.lang.reflect.Constructor`](http://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Constructor.html) in JDK 1.8.

Before Java 8, the base class of `Method` and `Constructor` was [`AccessibleObject`](http://docs.oracle.com/javase/7/docs/api/java/lang/reflect/AccessibleObject.html).

Granted, in Java 8, `AccessibleObject` is still *a* base class of `Method` and `Constructor`, it's just that `Executable` was inserted between `AccessibleObject` and `Method` and `Constructor`.

Which, I don't know, changing base classes seems kinda risky, but they kept the old one, so I guess it seems innocent enough.

But Now Who Referenced `Executable`?
------------------------------------

So, I was still very confused; the GWT code base doesn't know anything about `Executable`. Sure, it uses `Method` and `Constructor` a lot, as part of normal reflection code. But no `Executable`.

A cursory `javap -c -constants` of every GWT `.class` file showed no reference, no cast, to `Executable`.

Looking back at the offending stack trace, the last method in the stack trace, `JavaDispatchImpl.getMethod` looks innocent:

    @Override
    public MethodAdaptor getMethod(int dispId) {
      if (dispId < 0) {
        throw new RuntimeException("Method does not exist.");
      }

      Member m = getMember(dispId);
      if (m instanceof Method) {
        return new MethodAdaptor((Method) m);
      } else if (m instanceof Constructor<?>) {
        return new MethodAdaptor((Constructor<?>) m);
      } else {
        throw new RuntimeException();
      }
    }
{: class="brush:java"}

The `instanceof Method` check passes as true, but the stack trace doesn't get into `MethodAdaptor`, it first goes off and loads `Executable`, which fails and we end up stuck.

Look More Closely
-----------------

Given the JVM was about to call into `MethodAdaptor`, and that it typically loads the dependencies referenced by a class the first time that the class is loaded, I got more suspicious about `MethodAdaptor`s dependencies.

It turns out `javap` has a verbose flag, so trying that:

    javap -s -constants -c -v ./com/google/gwt/dev/shell/MethodAdaptor.class 
{: class="brush:bash"}

Resulted in a lot of interesting output, but most pertinently, we finally found the smoking gun:

    public java.lang.reflect.AccessibleObject getUnderlyingObject();
      descriptor: ()Ljava/lang/reflect/AccessibleObject;
      flags: ACC_PUBLIC
      Code:
        stack=1, locals=1, args_size=1
           0: aload_0       
           1: getfield      #3                  // Field method:Ljava/lang/reflect/Method;
           4: ifnull        14
           7: aload_0       
           8: getfield      #3                  // Field method:Ljava/lang/reflect/Method;
          11: goto          18
          14: aload_0       
          15: getfield      #2                  // Field constructor:Ljava/lang/reflect/Constructor;
          18: areturn       
        LineNumberTable:
          line 91: 0
        LocalVariableTable:
          Start  Length  Slot  Name   Signature
              0      19     0  this   Lcom/google/gwt/dev/shell/MethodAdaptor;
        StackMapTable: number_of_entries = 2
             frame_type = 14 /* same */
             frame_type = 67 /* same_locals_1_stack_item */
            stack = [ class java/lang/reflect/Executable ]
{: class="brush:bash"}

Notice the very last line: `stack = [ class java/lang/reflect/Executable ]`.

What?!

Here is the source of `getUnderlingObject`:

    public AccessibleObject getUnderlyingObject() {
      return (method != null) ? method : constructor;
    }
{: class="brush:java"}

It's very tiny. And no reference to `Executable`.

What's a Stack Map Table?
-------------------------

(Explain what the Stack Map is...)

Reproducing It
--------------

Okay, so, sure, this problem happens in the large GWT codebase, but can we reproduce it?

It turns out, yes, it's very easy. Here is a simple, standalone Java file to reproduce this behavior, `Foo.java`:

    import java.lang.reflect.AccessibleObject;
    import java.lang.reflect.Method;
    import java.lang.reflect.Constructor;

    public class Foo {
      private Method method;
      private Constructor constructor;

      public static void main(String[] args) throws Exception {
        Foo f = new Foo();
        System.out.println("done");
      }

      public Foo() throws Exception {
        Class<?> c = Class.forName("java.util.HashMap");
        method = c.getMethods()[0];
        constructor = c.getConstructors()[0];
      }

      public AccessibleObject pickOne() {
        return method != null ? method : constructor;
      }
    }
{: class="brush:java"}

So, we'll start out compiling with JDK 1.8:

    $ javac -version
    javac 1.8.0
    $ javac Foo.java
    $ java Foo
    done
{: class="brush:bash"}

It compiles. And, if we look at the bytecode, our stack verification data looks just fine:

    $ javap -v Foo | grep 'stack ='
          stack = [ class java/lang/reflect/AccessibleObject 
{: class="brush:bash"}

It's using `AccessibleObject`, which will work in a JDK 1.7 JVM.

However, when we run `Foo` when JDK 1.7, it actually fails, although due to the typical `major.minor` mismatch error:

    $ /usr/lib/jvm/java-7-oracle/bin/java Foo
    Exception in thread "main" java.lang.UnsupportedClassVersionError: Foo :
      Unsupported major.minor version 52.0
{: class="brush:bash"}

Okay, fair enough, so let's compile with `-source 1.7` and `-target 1.7`:

    $ javac -version
    javac 1.8.0
    $ javac -source 1.7 -target 1.7
    warning: [options] bootstrap class path not set in conjunction with -source 1.7
    $ java Foo
    done
    $ /usr/lib/jvm/java-7-oracle/bin/java Foo
    Exception in thread "main" java.lang.NoClassDefFoundError: java/lang/reflect/Executable
{: class="brush:bash"}

Agh! It worked fine, until we ran with JDK 1.7, and we got the `Executable` error. And, sure enough, the offending `Executable` reference is back in the bytecode:

    $ javap -v Foo | grep 'stack ='
          stack = [ class java/lang/reflect/Executable 
{: class="brush:bash"}

It seems like the JDK 1.8 compiler must have different algorithms for calculating the Stack Map Table, and when set to `-source 1.7`, it changes to an algorithm, that, ironically, picks a different type (`Executable` instead of `AccessibleObject`) for the table even though that type won't be available on JDK 1.7.

How To Avoid This: Option 1
---------------------------

Astute readers might have noticed the tip off go by; `javac` warns about using the default (JDK 1.8) bootstrap classpath when compiling with `source`/`target` flags.

This is basically `javac` warning us that, right, it knows this might happen--we're giving it a JDK 1.8 standard library, and expecting the compiler to "just know" not to include references to any 1.8-only classes (whether due to internal decisions like this stack map, or even to user-code level decisions like calling JDK 1.8-only methods).

The `javac` compiler, understandably, doesn't really have this "what's in 1.7 vs. 1.8" metadata, so it is requesting that we override the bootstrap classpath, and make sure we're passing in a standard library that matches our `source` and `target` flags.

And, it turns out, if we heed the warning and use the bootstrap classpath:

    $ javac -version
    1.8.0
    $ javac -source 1.7 -target 1.7 -bootclasspath /usr/lib/jvm/java-7-oracle/jre/lib/rt.jar Foo.java 
    $ java Foo
    done
    $ /usr/lib/jvm/java-7-oracle/bin/java Foo
    done
{: class="brush:bash"}

Then order is restored to the world, and we can run 1.8-compiled classes on both JDK 1.8 and JDK 1.7.

The bytecode has gone back to only knowing about `AccessibleObject`:

    $ javap -v Foo | grep 'stack ='
          stack = [ class java/lang/reflect/AccessibleObject 
{: class="brush:bash"}

As (I assume), even though `javac` is using it's "JDK 1.7" algorithm for the Stack Map Table, `Executable` isn't even on the classpath at all, for it to find and reference. So the algorithm ends up with `AccessibleObject` instead, which is what we want.

What is odd about this option, ensuring to pass the `-bootclasspath`, is that, previously, I thought the whole point of compiling with `-source`/`-target` was to use them when you did not have old JVMs installed, but still needed to target their platforms.

This is showing saying that, even if you're using a JDK 1.8 compiler, to avoid gotchas like this `NoClassDefFoundError`, even with codebases that look 100% JDK 1.7 compatible, you need to use the `bootclasspath` to ensure `javac` only uses 1.7-available classes in the resulting bytecode.

How To Avoid This: Option 2
---------------------------

Just compile with JDK 1.7.

If you have to have the bootstrap classpath anyway, might as well set `JAVA_HOME` to a JDK 1.7 install and be done with it.

This is what I did for my GWT trunk build, and it quickly went back to working as expected.


