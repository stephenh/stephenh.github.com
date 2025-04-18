---
title: Trait Rules of Thumb
description: ""
date: 2014-12-29T00:00:00Z
tags: ["Scala"]
---



We've been using Scala for quite awhile at work, and I think one of the tricky things to figure out is when to use/not use a trait.

Personally, I have two rules of thumb that I apply:

1. Is the trait purposefully adding useful methods to the class's public API?
2. Does the trait's implementation use instance data from the class?

Is so, use the trait. If not, you're likely, IMO, abusing traits as a fancy way to organize code that is not coherently tied to the conceptual type hierarchy.

The core principle behind both of these rules is that I personally prefer object instances to be as small and specific as possible. Tiny, minimal public APIs. Tiny, minimal responsibilities. E.g. the [Single Responsibility Principle](http://en.wikipedia.org/wiki/Single_responsibility_principle).

Without following these rules of thumb, I think it's easy to slide down the slippery slope of abusing traits merely as glorified imports.

Example 1
---------

E.g.:

```scala
trait SomethingUseful {
  def aUtilMethod() = { ... }
}

class MyClass extends SomethingUseful {
  def foo() = {
    ... = aUtilMethod()
  }
}
```

In this example, `aUtilMethod` is neither a method that we really want exposed to `MyClass`'s clients, nor is it using any instance state from `MyClass`. So, it might as well be a static method call instead:

```scala
object SomethingUseful {
  def aUtilMethod() = { ... }
}

class MyClass {
  def foo() = {
    ... = Object.aUtilMethod()
  }
}
```

Example 1b
----------

A slight variation on the above is where `SomethingUseful` has state:

E.g.:

```scala
trait SomethingUseful {
  private var internalState = ...
  def aUtilMethod() = { 
    // access internalState
  }
}

class MyClass extends SomethingUseful {
  def foo() = {
    ... = aUtilMethod()
  }
}
```

So, we cannot just change `aUtilMethod` to a static call.

However, `SomethingUseful` still does not access any `MyClass` state. And there is really no reason for us to say "`MyClass` is a `SomethingUseful`", so we should prefer composition:

```scala
class MyClass {
  private val useful = new SomethingUseful()
  def foo() = {
    ... = useful.aUtilMethod()
  }
}
```

I wonder if perhaps the fascination with traits is due to composition being more verbose; instead of `with SomethingUseful` to mix it in, we need a field, which gets it's own dedicated line of code, and then later our `aUtilMethod()` needs a `useful.` prefix instead of a naked `aUtilMethod()`.

Example 2
---------

The previous example was pretty straight forward; more common is something that looks more innocent:

```scala
trait SomethingUseful {
  def aUtilMethod() = { ... }

  def aDependency(): Dependency
}

class MyClass extends SomethingUseful {
  def foo() = {
    ... = aUtilMethod()
  }

  override def aDependency() = ...
}
```

In this example, `aUtilMethod` needs a `Dependency` instance. And `MyClass` wants to provide that.

However, `MyClass` is still not really gaining any useful public API from `SomethingUseful`, and if anything usually dirtying it's public API because `aDependency` and `aUtilMethod` are rarely defined as `protected`.

Depending on the number/type of dependencies, I think a static solution may again be appropriate:

```scala
object SomethingUseful {
  def aUtilMethod(dep: Dependency) = { ... }
}

class MyClass {
  def foo() = {
    ... = Object.aUtilMethod(dep)
  }
}
```

Or, if dependencies are getting fun, make `SomethingUseful` into its own component:

```scala
class SomethingUseful(dep: Dependency) {
  def aUtilMethod() = { ... }
}

class MyClass(useful: SomethingUseful) {
  def foo() = {
    ... = useful.aUtilMethod()
  }
}
```

And then use your dependency management approach of choice.

(Disclaimer: I had this in my draft folder for awhile, and think it's basically good, but slightly off the top of my head. I think the topic could use a bit more flushing out/rigorous thought than I've put in to it so far.)


