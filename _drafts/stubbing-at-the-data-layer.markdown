---
layout: draft
title: Elegant Microservice Testing at Scale
---

{{page.title}} (Stubbing at the Data Layer)
--------------

Micro-services have an interesting problem that, personally, I haven't seen solved really well: integration testing in the large.

See my [other post](/2017/08/23/futility-of-cross-system-integration-testing.html) on the topic, but none of the systems I've personally worked on (which, granted, is a small `n`) have solved having cross-systems tests that give 100% isolation and control of each test's input data (which, to me, is non-negotiable for a robust test suite).

If you are doing micro-services in-the-small, e.g. ~5-10 services within your entire organization, you're better off, as it is doable to spin up each of your individual services, either on your development machine or a CI machine, and control each service's individual state (e.g. setup service A's MySQL database, service B's Redis install, etc.).

However, once you hit micro-services in-the-large, let's say >10 or >100 or >1000 services, starting up each service in "~exactly like production" becomes very complex and basically untenable (too complex, too slow, brittle config, don't want to install Oracle on each developer's machine, etc.).

Generally where I've seen companies go next is an integration environment, where you have ~100s/~1000s of micro-services all deployed in a shared environment, so you no longer start each service locally. Instead you have tooling to deploy test instances (e.g. of the specific code/service you're currently working on) either to the cluster itself, or have cluster traffic proxied back to your locally-running service. But, other than your own test instance, all of the other services are already running/deployed and using their own data stores (as if they were in production).

But now you've given up any measure of control of your input data, and isolation from other tests.

So while I think these integration environments have their uses (primarily manual new feature testing and perhaps very limited automated smoke tests), they are otherwise horrible for automated tests (again, see my [other post](/2017/08/23/futility-of-cross-system-integration-testing.html)).

Services Ship with Stubs
------------------------

Where I've historically asserted architectures should go next, is for [services to come with stubs](http://www.draconianoverlord.com/2013/04/13/services-should-come-with-stubs.html). (Tangentially, recently I saw this practice [echoed by a Google test engineering](https://testing.googleblog.com/2017/02/discomfort-as-tool-for-change.html?m=1), who also makes the point that having service owners implement tests for their own API makes them produce better, more client-friendly, APIs.)

The primary downside of this approach is that service owners now have multiple implementations: their real production codepath, and their stub codepath. This means maintaining two codebases (although ideally you could refactor a lot of your domain logic into a common path) and that the testing stubs don't/can't 100% mimic production.

That said, to me this approach has historically still been a net-win, as the massive benefit of fast, consistent, stable "integration" tests is worth the trade-off of up-front and ongoing costs of maintaining the stubs.

Move Stubbing up the Stack
--------------------------

However, if you take a step back, why are we writing stubs in the first place?

The goal of stubs is control and isolation. What breaks control and isolation? It's I/O. Specifically *shared* I/O. The shared database. The shared cache. The shared Dynamo table. Shared I/O is what breaks control and isolation.

So, if you have each team writing stubs for their services, each team is repeating the "avoid I/O" incantation in their stub. Make it only in-memory. Avoid the production I/O. Which basically means "don't use our production data store".

If you assume a large, mostly homogeneous environment (e.g. the typical ~medium-large tech company), an interesting proposition emerges: instead of each team re-code this "avoid shared I/O" decision, what if we provide a centralized "fake I/O" abstractions, that service writers can then reuse?

This is taking what we want each team to do in-the-small, which is share as much code between their production service and stub service, and moving that into an in-the-large shared, leveraged library/framework that then each team gets "for free".

We are basically moving the conditional stubbing logic "up the stack", and providing service teams APIs that, in theory, means they write their service once, and we could, at our shared/provided data layer, isolate the I/O such that in testing environments it's fake (e.g. in-memory and sandboxed-per-test), but in production it's the regular production data store.

The idea of stubbing at the data layer is not novel, as I've written before about [The Holy Grail of Database Testing](/2015/11/29/holy-grail-of-database-testing.html) being an immediately-bootable, immediately-resettable version of a relational database (nor was that musing original either; I've seen a few data stores provide local versions, e.g. [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)).

(I have also seen some colleagues refer to this idea of storage-layer stubbing as basically assuming all of your data stores have the ability to "copy-on-write".)

Unfortunately, despite pining for it for years, I've not seen this implemented for relational databases, admittedly understandably as the up-front cost of making a 100% faithful replication of your production database is just too expensive (I've mused about "postgres for production", "sqlite for testing" but assume that, once you let the service developer write raw SQL, it's going to be a leaky abstraction; granted this is an assumption). The closest I've got so far is just running Postgres/MySQL with `fsync`/disk flushes turned off, but even this only solves the control problem (you can easily/quickly reset the data between test runs) and not isolation (concurrent tests would see each other's data).

However, if you reframe the problem within the context of a medium-to-large, mostly-homogeneous corporation, there are likely only a handful of "blessed" storage options: a relational database from vendor X, a key/value store from vendor Y, a cache from vendor Z (or open source versions of each of this).

Given this, I think it starts to be financially viable, in terms of cost and benefit, to put the effort into a ~100% faithful fake version of each of the company's blessed storage options.

(Granted, the only hard one here is really the relational database; if you're only using key/value-based APIs, this is probably trivial to implement.)

If we assume all of our micro-services use only our blessed, fake-provided-for-free storage APIs, we can then return to our shared-deployment integration environment (where we have 100s/1000s of services deployed), but as each request fans out through our system, it is tagged with its "sandbox id" (which maps to a test execution id), such that once any of the services checks its data store, the service is automatically accessing isolated, controlled data.

Complications
-------------

While I think this idea is fairly great in theory, there would be a few complications:

1. It would be hard to retrofit existing applications that were written against native storage APIs into this new model.

   Especially if your native storage API was a relational database, which seems to be the hardest storage solution to fake.

   Also, any sort of in-memory caches, hash maps, etc., that your application previously thought could be shared process-wide should now be sandboxed just like all the other storage options. In theory the "fake-able cache/fake-able hash map" API and implementation would be trivial to write, but then finding all the places your existing applications need to use them would be tedious.

   This is also a chicken-and-egg problem: very few companies are big enough to worry about this, but once you are big enough that this is a problem, you likely have a non-trivial amount of legacy/production code that was written while the company was still operating in the in-the-small realm.

   So, you're likely looking at a multi-year migration effort, which would be extremely expensive and also risky unless you were 100% convinced this approach was going to be worth the sweat and toil to get there. 

2. It doesn't address near-line processing.

   Many architectures now leverage streaming and near-line processing for non-trivial aspects of their business logic.

   As proposed, the fake storage layers only address online requests, as they fan out through the system, tagged with their sandbox/execution id.

   If we want to test even more of our integration scenarios (which we likely do), we would need the tagging extended to our streaming systems, e.g. Kafka/Dynamo/etc., such that each message has it's tag, which is then respected not only within our online services, but within the near-line integration services as well.

   And, unfortunately, just tagging is probably the simpler problem; the harder problem is coordination: if we truly want to write automated integration tests on this shared online + near-line cluster, the coordination aspect of "has my near-line window flushed?" would be very annoying to deal with.

3. It doesn't address data setup.







