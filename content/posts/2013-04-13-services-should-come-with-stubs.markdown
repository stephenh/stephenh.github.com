---
date: "2013-04-13T00:00:00Z"
categories:
  - Favorites
title: Services Should Come with Stubs
---


At [Bizo](http://www.bizo.com), we do our fair share of service-oriented development, where instead of one big monolithic application, we have lots of small applications that talk to each other.

This is obviously very popular these days, but we also found a neat way to enable/scale testing of our microservices.

Hiding Microservice Details Behind Interfaces
---------------------------------------------

Whatever the underlying wire format/protocol of each microservice is (or vendor API for that matter), we always hide the wire-call/wire-format details from the client codebase behind a service interface.

This interface forms a contract that isolates the client codebase from the nitty-gritty details of the up-stream service, and also provides a nice slice point for testing.

This is exactly Fowler's [Gateway pattern](https://martinfowler.com/eaaCatalog/gateway.html).

For example, let's imagine a very trivial data service that provides a key-value style interface:

```scala
trait DataService {
  def saveData(id: String, data: Array[Byte])
  def getData(id: String): Array[Byte])
}
```

Real services would of course have more interesting contracts, but this is good enough for illustration purposes.

So, the `DataService` codebase is going to ship a jar with its client bindings, say `data-service.jar`, with both it's `DataService` interface in it, as well as the implementation, say, `DataServiceJsonImpl`:

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

This is the API (the binding), which is conveniently already in our client's language, that our client will consume.

This is pretty standard: services providing client bindings (mini-SDKs) for their clients, granted usually only for a subset of blessed/preferred client languages.

Testing in the Downstream Clients
---------------------------------

So, this is all well and good: the downstream client codebase can program against the `DataService` contract, and for its tests it can use a fake implementation, and in production use the real `DataServiceJsonImpl`.

Okay, so let's look at the fake implementation...what should it look like?

Per my [other post](http://www.draconianoverlord.com/2010/07/09/why-i-dont-like-mocks.html), I generally prefer stubs, so I'll defer the mocks/stubs/etc. discussion to that post, and, in my downstream client's codebase, jump straight to writing a stub:

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

Our tests can now use this and run very quickly, be very isolated, and we can still be generally confident that the code we tested against the `DataServiceStub` will still do the right thing when using `DataServiceJsonImpl` in production.

Sharing the Stub
----------------

So, the interesting thing is that the stub we wrote, `DataServiceStub`, is actually fairly generic: there is nothing specific about our client code in it (as written anyway).

And the "fake" semantics we wrote (a dumb in-memory key/value store) actually pretty accurately mimic the real semantics. Which makes sense, because if our stub semantics didn't match our production semantics, our tests would be pretty hard to read.

What we've realized recently is that, instead of each client rewriting its own stub implementations of the same contract, the upstream service should just ship it's own stub `DataService` implementation.

There are a few interesting upshots to this:

1. Obviously code reuse, as each downstream project can reuse the `DataServiceStub` for free.

2. Since the stub implementation is shared, the pooled effort of maintaining just one fake implementation leads to a higher quality stub that covers more of the API (instead of only the parts that each particular project needed).

3. The upstream developers, who are implementing `DataServiceJsonImpl` can also implement `DataServiceStub`, which makes sense as they will be most familiar with the semantics of the `DataService` contract.

4. Per a comment by [Mark Dietz](http://markdietz.wordpress.com/), we could envision an upstream service shipping the stub *before* the actual implementation, allowing downstream projects to start integration sooner, and using the stub's fake-but-accurate semantics to flush out assumptions in both the upstream and downstream projects.

This is what we've been trying, and we've liked it so far. I don't know that I've really seen another projects do this before, which makes me think it's somewhat novel.

**Update June 2018:** I watched a Go talk, [Advanced Testing with Go](https://youtu.be/8hQG7QlcLBk?t=39m33s), by the founder of Hashicorp, Mitchell Hashimoto, that does exactly this with their Go projects. They call it "Testing as a Public API".

Can Everyone Do This Please?
----------------------------

So, that's the idea; I'd be delighted if I could pull a service-oriented project's jar from Maven central and have stubs included in the jar and ready to go.

As it is today, we end up building our own stubs for a number of services--basically any internal or external service/API we touch. Some are simple, others are more work.

Either way our implementations (which we open source like [fakesdb](https://github.com/stephenh/fakesdb) when possible) are rarely application-specific, so it a shame we can't reuse existing ones.

Popularizing Stubs vs Mocks
---------------------------

I also think services coming with stubs would help tilt the scales towards stubs over mocks.

Stubs obviously require up-front investment, where as mocks are cheap right out of the box. But I think once you have more than a few tests, stubs start paying off, and many developers I've worked with end up "seeing the light" and preferring stubs over the long-term.

And so if stubs were provided, for free, it would significantly lower (or all together remove) the usual stub initial cost, then perhaps more projects would choose to test with stubs up-front.

Cross-Language Wrinkles
-----------------------

Thinking about it more, microservices are, by definition, exposed via HTTP (or other network calls), and so typically meant to be consumed in a language-agnostic manner.

This is a potential pitfall for stubs, as (for me) ideally stub implementations are in-process/in-memory, as this provides the fastest, most isolated tests.

However, this devolves to each language maintaining its own bindings (which is already the norm unless you use something like GRPC) *and* stub implementation.

So, for this "services come with stubs" proposal, I could see it being annoying for an up-stream, network-based service to provide in-process stubs for a variety of target client languages.

There are a few ways I've seen this handled:

1. Just accept being a non-/semi-polygot shop and write the stubs on your primary architecture.

   E.g. Bizo is a JVM shop, so we write JVM-specific `DataServiceStub` implementations in the upstream project, because we know the consumers will be Java/Scala projects as well.

   This works very well for us and is the sort of scale you get from non-polygot architectures, albiet with trade-offs.

   However it only works well for internal consumers that are in your same language/platform.

2. Crowd-source stubs from each of the language communities.

   I don't see this done often (?), but for widely-used services, I think it makes sense to the upstream project to link to/steward projects that provide stubs for each target platform.

   E.g. the Amazon [aws-java-sdk](http://aws.amazon.com/sdkforjava/) is extremely widely used and at Bizo we started a meager effort to stub what we needed. We open sourced it as [aws-java-sdk-stubs](https://github.com/bizo/aws-java-sdk-stubs), and it'd be great if it was more widely-known and contributed-to (it's not), by being "blessed" by the upstream aws-java-sdk project. (I'm not currently aware of another similar project, but would love to find one.)

   I think it would be doable, as popular as the AWS APIs are, for each community of Java, Go, Ruby, etc., to collaboratively maintain their own stub implementations, and still have the amoritized pay-off be worth it.

3. Write a network-mounted stub.

   Granted, if the upstream project is sufficiently complex that writing a stub is non-trivial, the 2nd approach doesn't scale as well, even with crowd-sourced help.

   An example of this is DynamoDB, which has a large, non-trivial API surface, so AWS provides a network-mounted stub, [DynamoDBLocal](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html). (They also have the [SAM CLI](https://github.com/awslabs/aws-sam-cli), which runs a local SAM environment, so this may becoming a pattern for them, but I'm not as familiar with SAM.)

   This gets the cross-language stub-reuse benefit without the cross-language stub-rewrite cost. Which seems like a great ROI and like a panacea but there are two gotchas:

   * You're making wire calls now, so tests will be slower (granted, still local calls, but it adds up if you hit the ~1000s of tests level). Somewhat similarly, setting up the test harness (picking a port, booting up a subprocess) is more annoying that a simple `new DataServiceStub` constructor call.
   * This does scale past a handful of local, network-mounted services. For example, you can probably `docker-compose` ~10 services, but if you have ~100-1000 microservices across your org/company, it becomes untenable to boot them up locally (or else intelligently figure out the subset you need). This is what LinkedIn ran into with it's old "network" approach. I talk more about this level of scale in [Micro Service Testing at Scale](/2018/01/21/microserving-testing-at-scale.html).

   Especially for a database like DynamoDB, this is exactly the same trade-off of "fake my db connection and get super-fast but lossy tests" or "use a local db connection and run slower" that relational database applications have been mulling for ages, and that I discuss in [The Holy Grail of Database Testing](/2015/11/29/holy-grail-of-database-testing.html).

   All things considered, I prefer the speed and simplicity of in-process stubs, but would definitely use a network-mounted stub if an in-process stub was not available.

Builders and Fixtures Are Next
------------------------------

**Section added June 2018**

Once you have stubs themselves being shared, you can also start sharing test fixtures, e.g. "give me a basic account with two transactions in it", or whatever your common scenarios are.

I need to do a longer post on test-specific builders (it is basically Fowler's [Object Mother pattern](https://www.martinfowler.com/bliki/ObjectMother.html)), but this can dramatically cut down your per-test lines of code and complexity, as you basically get a mini-DSL for describing your input cases.

(Coincidentally, this was also mentioned in the [Advanced Testing with Go](https://youtu.be/8hQG7QlcLBk) talk, although I don't believe he used a specific term to describe it.)


