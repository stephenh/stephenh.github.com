---
layout: post
title: Running ScalaTest Spec Tests from Eclipse
---

Running ScalaTest Spec Tests from Eclipse
=========================================

[ScalaTest](http://www.artima.com/scalatest/) is pretty cool. I've been playing with the "spec" way of writing tests--for the most part, I have nothing against traditional JUnit 3 `testXxx` methods, other than having string-based test names is pretty darn cool from a readability perspective.

The big con, however, is that ScalaTest doesn't have its own Eclipse plugin, so if you move away from the JUnit 3 `testXxx` methods, you don't get the nice `Alt-Shift-X + T` test-running capabilities directly within Eclipse.

I started fiddling with ways of tricking Eclipse into running spec-type ScalaTests and came up with a workable approach.

A Sample Test
-------------

So, here's a sample spec-based test that we'd like to run with Eclipse:

    import org.junit.runner.RunWith
    import org.scalatest.Spec
    import org.scalatest.matchers.MustMatchers

    @RunWith(classOf[JUnit4Runner])
    class ZazTest extends Spec with MustMatchers {
      describe("something") {
        it("should do something fancy") {
          println("fancy")
        }
        it ("should do something plain") {
          println("plain")
        }
        it ("should also fail") {
          println("fail")
          1 must equal (2)
        }
      }
    }
{: class="brush:scala"}

Note the `"should do something fancy"` test names that JUnit really isn't going to understand (because they are not methods, they're anonymous inner classes ScalaTest keeps track of in an internal data structure).

How To Get Eclipse To Run This Test
-----------------------------------

The key thing I've added above is a `RunWith` annotation that uses a `JUnit4Runner` I wrote. When you hit `Alt-Shift-X + T` in Eclipse, even though `ZazTest` doesn't extend `TestCase` or have any `@Test` annotations, the Eclipse JUnit 4 runner seems the `RunWith` annotation and hands over control to it.

The `JUnit4Runner` then just has to translate a JUnit run into something the Spec suite can handle.

This turned out to be not that bad:

    import org.junit.runner.{Description => JuDescription}
    import org.junit.runner.{Runner => JuRunner}
    import org.junit.runner.notification.{Failure => JuFailure}
    import org.junit.runner.notification.{RunNotifier => JuRunNotifer}
    import org.junit.runners.{Suite => JuSuite}
    import org.scalatest.{Filter => StFilter}
    import org.scalatest.{Reporter => StReporter}
    import org.scalatest.{Stopper => StStopper}
    import org.scalatest.{Suite => StSuite}
    import org.scalatest.{Tracker => StTracker}
    import org.scalatest.events._

    class JUnit4Runner(val testClass: Class[_]) extends JuSuite(testClass, new java.util.ArrayList[JuRunner]()) {
      val suite = testClass.newInstance.asInstanceOf[StSuite]
      suite.testNames.foreach((testName) => getChildren.add(new TestAdapter(this, testName)))
    }

    class TestAdapter(runner: JUnit4Runner, testName: String) extends JuRunner {
      override def run(notifier: JuRunNotifer): Unit = {
        val reporter = new ReporterAdapter(this, notifier)
        val stopper = new StopperAdapter
        val filter = new StFilter(None, Set())
        val tracker = new StTracker()
        runner.suite.run(Some(testName), reporter, stopper, filter, Map(), None, tracker)
      }
      override def getDescription() = JuDescription.createTestDescription(runner.testClass, testName)
    }

    class ReporterAdapter(test: TestAdapter, notifier: JuRunNotifer) extends StReporter {
      override def apply(event: Event): Unit = {
        event match {
          case e: TestStarting => notifier.fireTestStarted(test.getDescription)
          case e: TestSucceeded => notifier.fireTestFinished(test.getDescription)
          case e: TestFailed => notifier.fireTestFailure(new JuFailure(test.getDescription, e.throwable.get))
          case e: InfoProvided => // ignore
          case e => println(e)
        }
      }
    }

    class StopperAdapter extends StStopper {
      override def apply = false
    }
{: class="brush:scala"}

It basically just translates ScalaTest `Events` into JUnit `RunNotifier` events.

The Results
-----------

Here's a screenshot:

<a href="/images/screenshot-scalatest.png" border="0">
  <img src="/images/screenshot-scalatest.png" width="500" border="0">
</a>

What's really cool is that, in typical JUnit fashion, no existing Run Configuration needs to be setup. E.g. I don't have to manually create a run configuration for each spec-based ScalaTest--just hitting `Alt-Shift-X + T` will make a new JUnit run configuration and fire off the tests.

The Downside
------------

The Eclipse JUnit UI still assumes "something should do something fancy" is a method name, so if you double click on it, it will fail to find it and just take you to the `ZazTest`  class. So it's not as easy to jump right to failures.

Bonus
-----

Turns out you can right click and run individual `it` tests too. I have no idea how that is working--and it doesn't seem to be just a UI trick, because the console output from the other tests doesn't show up either. Weird...but cool.

Anyway, I haven't decided if I'll completely jump ship on traditional `TestCase`-extending tests for Scala projects. There is a warm familiarity that I like about it. But if I do start writing more spec-based ScalaTests, this `RunWith` hack will be very handy.

**Update**
----------

Turns out this feature [already exists](http://www.artima.com/forums/flat.jsp?forum=284&thread=254074) in ScalaTest [trunk](https://scalatest.dev.java.net/source/browse/scalatest/trunk/app/src/main/scala/org/scalatest/junit/JUnitRunner.scala?rev=1789&view=markup) and should be in the next release as `org.scalatest.junit.JUnitRunner`.

