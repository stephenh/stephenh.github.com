---
layout: post
title: Scala Implicit Conversion with Tuples
---

{{page.title}}
==============

I had not seen this before, but while reading a blog post about this [Magnet Pattern](http://spray.io/blog/2012-12-13-the-magnet-pattern/), they showed how Scala's implicit conversions will convert a parameter list into a tuple while searching for implicit conversions. E.g.:

    object ImplicitTest {
      // we have some type Foo
      case class Foo(o: AnyRef)

      // and a method that only takes Foos
      def needsAFoo(foo: Foo) = foo.toString

      // and we can convert tuples to Foo
      implicit def tupleToFoo(t: (Int, Int)) = Foo(t)

      def main(args: Array[String]) {
        // obviously, calling foo with a tuple works, as the
        // Scala compiler looks for implicit defs that would
        // take this arg that doesn't compile (Tuple2[Int, Int])
        // and returns it as a type that would compile, i.e. Foo
        println(needsAFoo((1, 2)))
        // becomes:
        // needsAFoo(tupleToFoo(new Tuple2(1, 2))))

        // but we can also pretend we're passing the arguments
        // directly to needsAFoo, and the Scala compiler will
        // group "1, 2" together into a Tuple2[Int, Int], and
        // find the same implicit def as before
        println(needsAFoo(1, 2))
      }
    }
{: class="brush:scala"}

This is pretty neat, and something I'll try and remember.

The Magnet pattern looks pretty cool, too, but I haven't had a lot of time to study it yet.

