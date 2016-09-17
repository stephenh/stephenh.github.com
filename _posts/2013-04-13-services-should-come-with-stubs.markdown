---
layout: post
title: Services Should Come with Stubs
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com), we do our fair share of service-oriented development, where instead of one big monolithic application, we have lots of small applications that talk to each other.

The services might integrate with each other via JSON or Thrift or what not, almost always via HTTP, but whatever the underlying wire format/protocol is, it is always hidden from the client code behind a service interface.

For example, let's imagine a very trivial data service that provides an interface:

```scala
trait DataService {
  def saveData(id: String, data: Array[Byte])
  def getData(id: String): Array[Byte])
}
```

Real services would of course have more interesting contracts, but this is good enough for illustration purposes.

So, the `DataService` codebase is going to ship a jar, say `data-service.jar`, with both it's `DataService` interface in it, as well as the implementation, say, `DataServiceJsonImpl`:

```scala
class DataServiceJsonImpl(server: String) extends DataService {
  override def saveData(id: String, data: Array[Byte]) = {
    // do JSON serialization
  }
  override def getData(id: String): Array[Byte]) = {
    // do JSON serialization
  }
}
```

So, this is all well and good; the downstream client codebase can program against the `DataService` contract, and while testing use a fake, and in production use the real `DataServiceJsonImpl`.

Okay, so let's look at the fake implementation...what should it look like? Per some [other posts](http://www.draconianoverlord.com/2010/07/09/why-i-dont-like-mocks.html), I generally prefer stubs, so we might write:

```scala
class DataServiceStub extends DataService {
  private val data = Map[String, Array[Byte]]()
  override def saveData(id: String, data: Array[Byte]) = {
    data.put(id, data)
  }
  override def getData(id: String): Array[Byte]) = {
    data.get(id).getOrElse { sys.error("Not found") }
  }
}
```

Great! We're done.

So, the interesting thing is that the stub we wrote, `DataServiceStub`, is actually fairly generic; that is nothing specific about our client code in it (as written anyway). And the "fake" semantics actually very accurately mimic the real semantics (of course, as otherwise the implementation of the `DataService` contract would be nonsensical and our tests would be much less coherent).

What we've been doing recently is realizing that, instead of each client rewriting its own stub implementations of the same contract, the upstream service should just ship it's own stub `DataService` implementation.

There are a few interesting aspects of this:

1. Obviously code reuse, as each downstream project can reuse the `DataServiceStub`.

2. Since the stub implementation is shared, the pooled effort of maintaining just one fake implementation leads to a higher quality stub that covers more of the API (instead of only the parts that each particular project needed).

3. The upstream developers, who are implementing `DataServiceJsonImpl` can also implement `DataServiceStub`, which makes sense as they will be most familiar with the semantics of the `DataService` contract.

4. Per a comment by [Mark Dietz](http://markdietz.wordpress.com/), we could envision an upstream service shipping the stub *before* the actual implementation, allowing downstream projects to start integration sooner, and using the stub's fake-but-accurate semantics to flush out assumptions in both the upstream and downstream projects.

So, that's the idea; I'd be delighted if I could pull a service-oriented project's jar from Maven central and have stubs included in the jar and ready to go.

As it is today, we end up building our own stubs for a number of services--basically any internal or external service/API we touch. Some are simple, others are more work. Either way our implementations (which we open source like [fakesdb](https://github.com/stephenh/fakesdb) when possible) are rarely application-specific, so it a shame we can't reuse existing ones.

Somewhat tangentially, I also think services coming with/sharing stubs would help tilt the scales towards stubs over mocks--stubs obviously require some up-front investment, where as mocks are cheap right out of the box. But I think once you have more than a few tests, stubs start paying off. And so if sharing stubs could spread out this up-front cost, perhaps more projects would choose to test with stubs.

So, that's what we've been trying, and I think we've liked it so far. I don't know that I've really seen another projects do this before, which makes me think it's somewhat novel.

Thinking about it more; I suppose most services that are exposed via HTTP (or what not) are meant to be used in a language agnostic manner; which usually means there are either multiple language-specific client binding implementations (e.g. a Ruby client implementation, a Java client implementation, etc.), all of varying quality, or no client bindings at all, and writing them is left as an exercise to the user.

Given this, where even language-specific client bindings are hit and miss, perhaps it is not surprising that few/if any projects also take the time to write language-specific stub implementations (as, the nature of stubs is that they are in-memory and so use each language's given idioms and data structures).

Bizo is a JVM shop, so it makes sense that, for us, writing a language-specific `DataServiceStub` implementation in the upstream project is worth it because we know it will be consumed downstream by a Java/Scala project.

So perhaps our situation is unique. But I would think that surely highly-used client bindings (like the Amazon [aws-java-sdk](http://aws.amazon.com/sdkforjava/)) should have enough users to support a shared stub implementation.
