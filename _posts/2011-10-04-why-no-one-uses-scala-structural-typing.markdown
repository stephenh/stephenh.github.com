---
layout: post
title: Why No One Uses Scala's Structural Typing
---

{{page.title}}
==============

Recently I heard some Scala enthusiasts note that, anecdotally, not very many projects actually use Scala's structural typing support.

In the subset of the Scala library that [scalagwt](http://scalagwt.github.com/) supports (which is most of it), structural typing was only used once, and that turned out to be a [bug](https://issues.scala-lang.org/browse/SI-4791).

Why is this? Aren't structural types supposed to be awesome? The safety of static type checking, without the annoyance of manually adapting types?

To me, the reason is fairly obvious: Scala's structural types are implemented on the declaration-side.

This means that, when declaring a method, you decide then whether or not *all* callers will use regular or structural typing. For example:

    class SomeApi {
      // regular typing method, takes Foo, callers
      // can only pass a Foo, normal typing
      def regularMethod(foo: Foo) {
        // regular dispatching
        foo.doFoo()
      }

      // structural typing method, callers can pass
      // any type that has a "doFoo" method
      def structuralMethod(foo: { def doFoo(): Unit }) {
        // structural dispatching (reflection)
        foo.doFoo()
      }
    }
{: class="brush:scala"}

Okay, so what?

To think about this, let's introduce two developers: the API designer and the API user:

* The API designer codes `someMethod` and decides regular vs. structural typing.
* The API user calls `someMethod` and has to go with whatever the designer chose.

Now think, who needs structural typing?

* The API designer does not need structural typing--he, by virtue of being the designer, controls the API and related codebase. If he needs `someMethod` to accept two separate types, he very likely controls each type, or at least controls `someMethod`, so, most of the time, can make his scenario work with regular types (having `TypeA` also extend `TypeB` or vice versa).

  (Besides API designers, I think this also covers a programmer making any calls internally within a codebase--you just change the types of the methods/arguments to match what you're trying to do with normal typing rules.)

* The API user *does* need structural typing--not being in control of the API, he is most likely to have types that wouldn't satisfy `someMethod` using normal typing, but would with structural typing.

And there's the rub: structural typing's forte, in my opinion, is calling APIs you don't control; but that same lack of control means, in Scala, you won't be able to actually use it.

Think of the API designer: it's unlikely they'll anticipate when API users will/will not want to use structural typing. And it's unlikely that API designers will use structural typing for the *entire* API, just in case. So, in practice, it's used for none.

So, what of structural typing then? Is it all for naught?

I'm not sure. Previously, I mulled about how some languages do [Caller-Side Structural Typing](http://draconianoverlord.com/2010/01/17/caller-side-structural-typing.html), which moves the decision of "do I use structural typing here?" to the caller side, where I think it's much more likely to be used. E.g. [Heron](http://code.google.com/p/heron-language)'s [`as` keyword](http://drdobbs.com/blogs/architecture-and-design/228701413):

    interface Foo {
      doFoo();
    }

    // doesn't implement Foo
    class LikeFoo {
      void doFoo() { ... }
    }

    // as generates a delegate that
    // implements Foo for LikeFoo
    takesFoo(new LikeFoo() as Foo);
{: class="brush:java"}

However, these approaches (on a pre-[interface-injection](http://openjdk.java.net/projects/mlvm/subprojects.html#InterfaceInjection) JVM anyway), usually just end up as the compiler/JVM auto-writing the adaptor for you (and can only be used for interfaces). Which is cool, but may/may not be structural typing anymore.

A colleague pointed out that Scala's structural typing actually came about serendipitously, as a side effect of simplifying the Scala language spec (from [this interview](http://www.infoq.com/interviews/martin-odersky-scala-future) with Martin Odersky). I'm not an expert on the OO types vs. functional modules aspect Martin was talking about. But since my personal use case of "calling APIs you don't control" doesn't seem to be what Scala's structural typing was introduced for, it makes sense that it doesn't solve it very well.

My suspicion is that structural types may just never be a big hit on the JVM, due to the assumptions it makes about types being non-structural. Unless `invokedynamic` magic makes it possible; I have no idea. And I don't have enough experience with a non-JVM/true structural language like Go to really comment any further, so I'll leave it at that.

I'm sure others have more insightful thoughts on this; if so, please leave them, or links to them, in the comments.

