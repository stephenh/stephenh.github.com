---
title: Caller-Side Structural Typing
description: ""
date: 2010-01-17T00:00:00Z
tags: ["Languages"]
---


Intro
-----

Structural typing is an interesting approach to static typing that I've been thinking more about lately.

The basic gist of structural typing is that type names don't matter--only type structures matter.

Though first a disclaimer: being a JVM guy, I'm mostly interesting in hacking structural types into the JVM environment. If you're in a language like Go, which has native structural typing, then my points are moot.

In Java
-------

I think structural types are best explained with an example. Let's start with Java. Say you define an interface `Closeable`:

```java
public interface Closeable {
  public void close();
}
```

And then you write some nifty library routines for working with `Closeable`s:

```java
public class YourLibrary {
  public static void doClose(Closeable closeable) {
    // other nifty stuff
    closeable.close();
  }
}
```

Now, let's say somebody else wants to use your `doClose` method, e.g. they have a class:

```java
public class SomeClass {
  public void close() {
    // want this to be called by doClose
  }
}
```

With traditional static typing, they cannot pass instances of `SomeClass` to your `doClose` useless `SomeClass` explicitly has an `implements Closeable` declaration.

Which, okay, yeah, most of the time its fairly easily to add this line.

But, sometimes, it gets annoying--and this is where structural typing steps in.

Let's say you try to call:

```java
SomeClass s = new SomeClass();
// stuff
YourLibrary.doClose(s); // usually a compile error
```

Structural typing notices that `doClose` wants a `Closeable`, and while `SomeClass` does not directly implement `Closeable`, it does have all of the methods required (specifically `void close()`) to meet the *structural* requirements of implementing `Closeable`.

So, the idea is that this is good enough, and you should be able to go ahead and pass an almost-`Closeable` `SomeClass` to `doClose`.

Obviously Java doesn't do this today, but Scala and a few other languages do, so let's look at what they do.

In Scala
--------

Scala's approach to structural typing doesn't quite work like my above description. It requires you do declare up-front what types are structural. E.g. if you define a method:

```scala
object YourLibrary {
  def doClose(closeable: { def close(): Unit }) = {
    // other nifty stuff
    closeable.close()
  }
}
```

The type of the argument `closeable` does not an have an explicitly named type. The `{ def close(): Unit }` is Scala's syntax for inline structural types. It means "any type that has a `close` method on it".

Also note that if you don't like the inline syntax, or need to reuse the `closeable` structural type a lot, you can define a type alias like so:

```scala
object YourLibrary {
  // this is a type alias for the structural type
  type Closeable = {
    def close(): Unit
  }
  // now use ': Closeable' like regular syntax, but its still
  // a structural "anything that has close on it" type
  def doClose(closeable: Closeable) = {
    // other nifty stuff
    closeable.close()
  }
}
```

Since the Scala compiler understands structural types, per our Java example above, you can now do:

```scala
val s = new SomeClass()
// stuff
// compiles because SomeClose.close matches structurally
YourLibrary.doClose(s)
```

Without explicitly declaring `SomeClass extends Closeable`. So, this is it, we've got structural typing.

However, this is just compile-time. At runtime, Scala now has to cater to the JVM and figure out how to pass "any-type-that-is-basically-Closeable-but-not-really" to `doClose`.

To the JVM, `doClose` has to accept "any-type", because there is no single interface/class name we could put here without forcing our callers to implement that type--which is exactly what we're trying to avoid.

So, in the class file, the `YourLibrary.doClose`'s `closeable` argument is actually a plain `java.lang.Object`. Then inside of `doClose`, Scala uses cached reflection grab the `closeable` argument's `close` method and invoke it.

So your code at runtime basically becomes:

```scala
// Runtime view
object YourLibrary {
  def doClose(closeable: Object) = {
    Method m = getMethodWithFancyCaching(closeable, "close");
    m.invoke();
  }
}
```

Note that while the reflection side of things looks a lot like Ruby/Groovy-style dynamic language duck typing, the compiler (assuming you stay within Scala) still statically enforces that any types you pass to `doClose` do actually have the `close()` method.

So the `getMethod` call is guaranteed to work, it just happens to be reflectively-dispatched at runtime to hack around the JVM's lack of native structural typing.

Summarizing, Scala has definition-side structural typing (I'm blatantly making up terms here). You declare what types/arguments in your library you wish to be structural and it becomes statically-checked compiler syntax sugar for runtime reflection calls.

In Whiteoak
-----------

[Whiteoak](http://ssdl-wiki.cs.technion.ac.il/wiki/images/6/61/Wo-0608.pdf) is an extension of Java that adds structural typing. Syntactically, their approach is very similar to Scala's--explicit, definition-side declaration of structural types.

The syntax looks something like:

```java
public class YourLibrary {
  // they introduce a 'struct' keyword for 'structural'
  struct Closeable {
    void close();
  }
  public static void doClose(Closeable closeable) {
    // do stuff
    closeable.close()
  }
}
```

So, at compile-time, it looks very much like using interfaces.

However, just like Scala, at runtime it has to jump through some hoops to satisfy the JVM and accept non-`Closeable` arguments to the `doClose` method.

To do this, Whiteoak uses the same approach as Scala--structurally typed arguments become `java.lang.Object`s in the class file. However, unlike Scala, Whiteoak generates cached adaptor classes at runtime.

So your code at runtime basically becomes:

```java
// Runtime version
public class YourLibrary {
  // Closeable gets an interface
  interface ICloseable {
    void close();
  }
  // doClose takes an Object but, like Scala, any argument has been
  // compile-time checked to structurally have a close method
  public static void doClose(Object closeable) {
    ICloseable c = Whiteoak.make(closeable, ICloseable.class);
    c.close();
  }
}

// Whiteoak.make looks at closeable, and ifs its SomeClass, uses
// runtime bytecode generation to make a class like:
public class GeneratedSomeClass {
  private SomeClass contents;
  public SomeClass(Object contents) {
    this.contents = (SomeClass) contents;
  }
  public void close() {
    contents.close();
  }
}
```

You'll end up with a separate `GeneratedXxx` adaptor class for each type you pass in to `doClose`. However, like Scala caching for reflection, Whiteoak uses caching to avoid re-generating the class on each `make` call.

Between the two, I don't consider Scala's cached-reflection vs. Whiteoak's cached-adaptors to be that large of a difference. The paper [Compiling structural types on the JVM](http://portal.acm.org/citation.cfm?id=1565829&dl=GUIDE&coll=GUIDE&CFID=73421715&CFTOKEN=28828316) goes into more detail and also benchmarks the two approaches.

However, essentially, they both treat structural types as a definition-side concern and consider it `doClose`'s responsibility to take a `java.lang.Object` and know how to do the right thing with it to get `close` called.

In Heron
--------

[Heron](http://code.google.com/p/heron-language/) is an interesting language that takes a caller-side approach to structural typing. It is not actually a JVM language, but his caller-side approach is something I like, so I thought I'd include it.

The author of Heron also wrote a very good article, [Explicit Structural Typing](http://drdobbs.com/blogs/architecture-and-design/228701413), that covers these same structural typing ideas and terminology better than I do.

So, Heron implements *explicit* *caller-side* structural typing. You can see the explicit syntax in its [unit test](http://code.google.com/p/heron-language/source/browse/trunk/HeronEngine/tests/TestDuckTyping.heron), or, in our example, it looks like:

```scala
 // define Closeable as a regular interface
 // define YourLibrary.doClose as a regular method taking Closeable
 var s = new SomeClass()
 // compiles because `as Closeable` suffix
 YourLibrary.doClose(s as Closeable)
```

The `as Closeable` directive ensures `s` structurally complies with `Closeable` and then lets the call happen.

At least I think it does the structural check at compile time. He mentions a runtime check also occurring and then what I assume to be a Whiteoak-like adaptor object being made at runtime as well.

I'm a little fuzzy on the details as I just came across the language, but the key thing is that Heron moves structural typing to be something you as a caller decide you want to use. The declaration-side, the `doClose` implementation, is none the wiser.

Implicit Caller-Side
--------------------

In my look-ma-I'm-a-language-designer opinion, I like Heron's approach, but I think Scala should do one better and support *implicit* caller-side structural typing. As in you don't need the `as Closeable`, the compiler just notices this should happen and makes it so.

With this approach, you can write library/API code and be blithely unaware of whether your callers are passing in real-conforming or structurally-conforming arguments.

So, it'd look like:

```scala
object YourLibrary {
  // regular trait/interface
  trait Closeable {
    def close(): Unit
  }
  def doClose(closeable: Closeable) = {
    // other nifty stuff
    closeable.close()
  }
}
```

So far, this is all straight, "non-structural" Scala code. But then, when the compiler notices the caller passing in a `SomeClass` argument that is not actually a `Closeable`, do one of two things:

1. Generate, at compile-time, a adaptor class that implements `Closeable`. E.g. something like:

   ```scala
   class SomeClassAsCloseable(val c: Closeable) extends Closeable {
     def close() = c.close()
   }
   ```

   And automatically transform the caller's call into:

   ```scala
   val s = new SomeClass()
   YourLibrary.doClose(new SomeClassAsCloseable(s))
   ```

   Points:

   * Pro: Everything is plain Java at runtime--`doClose` still takes a regular `Closeable` interface and there is no reflection/bytecode generation
   * Pro: Conversion semantics are similar to Scala's views/implicit conversions, which are used extensively
   * Pro: Doable now--doesn't rely on new JDK features (see option 2)
   * Con: Object identity is broken--if `doClose` does any identity comparison of its argument, it will do so against the `SomeClassAsCloseable` adaptor instance instead of `SomeClass` itself. (I don't consider this a huge deal given how much proxies are used in Java and implicit views in Scala.)
   * Con: Generates an extra adaptor class for each caller-side type  (like Whiteoak, except generation is at compile-time, so there is no runtime hit)
   * Con: Generates an extra adaptor instance (`new SomeClassAsCloseable`) for each `Closeable` call (though perhaps this could be cached somewhere, e.g. on `SomeClass.asCloseable` if `SomeClass` was a class we controlled)

2. Use [Interface Injection](http://blogs.sun.com/jrose/entry/interface_injection_in_the_vm)

   This is a JDK7 feature, but the idea is that there will be a way to, at runtime, dynamically add `Closeable` to the list of interfaces that `SomeClass` implements. This is like reaching into the `SomeClass` class declaration line and saying "oh, yeah, you meant to add `implements Closeable`, let me do that for you".

   I think this is the best option for JVM-based structural typing, it just sucks that it is not available yet.

   Points:

   * Pro: Object identity is not broken--there is no proxy/adaptor instance hiding the real `SomeClass` instance in the background
   * Con: Relies on a JDK7 feature that is at least 6-12 months away from release. Even then, it is doubtful Scala would use such a cutting edge feature and limit its target-able runtimes.

Concerns About Implicit Conversion
----------------------------------

A few articles on structural typing have mentioned structural typing in and of itself is potentially a bad thing--the assertion is that a named interface entails a documented protocol across the entire set of methods, not just a grab bag of disparate methods that can be called willy nilly.

For example, let's say `SomeClass.close()` was actually part of `SomeClass` implementing this other interface `IResource`. And part of `IResource`'s contract is that clients must call `open()` before calling `close()` or else bad things happen. And so `SomeClass` is implemented with this contract in mind.

But now you pass `SomeClass` to `doClose`, and the compiler magically turns it into a `ICloseable` for you. However, `ICloseable` has no documented "call `open()` first" contract, and so now the `doClose` method will start violating `SomeClass.close`'s semantics without knowing any better.

This is not a bad point. And, perhaps by making structural types an explicit/definition-side concern, Scala and Whiteoak were purposefully setting out to say library/API designers need to explicitly note that they are okay with getting a "grab bag of methods".

Certainly making structural typing an implicit, caller-side implementation as I'm proposing will increase the chances of semantics being unintentionally violated.

However, foregoing the "lack of documented protocol" concern is how Google's Go implements structural typing, so it will be interesting to see if that plays out well and if "willy nilly" structural typing gains either popularity or notoriety.

Wrapping Up
-----------

I ended up talking more about how other languages implement structural typing more than I intended to. Well, besides the fact that I avoided the big one, Google's Go, which I haven't looked in to enough yet.

My main assertion is that Scala's structural typing seems like it would integrate better with the JVM if it used caller-side/compile-time adaptor hacks. Basically in the same vein of how Scala 2.8's default/named arguments also use caller-side/compile-time hacks. And, as an added bonus, this would mean structural typing could be used anywhere that takes existing regular traits/interfaces instead of only those picked to accept structural types.

Of course, declaration-side structural typing still gets the job done and I'll definitely use it,  assuming I control the library/API implementation and foresee the needed flexibility.

