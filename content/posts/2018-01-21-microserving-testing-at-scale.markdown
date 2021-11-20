---
date: "2018-01-21T00:00:00Z"
categories:
  - Architecture
  - Favorites
title: Micro Service Testing at Scale
---

(Alternate titles/tldr: "Stubbing at the Data Layer", or "Data Layers should come with Stubs", which is related to my earlier post, [Services should come with stubs](/2013/04/13/services-should-come-with-stubs.html), but this proposes moving stubs up the stack.)

Micro-services have an interesting problem that, personally, I haven't seen solved really well: integration testing in the large.

Where by "in the large", I mean testing with many micro-services (100s to 1000s), not testing with large data (that maybe useful in certain contexts, but not what I'm focusing on).

See my other post, [The Futility of Cross-System Integration Testing](/2017/08/23/futility-of-cross-system-integration-testing.html), for more on the topic, but none of the systems I've personally worked on (which, granted, is a small `n`) have solved having cross-system tests that provide 100% isolation and control of each test's input data.

Not being able to provide this isolation and control, for me, is non-negotiable, as otherwise your test suites are invariably flaky and usually slow, and actually become a burden to development velocity instead of an acceleration.

Tangentially, I suppose that is an interesting articulation of my personal testing philosophy: while the normal/obvious goal for testing is *verification of system requirements*, my primary goal is subtly different: it's **developer productivity**. Tests should make developers faster. If your tests aren't making your development velocity faster, that is a code smell/test smell that should be invested in.

Testing in-the-small vs. in-the-large
-------------------------------------

As context, if you are doing micro-services in-the-small, e.g. ~5-10 services within your entire organization, you are probably okay and hopefully don't have too much of a testing challenge.

This is because you can, in theory, easily spin up each of your individual services, either on your development machine or a CI machine, and control each service's individual state (e.g. setup service A's MySQL database, service B's Redis instance, etc.).

Given each test run now has it's own copy of all of your services, you've achieved per-test isolation and control, and so should be able to have a robust test suite.

However, once you hit micro-services in-the-large, let's say >10 or >100 or >1000 services, starting up each service in "~exactly like production" becomes very complex and basically untenable (too complex, too slow, brittle config, don't want to install Oracle on each developer's machine, etc.).

So, that's the problem space I'm focused on: 100s/1000s of services where local-/CI-deployed per-developer/per-test instances of each service is no longer possible.

1st Approach: Shared Integration Environments
---------------------------------------------

Generally where I've seen companies go next is an integration environment, where you have ~100s/~1000s of micro-services all deployed in a shared environment, so you no longer start each service locally.

Instead you have tooling to deploy test instances (e.g. of the specific code/service you're currently working on) either to the shared environment itself, or have cluster traffic proxied back to your locally-running service. But, other than your own test instance, all of the other services are already running/deployed and using their own data stores (as if they were in production).

But now you've given up any measure of control of your input data, and isolation from other tests.

So while I think these integration environments have their uses (primarily manual new feature testing and perhaps very limited automated smoke tests), they are otherwise horrible for automated tests (again, see my [other post](/2017/08/23/futility-of-cross-system-integration-testing.html)).

1st Alternative: Services Ship with Stubs
-----------------------------------------

Where I've historically asserted architectures should go next, is for [services to come with stubs](http://www.draconianoverlord.com/2013/04/13/services-should-come-with-stubs.html), which are in-memory implementations of the same production contract/API, but that are very cheap to instantiate and setup (e.g. to setup a `StubOrderService` with two dummy orders, one completed/one cancelled, you want to test your system against).

(Tangentially, I recently saw this practice [echoed by a Google test engineer](https://testing.googleblog.com/2017/02/discomfort-as-tool-for-change.html?m=1), who also makes the point that having service owners implement stubs+tests for their own API makes them produce better, more client-friendly, APIs.)

If all of your micro-services ship with stubs, it becomes possible to write "near-integration" automated tests, where you can start to write "looks like cross-system" tests, that test how your service A talks to another service B, but uses the in-memory implementation of service B.

And because service B is a stub, we can get a version of the "in-the-small" testing approach, where we can conceivably startup all (or a non-trivial subset of all) of the micro-services your automated test needs to touch, e.g. not just service B, but ~10/20/however many other services that your test transitively touches (ideally this would be handled dynamically/automatically by your stub infrastructure).

There are two primary downsides of this approach:

1. Service owners now have multiple implementations to write and maintain: their real production codepath, and their stub codepath, and

2. The stub services don't/can't 100% mimic production.

That said, for systems I've built, this approach has still been a net-win, as the huge benefit of fast, consistent, stable "near-integration" tests is worth the trade-off of up-front and ongoing costs of maintaining the stubs.

I've personally used this for ~testing-in-the-medium (e.g. not quite testing-in-the-large), primarily when working across vendor system boundaries, and had it work out well. Again, see [my other post](/2013/04/13/services-should-come-with-stubs.html).

2nd Alternative: Move Stubbing up the Stack
-------------------------------------------

This 2nd/new alternative, moving stubbing into the data layer, is meant to address the two cons of "services ship with stubs", which both fundamentally stem from having multiple service implementations (one production, one stub).

So, if you take a step back, why are we writing stubs in the first place?

The goal was control and isolation of test data. (Note that faster test execution speed is a great side-benefit as well.)

What breaks control and isolation?

It's I/O. Specifically *shared* I/O. The shared database. The shared cache. The shared Dynamo table. Shared I/O is what breaks control and isolation.

By having each team write stubs for their services (the previous/1st alternative), each team is repeating the "avoid I/O" incantation/decision in their stub. Make it only in-memory. Avoid the production I/O. Which basically means "don't use our production data store, use 'something else'".

Hopefully each team is sharing as much code as possible between their production and stub service implementations, perhaps using their own frameworks or abstractions (maybe an ORM that supports multiple backends), which may or may not be leaky. (Although, pedantically, I do assert stubs don't have to provide 100%, or even close, production fidelity to be useful; but if they can, it's a great goal.)

However, if you assume a large, mostly homogeneous environment (e.g. the typical ~medium-large tech company), an interesting proposition emerges: instead of each team re-coding this "avoid shared I/O" decision, what if we provide centralized "potentially fake I/O" data store APIs/abstractions, that service owners can then reuse?

This is taking what we want each team to do in-the-small, which is share as much code between their production service and stub service, and move that into an in-the-large shared, leveraged library/framework that then each team gets for free.

We are basically moving the conditional stubbing logic "up the stack", and providing service teams APIs that, in theory, means they write their service once, and we could, at our shared/provided data layer, isolate the I/O such that in testing environments it's fake (e.g. in-memory and sandboxed-per-test), but in production it's the regular production data store.

There would be two ways of deploying/using these stubbed-data-layer tests:

1. Write "looks like cross-system" tests that are actually using local, in-memory instances of each service.

   E.g. let's say you call service B, and in production, service B is started with `new ServiceBImpl(new DyanmoDbService())`. And, again in production, you make wire calls to service B.

   Instead, in the test (somewhere in the stub/test infrastructure code), we would locally instantiate `new ServiceBImpl(new StubDynamoService())`, and then just make method calls directly on it (instead of proxied/networked wire calls), which would use all of the same `ServiceBImpl` code, but use an in-memory/fake "dynamo" implementation that is super quick and isolated.

   If you have a 100% homogeneous environment, e.g. all JVM or all .NET, you could instantiate these services all in-process, which would be extremely quick.

2. Use the shared integration environment, where each micro-service is deployed to the shared cluster, but all services in that cluster are instantiated with their stub data stores, e.g. `new ServiceBImpl(new StubDynamoService())`.

   Then, even though these services are a shared deployment, each test would flag its requests with a unique test execution id, which would be passed through our call graph (e.g. along with our other RPC instrumentation data), and used as a token within the `StubDynamoService`, `StubCacheService`, etc., to isolate data operations for that test execution from the data of any other test execution.

   E.g. `GET /someKey` with test execution id "test-run-1234" would be a different lookup/sandbox than the same `GET /someKey` with test execution id "next-run-6789".

Both of these approaches have their pros/cons, and are not mutually exclusive.

Note that the idea of stubbing at the data layer is not novel, as I've written before about [The Holy Grail of Database Testing](/2015/11/29/holy-grail-of-database-testing.html) being an immediately-bootable, immediately-resettable version of a relational database. Nor was that musing original either; I've seen a few data stores provide local versions, e.g. [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html).

So, data stores shipping stubs is a known/viable idea, I've just not seen it applied across-the-board as a way to specifically to solve the problem of micro-service integration testing.

1st Challenge: Relational Databases
-----------------------------------

If, as an infrastructure team who owns a data service (e.g. manages/developers your company's preferred/mandated key/value store, cache service, etc.), you're given the job of providing a stubbed version of your data service, your life may or may not be easy.

If you own a key/value service or a cache service, your life will probably be easy: these APIs are fairly straightforward, and writing naive/in-memory versions of them is simple. You can likely maintain a very non-leaky abstraction of the production service without much effort.

However, if you own/provide a relational database service, then this mandate will be a challenge, as SQL is a very robust API, and it seems hard to provide a 100%-non-leaky abstraction that, to clients, looks just like production, but is quick and isolated.

Granted, there are viable in-memory databases, e.g. [sqlite](https://sqlite.org/), [H2](http://h2database.com/html/main.html) and others, that could be leveraged for providing the stub version, but it's unlikely you'll be using sqlite/H2/etc. for your production data store, and unfortunately SQL is sufficiently complicated/nuanced that I've never seen a project be able to run against multiple database vendors (e.g. the test suite can run against MySQL or Postgres or Oracle or H2) without significant development cost.

(I'm sure there are exceptions, e.g. projects who've been multi-vendor from day 1, but I think they are comparatively rare.)

So, honestly, I don't have a good answer for this.

If you limit your application to a specific/simple subset of SQL, such that you can really use either H2 or Postgres without much/any application-code changes, that seems your best bet; but I'm sure especially historically Oracle applications will have a tough time getting there.

2nd Challenge: Migrating Legacy Services
----------------------------------------

If you are big enough to have a testing-in-the-large problem, you also invariably have a non-trivial amount of legacy code, that was written before you knew you were going to be large, and before you knew you were going to need some sort of fancy testing-in-the-large solution.

Especially if your storage layer is a relational database (see previous point), it will likely be non-trivial to convert all of your production services over to this new subset of stub-supported storage APIs.

Also, any sort of adhoc in-memory caches, hash maps, etc., that your application previously thought could be shared process-wide should now be sandboxed, just like all the other storage options. In theory replacing these "just an in-memory map/cache" with a stub-aware version is not complicated, but finding all of the existing places in your services that use them would be tedious.

So, if you decide to tackle this, you're likely looking at a multi-year migration effort, which would be extremely expensive and also risky unless you were 100% convinced this approach was going to be worth the sweat and toil to get there. 

You could mitigate some of this risk by prototyping/migrating a subset of services first, and evaluating what the actual migration cost and post-migration benefit was before committing to rolling it out across the whole company.

3rd Challenge: Handling Near/Offline Applications
-------------------------------------------------

I'm fairly confident this approach would work well for online services, which generally synchronously interact with their data stores.

Unfortunately, there is also a non-trivial amount of business logic that is written in near-line (e.g. streaming frameworks like Kafka or Kinesis) and offline (e.g. Hadoop) services.

In an ideal world, our architecture would expose this nearline/offline application logic to observation by integration tests as well.

There are at least two complications:

1. We now have even more abstractions (Kafka, etc.) to make stub-aware, so our cost goes up.

   E.g. for Kafka, can we teach Kafka about our per-test-execution sandboxes?

   E.g. if my test-run-123 sends a `FooEvent1` and your test-run-456 sends a `FooEvent2`, ideally not only are these events kept separate (isolation), but the test run execution id (123 or 456) is captured so that when our streaming application logic processes the event, and does subsequent side-effects, e.g. making API calls or database writes, it can pass along that test run id, to continue the facade of isolation.

   Is it possible to teach the real Kafka about this? Probably not. How easy would it be to write a non-scalable, in-memory, stub-aware version of Kafka? Probably easier than a stub-aware relational database, but still expensive.

   Also, that's just Kafka/Kinesis; what about Hadoop? Spark? Pig? Maybe if all of your reads/writes went through a consolidated Hadoop data provider.

2. Due to streaming/offline logic being asynchronous, test timing becomes a nightmare.

   In the online world, services would use data stores that are in-memory stubs that we can assume are 100% consistent and "flush" immediately, so it's conceivable for a test to have a transactional, basically synchronous view of the world.

   E.g. immediately after asking for "order 123" to be created, a test can do a read for "order 123" and make sure it was created successfully.

   However, nearline and offline logic is inherently asynchronous. After our test asks for "order 123" to be created, how long should it wait to observe some nearline/offline side effect? Maybe the nearline is available within a few minutes? Maybe the offline is available the day after? Do we hard-code that as a `Thread.sleep` in our test?

   This async timing seems like a mess that tests should not even try to handle.

That said, if I were to wave a magic wand, and have a very large infrastructure team budget, I can imagine both streaming and offline frameworks (DSLs/APIs/etc.) that, when given the metadata of "what is your input" and "what is your output", could conceivable be invoked "immediately" after an online event occurs.

For example:

1. I write a near-line streaming application, `StreamingApp1`, that takes `FooEvents` and outputs `BarEvents`.

   In production, this is super-scalable, e.g. it asynchronously batch processes 10,000 `FooEvents` at a time with Kafka/etc.

2. I deploy `StreamingApp1` to the shared integration cluster, which uses metadata to know "this application processes `FooEvents`".

3. I write an automated test that makes an API call to `FooService` that causes a `FooEvent` to be created.

4. The stubbed Kafka/message service (which `FooService` just wrote too) knows "when a `FooEvent` is created, tell `StreamingApp1` about it."

5. My `StreamingApp1` logic runs, processing just the single message appropriate for my test execution run.

   (This execution could either happen synchronously on write to the test cluster's `FooEvent` stream, or asynchronously within a reasonable window that the test could potentially poll for/block on, e.g. ideally a few seconds.)

6. My automated test can now observe the affect of `BarEvent` being created, and assert against the expected streaming application logic.

You could imagine the same scenario for offline jobs: in production being ran as normal, nightly across 100s/1000s of machines per job with map/reduce, but for integration tests being ran periodically/automatically on-demand, within the each tests' execution sandbox, on only the subset of test data applicable to that test.

Granted, I'm way down the rabbit hole here on armchair-architecture, and building robust stubbed/integration testing support into both near-line and offline frameworks, plus migrating legacy jobs to said framework, is a non-trivial cost that only the biggest tech companies could conceive of doing.

But this is also optional; I wanted to mention near-line/offline application logic for completeness, but I think focusing on providing data-layer stubs for just online applications is prudent.

4th Challenge: Cross-System Data Setup
--------------------------------------

This is not really a challenge, as I don't think it should be hard to implement, but if you have a stubbed approach (for either service-layer stubs or data-layer stubs), it's important to have an easy way to setup test data across all of your services.

E.g. you don't want to have a test method have to know "okay, to create an Order, I need to poke relational table A with some new rows", then "okay, now to create a Customer, I need to touch the key/value store and put some JSON in there".

This leaks the storage details into your tests, and would likely be very verbose/ugly.

You should have a framework that the test can declare the entities that it wants for this specific boundary case (and only those entities, e.g. every test should start with zero data, to have maximum isolation and also conceptual simplicity), and then have those entities pushed into their backend services/data stores in a service-/store-agnostic way.

Historically I've had good luck with Fowler's [Object Mother](https://www.martinfowler.com/bliki/ObjectMother.html) pattern to provide a builder/DSL for creating your test entities.

5th Challenge: Data Store Lock-in
---------------------------------

One interesting 2nd-order consequence of this proposal would be, if successfully implemented, it would become harder for teams to use new/bespoke data stores (and also streaming/offline frameworks, if the company was ambitious enough to execute those in a stub-aware fashion) that might solve their specific service's challenges, but is not one of the company's supported stub-aware data stores.

At that point, the team would either have to implement a stub for their new data store themselves (which may or may not be easy, per previous discussion of key/value vs. relational stubs), lobby an infrastructure team to provide support, or perhaps just fallback on providing a service-layer stub for awhile.

This would reduce the agility of teams in terms of their data store choices.

However, I think the pragmatic reality of medium-to-large company development (and why many developers end up not liking it), is accepting that you're restricted to company-standard/company-mandated choices in terms of technology, architecture, data stores, etc., which prioritizes cost-to-the-org productivity over cost-to-the-individual productivity.


Relation to Pat Helland's Entities
----------------------------------

Recently Pat Helland's [Life beyond Distributed Transactions](http://www-db.cs.wisc.edu/cidr/cidr2007/papers/cidr07p15.pdf) went by Hacker News, and it was a pleasant read.

While what I'm proposing, migrating/rebuilding all of your company's micro-services on top of new/stub-provided storage APIs, is daunting, it relates to Pat's concept really well.

Ideally, your application logic should be, using his terms, scale-agnostic. It's the upper layer of code that has the application programmer's business logic, and should ideally be blithely unaware of the overall scale/complexity of the ecosystem it runs in.

If you follow his proposed architecture, and have a distinct set of lower-layer, scale-aware code that deals with in-the-large concerns of scale, it is coincidentally also a very good slice point to implement what I'm proposing here, which is in-the-large concerns of testing.

His article also talks about offline application logic having the same scale-agnostic/scale-aware divide, e.g. what's provided by map/reduce, which is similar to my armchair musings about tricking near-line/offline code to be ran "almost synchronously" for the increased ease/robustness of test timing/assertions.

So, my guess is that many companies are already using architectures that are close to what Pat proposes: various online, near-line, and offline frameworks that make application developers' lives easier by letting them write scale-agnostic code with the scale-aware magic being reused/provided out-of-the-box.

The problem is that, having evolved organically, retrofitting each of a company's chosen scale-aware frameworks to also know about scale-aware integration testing (means lots of isolated tests, not necessarily lots of test data) would be non-trivial.

Conclusion
----------

So, wrapping up, this is my latest suggestion for what companies struggling with the morass of shared integration environments should attempt to do.

While I think "services ship with stubs" is still a great starting point, especially when you don't control all the services (e.g. you can write your own stubs for vendor APIs or internal APIs you don't control), if you want to scale stubs to be enterprise-/company-wide, then I think "stubbing at the data layer" will result in a longer-term ROI, as you won't have pay the stubbing cost for every single micro-service.

As a disclaimer, I have personally written many service-layer stubs, with a good deal of success, but have not had a chance to try this approach of data-layer stubs (although technically I wrote [fakesdb](https://github.com/stephenh/fakesdb), which is a data-layer stub in ~2010, but that was not applied to cross-service/in-the-large testing like I'm proposing here).

I'm cautiously optimistic, albeit with disclaimers of large up-front cost.

But, if you think on a long horizon, e.g. if you're a big company, with ~100s/1000s of developers, and you think to ~4-5 years out: do your really want your developers continuously struggling with, and wasting time on, trying to write automated test suites that are slow, flaky, time-consuming and of debatable, likely net-negative, value?

I think, on that time horizon, and at that scale (100s/1,000s of developers), embarking on this sort of effort starts to become conceivable and worthwhile in terms of ROI.



