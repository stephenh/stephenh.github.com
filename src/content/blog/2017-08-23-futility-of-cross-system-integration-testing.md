---
title: The Futility of Cross-System Integration Testing
description: ""
date: 2017-08-23T00:00:00Z
tags: ["Testing", "Architecture"]
---



I've been forming an opinion for awhile that is potentially eyebrow raising, but that I'm now basically convinced of: that cross-system integration testing is not worth it, and in most projects is actually an anti-pattern.

This is potentially surprising, because even in projects that use a good balance of "1000s of unit tests with ~10s/100s of integration tests", it's assumed that, of course, we need cross-system integration tests to show that things "actually work".

However, my experience, based on the last ~4-5 systems I've either built or worked on, is pretty much the opposite, and that the projects with "showing things actually work" integration tests have not had that investment pay off, and so here I'll try to reason about that and articulate why.

Integration Test Terminology
----------------------------

First, a mea culpa that "cross-system" as an adjective to integration testing, for traditional usages of the term, seems very redundant.

E.g. "integration testing" is de facto cross-system. That's the "integration". Obvious.

But I think there is some slight nuance, mostly around sphere of influence.

Let's take a typical web application, and it has four standard layers:

1. Frontend HTML/CSS/JS
2. JSON REST APIs for the frontend JS/AJAX to call
3. Database layer for REST APIs that persists data to MySQL
4. Gateway layer for REST APIs that calls 3rd-party systems (e.g. vendors like a credit card API)

Given these four layers, I assert there are two flavors of cross-layer integration testing:

1. Intra-system integration testing.

   This is integrating (as in starting real versions of) the various sub-systems within the overall system I control, so real-frontend for layer 1 + real-REST servers for layer 2 + real-MySQL database for layer 3.

   So, just like the term "integration test" insinuates, I could stand all three of these layers/sub-systems up, and do some happy path testing, e.g. with Selenium tests, and make sure things work well across the stack.

   These tests make sense to me.

2. Inter-/cross-system integration testing.

   This is integrating the above sub-systems (real-frontend + real-REST + real-MySQL) *plus* the real-vendor system that the gateway layer, layer 4, talks to.

   These are the tests I want to avoid.

So, just to highlight, the differentiation between these two flavors is control:

* Intra-system testing == only layers/sub-systems I control
* Cross-system testing == all layers/sub-systems, even those outside my control

What Do You Mean By Control?
----------------------------

So, continuing with defining terminology, by "control", I mean two things:

1. Are my interactions with the system completely isolated (**isolation**), and
2. Can I nuke/mutate the system's data whenever I want (**control**)?

Basically, I want to be able to setup exactly the test data I want for a given test (control) and then execute it with assurances nothing else will muck with my data (isolation).

So, let's evaluate this "do we have control?" criteria against each of our sub-systems:

* For the frontend HTML/CSS/JS, is my test data isolated from other systems and other tests?

  Yes: each selenium test has its own browser instance so its own cookies, local storage, etc., so it's effectively isolated from the others.

* For the REST API, is my test data isolated from other systems and other tests?

  Yes: REST APIs are typically stateless, so np.

* For the MySQL database, is my test data isolated from other systems and other tests?

  Depends: if I create my very own MySQL database, *and* only run a single test at a time, *and* nuke the data between every test, then yes, I have data isolation for the tests.

  (Alternatively, if my app already supports sharding, maybe I don't have to nuke the entire database, and instead each test gets it's own shard, but the effect is the same.)

  Basically, because I own this sub-system, I can do whatever gyrations (dedicated, frequently-nuked database) I need to get isolated data.

* For the vendor API, is my test data isolated from other systems and other tests?

  Typically not at all.

  I've worked with great vendors and terrible vendors over the years, but even the best vendors have never had a test/integration system that gave me 100% data isolation. There is basically never a way to reset the data in their integration systems.

  Here is where it becomes obvious I don't own this sub-system: I can't hack on it to setup the data isolation I need.

Why Does Control Matter?
------------------------

So, we've established that control is about which sub-systems whose persistent data is at your whim. But why does that matter?

**Because any automated test that touches a system/sub-system who's data is outside of your control is going to suck.**

A baseline, non-negotiable, requirement for effective tests is the ability to control their data.

If the test cannot control and isolate it's data, you are risking several bad things:

1. Test Flakiness
2. Test Complexity
3. Test Incompleteness
4. System Availability

I'll drill into each.

#### Test Flakiness

Lack of isolation means it will be very easy for "other things" to break your tests. Where "other things" could be other systems, or internal users just harmlessly poking around, or even your tests themselves.

For example, you setup a test account in your vendor's system. You have ~100s of tests using it, and then the vendor decides to nuke their sandbox database. Your tests now all break.

Or you have ~100s of tests using the vendor's system, and one of your own tests causes it to tip over an inherent system limit (e.g. maybe every test run only creates data, but cannot delete it), and now the test account is locked/broken/egregiously slow.

I have worked with systems that have automated tests that use shared data, and it invariably happens that "something else" pokes the data, and tests break.

When tests break, especially repeatedly for the same core reasons (lack of a solid foundation), developers quickly get frustrated, become disenfrancised, and the tests themselves and your culture around TDD will suffer.

You must have 100% data control and isolation from day one, or you are building on quicksand.

#### Test Complexity

Besides flakiness, even if you *think* you can build/hack around the above issues, invariably tests that cannot control their data are just inherently complex.

For example, my gold standard of a test flow is a cadence that looks like:

* Given the world looks like X
* When action Y happens
* Then the world looks like Z

Just to show a concrete example, here is a real-and-slightly-edited test for one an offline job (to tangentinally highlight/show off that even offload Hadoop/Spark/Pig jobs can have effective, TDD-style test suites):

```java
@Test
public void shouldDropExtraPstData() throws Exception {
  // given one event that happens at 11/3 11pm UTC (so 11/3 PST)
  final FooInputEvent i1 = newFooInputEvent(e -> setEventTime(e, NOV3.atTime(23, 0)));
  // and another event that happens at 11/4 1am UTC (so also 11/3 PST)
  final FooInputEvent i2 = newFooInputEvent(e -> setEventTime(e, NOV4.atTime(1, 0)));
  // when the job runs
  runScript(i1, i2);
  // then we got only 1 combined UTC event out
  assertEquals(outputEvents.size(), 1);
  assertEqualsWithoutHeader(outputEvents.get(0), newFooOutputEvent(0));
}
```

In cross-system integration tests where "the world" is not in your control, it's impossible to have those "given X" lines at the beginning of your Given/When/Then cadence, so you have to start inventing ways around it, which dramatically increases the complexity of the tests.

Or, instead of inventing ways around it, sometime cross-system tests just skip it the "world looks like X" all together, and assume "the data is already there". Which, for me, is one of the worst things that could happen, as now the input condition is not part of your test method's source code, but instead is implicitly setup out-of-band, e.g. by an engineer clicking around and manually setting up the test case.

There are several reprocussions from this:

* Test readability is terrible, because code reviews and maintainers now have no idea what your "the world looks like X" input data is. They have to guess at what you setup in the shared database.
* The codebase maintainability is terrible, because if a maintainer finds a bug, and says "okay, I need a new test with `testFooBar`'s input data, but with flag `X` set to `Y` instead of `Z`", they need to manually copy/paste `testFooBar`'s shared data. This is tedious and so they basically will not do it.
* The test maintainability itself is terrible, because if the shared data is somehow broken/reset, it's now basically guaranteed that no engineer, even the engineer that wrote the test, knows how to re-create `testFooBar`'s "the world looks like X" input data.

**Basically, if you don't have "the world looks like X" directly in your test methods, your tests are terrible.**

Note that sometimes cross-system tests will attempt to have "world looks like X" setup routines, that still live on top of a shared, not-controlled, not-isolated environment, e.g. by creating a brand new user/account in your vendor's integration system for every test run.

Or you might try to have a clean-up routine, that uses some of the vendor's delete APIs to re-delete what you just created.

And these gyrations are more admirable than the implicit "use data that we setup by hand" approahc, but, to me, they're already too far down the slippery slope away from "tests that are actually simple to read and maintain", because you've introduced a slew of cognitive overhead, without actually solving the fundamental control and isolation issues, that compromises the long-term simplicity, readability, and reliability of your test suite.

#### Test Incompleteness

Somewhat related to complexity, but the exact opposite, is that without data control and isolation, you risk your tests becoming too simple, and therefore trending towards useless.

For example, a common approach to the "we cannot reset the shared data" constraint is to make only either read-only or append-only calls/test cases in your cross-system integration tests.

E.g. you might write a test that only reads the same data from the shared database each time. It does no writes/mutations, so no problem, it should never break.

Except now you have entire codepaths (any write/mutation codepath, which is typically where most of the fun/complex logic exists) that is simply untested.

#### System Availability

I added this point later, as it's not around test data itself, which for me is the key to great tests, but if you don't have data control and isolation over a vendor's sub-system, it's also very likely you can't ensure the overall availability of that sub-system.

E.g. if your cross-system automated tests are part of your CI/deployment pipeline, and your vendor's system goes down for maintenance, what do you do? You can't release? What if your vendor also uses their integration system for beta testing, and regularly pushes out bugs? Their bug means you can't release?

(Granted, there are assertions that this is precisely the point of integration testing, but I'll muse about that later.)

If you limit your integration testing to intra-system sub-systems, you have de facto 100% control over their availability, and so will have the most resilient automated tests.

**In summary, my assertion is that if you don't have data control and isolation, your automated tests will be a net negative to the long-term health of your codebase, and you just shouldn't write them.**

What Do We Do Instead?
----------------------

If we give up on cross-system integration testing, of touching their real sub-system during our CI/deployment system, obviously we still want to have *some* amount of test coverage of our interactions with them. What should that look like?

To me, the best answer is two things:

1. A well-defined contract between the two systems, and
2. Stub implementations of that contract.

A well-defined contract is basically documenting the vendor sub-system's API in some sort of schema, e.g. [protobuf](https://github.com/google/protobuf), [Thrift](https://thrift.apache.org/), [Swagger](https://swagger.io/), etc. It doesn't really matter which one.

The goal should be to give our codebase a very good idea about "is this request well formed?", since we're no longer going to get this validation from the vendor sub-system itself during our automated tests.

And then once we have that contract, which provides a strong sanity check that "we've asked the vendor system to do X" is a fundamental operation that they support, we can use stubs to flush out naive/just-enough-to-work behavior to verify "does our system handle the response for request X correctly?"

As a short intro, stubs are basically in-memory versions of vendor sub-systems that you yourself write and maintain. So if your gateway layer has a `CreditCardApi` interface, you would write your own, that looks something like:

```java
interface CreditCardApi {
  void charge(String number, int amount);
}

// Real implementation that makes API calls
class VendorCardCardImpl implements CreditCardApi {
  void charge(String number, int amount) {
    // make wire call to vendor
  }
}

// Stub implementation that does in-memory logic
class StubCreditCardImpl implements CreditCardApi {
  private List<Account> accounts = ...;

  void charge(String number, int amount) {
    Account a = findAccount(number);
    a.charges += new Charge(amount);
  }
}
```

I have an older, longer [post on mocks vs. stubs](/2010/07/09/why-i-dont-like-mocks.html), that goes into more details, but focusing on the cross-system testing aspect, there are several pros/cons:

* Pro: We have achieved data isolation, as only our test will use the `StubCreditCardImpl`'s internal state.

* Pro: Our tests should become easier to read, because we now control the "world looks like X" step, as we can fabricate `StubCreditCardImpl`'s internal state to be whatever we need. Do we need a cancelled account? An account with a zero balance? These scenarios are now easy to produce on the fly, in code.

  For example:

  ```java
  void shouldHandleEmptyAccount() {
    // Given our user is out of cash
    stubCards.put("a1", new Account().setRemaining(0.00);
    // When our system tries to charge that amount
    system.doThings();
    // Then we handle the rejection
    assertThat(...);
  }
  ```

* Pro: Again see the article on mocks vs. stubs for more details, but particularly for integration tests, stubs are much more usable than mocks because they are stateful.

  This means they can more naturally handle a longer-running integration-style test like "start out with no accounts", "load the first page and make an account", "now see the account get returned", which are typically very tricky/verbose to setup with mocks.

  (Mocks are more suited for in-the-small unit testing; although pedantically stubs can work well there as well.)

* Con: We have to write the `StubCreditCardImpl` ourselves.

  I have another post about [vendor services providing stubs out of the box](/2013/04/13/services-should-come-with-stubs.html), but unfortunately that rarely happens.

  So, you have to weigh the ROI of "investment in making stubs" vs. the "return of a super-reliable test pipeline".

So, if you put these two things together, a strong contract + good-enough stubs, I assert you'll get 80% of the benefit of cross-system integration tests, with 20% (or less) of the pain and suffering that comes from not having data control and isolation.

But That Doesn't Test If It *Really* Works?
-------------------------------------------

The biggest objection to this approach is we don't *really know* if our cross-system interaction works, e.g. what if we try to charge $1000, and the vendor's API blows up anytime the amount is greater than $900?

Our testing approach of a documented schema/contract + stubs will never catch this!

That is true, but I have two rationalizations: the first is syntax vs. semantics, and the second is compensating with quality and agility.

##### Vendor API Syntax vs. API Semantics

To me, you can think of our vendor requests as having two aspects:

1. Stateless "syntax", e.g. is this a well-formed request?
2. Stateful "semantics", e.g. does this specific request work given this specific state?

Per the previous section, the first aspect, the syntax, we have ideally covered at compile/build time by using a strongly-typed schema/contract. So we're good there.

For the second, my articulation of this aspect, semantics, is "does the *contents* of our requests, given various 'world looks like X' input conditions, pass the business rules of the vendor system?"

When worded like this, what we're basically asking is, "will all of our requests pass all of the semantic/business validation rules of the vendor's system?"

I have an interesting rationalization, that admittedly borders on a dodge, which is that it's very unlikely that we're going to really cover all of the business rules.

For example, they might have 100 business rules around saving a credit card. Name checks, address checks, credit checks, etc. Are we really going to test every single one? Probably not. Even if we wanted to, our cross-system integration suite would grow into the 1000s of tests (which I have seen before), and become a nightmare in turns of runtime.

Also, even if we thought we could cover all of them, given they are a vendor API, they can make their own releases, and add more business rules for saving a credit card, anytime they want, without telling us. (Granted, vendors often communicate breaking changes, but those are *syntax* changes, e.g. we removed field `X`, and it's very easy and common to slip in new *semantic* rules, e.g. existing field `X` now must pass business rule `Y`, without communication or a grace period.)

So, given we won't cover all business rules, and they can add new business rules at any point in time, what is the best we can do?

We can:

1. Make sure we handle success, and
2. Make sure we handle failure, which is any business rule failing.

As long as we handle these two scenarios, the happy path and a general failure case, our system should basically work. And we don't need to test, as in a cross-system, makes-a-wire-call integration test, each individual semantic variation of "it could return card not found" or "it could return bad address" on every single test run.

Note that I don't mean we should just throw random data at the vendor API. Obviously our system has to to it's own miniature mental-model the vendor's expected semantics, e.g. "a $10 charge when the balance is $5 will fail".

We need to build that mental-model of the vendor's expected behavior into our system, and we do, but we can assert that we play within those semantic boundaries with our unit tests and our stub-based integration tests. We don't need physical wire call verification of them every single time, because they will rarely change.

And if they do change, we will find out quickly, adapt our unit and/or stub-based tests to encode that new aspect of their semantic mental-model, and continue. Which is basically the next point.

##### Compensating with Quality and Agility

So, maybe you don't buy my argument that "you won't test all the semantics anyway, so don't bother". You want to try and still have some "no really, see, it works" cross-system integration tests.

The closing argument, for me, which is based on the systems that I've personally worked on, is that the systems *without* cross-system integration tests end up being higher quality in the long run.

This is because:

1. Their test suites use the given/when/then "world looks like X" convention, so copy/pasting a "world looks like X" test into a "world looks like Y" test is very quick and simple, so reproducing production bugs is very quick. You're testing infrastructure is already there and easy to use.

   In a cross-system environment, per previous sections, reproducing a production bug with a slight variation of an existing test's data is tedious and time-consuming.

2. Their build pipelines are typically super-fast and super-reliable, so after the production issue is reproduced and fixed, it's very quick to get a release out.

   In a cross-system environment, cross-system integration tests typically make more/slower wire calls, and coupled their inherent flakiness, either slow down (as in wall clock time) or slow down (as in false negatives and ensuing manual investigation/reruns) the release process.

3. Their tests, with predominantly unit tests and some intra-system integration tests, are fast and stable enough that developers feel empowered to ruthlessly refactor, maintaining a high quality bar, which overtime means production bugs stay quick to diagnose and fix.

   (Admittedly, intra-system integration tests make wire calls as well, so this point, for me, is based more on observation and correlation than direct causation.)

The combination of these two factors (API syntax vs. semantics, and compensating with quality and agility) is why I feel confident, for the projects I'm leading and personally responsible for, having no cross-system integration tests.

Who is a Vendor?
----------------

So, hopefully you're following my logic so far and basically in agreement that, sure, if our in-house system integrates with credit card Vendor X (e.g. Stripe or First Data or whoever), we should not couple our test suite and release process to their shared sandbox/integration environment. That's just asking for trouble.

But my next musing, which is admittedly more/only applicable to larger companies, is: who do you treat as a vendor?

In the example used so far, the external credit card processing vendor, that is a pretty obvious line to draw around "a vendor".

But what about an internal team that you're working with for a new project? They're providing a `FancyFooService` API to you. Are they a vendor?

I think the traditional temptation is to say no, they're not a vendor, they're an internal team, and we can easily access their systems in our dev/test environment, so let's make really sure our flows work, and write integration tests that makes real wire calls to their `FancyFooService` implementation.

Unfortunately, even though the team/their sub-system is internal, this rarely means you actually have *control* of their sub-system, using our definition of control from earlier.

Specifically: is your test data isolated from other systems and other tests?

If this is an internal shared environment (e.g. every system in the company runs in kind of a shadow-production environment), the answer is no, your test data is shared with all of the other systems and all of the other tests.

You don't have control or isolation.

So, all of my assertions so far, about test complexity and flakiness and system availability, which hopefully led to an obvious conclusion "of course that applies to the external vendor" **now also apply to the internal, in-house "vendor"**.

This system has effectively become a vendor to you.

**Which means you should not write any automated tests against it.**

Making Life Easier
------------------

I have made a lot of points, but besides just pontificating about "throw out all your cross-system tests", I wanted to offer some suggestions to alleviate the pain.

Specifically, if you approach a stubs-based approach to intra-system testing, I think there are two things that can make life easier:

1. Use a unified RPC framework across the entire company
2. Prefer noun-based RPC frameworks
3. Services should ship their own stubs

##### Unified RPC Framework

When you're writing infrastructure to stub (or mock if you must) vendor systems out, you'll get a much higher ROI if you can do that just once.

E.g. instead of writing infrastructure for faking Thrift for some vendor sub-systems, and infrastructure for faking GRPC for some vendor sub-systems, and infrastructure for faking SOAP for others, and infrastructure for faking bespoke JSON/HTTP for others, you can write a single infrastructure and invest heavily in making it powerful and easy to use.

Obviously Google has done this by using "protobuf everywhere" internally. At LinkedIn, we use "Rest.li everywhere" internally.

If you're in a larger company, that is more than ~10 years old, it's very unlikely that you have this, and admittedly obtaining this is going to be a nightmare. Unfortunately, I have no good ideas for you.

But if you're *starting* a larger company, then choose one and only one up front.

##### Prefer noun-based RPC frameworks

If you have the luxury of choosing an RPC framework, I've found noun-based systems to work better than verb-based systems.

Specifically something like GRPC is a verb-based system, where you make up new verbs of `CreateAccount`, `MakeDeposit`, `DeleteAccount`. All of these are just method calls, that GRPC handles the serialization/etc. for you. Which is fine.

But noun-based systems, e.g. REST (props to [Rest.li](http://rest.li)) and [GraphQL](http://graphql.org/), have a fixed set of verbs, e.g. `PUT`, `GET`, `UPDATE`, that is basically fixed, and then `N` nouns, e.g. `Account`, `Deposit`, etc.

I can't believe it's from 2006, but see Yegge's post [Execution in a Kingdom of Noun's](https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html) for more information.

But, specifically for building infrastructure to fake cross-system integration tests, if you have a noun-based architecture, it becomes really nice and generic to setup cross-sub-system data in a generic way.

E.g. all a test has to do is create the nouns it wants, "make a new Account that looks like this", "make a new Deposit that looks like that", and then defer to your generalized infrastructure to put each noun into it's corresponding stub.

A real-but-edited example is:

```java
public void testWithOneUser() {
  // given a single user
  user = new UserBuilder();
  account = new AccountBuilder().withAdmin(user);
  system.setup(user, account);
  // when
  ...
}
```

Where the `User` noun and `Account` noun are from two completely separate "vendor" sub-systems, e.g. the user API which is owned by internal team X, and the account API which is owned by internal team Y.

The fact that our inter-system RPC is all noun-based two great outcomes:

1. The "noun looks like X" is basically verbatim what my best-practice "given" section looks like for "world looks like X", and
2. Once the test infrastructure supports the fixed set of verbs, e.g. `GET`, `PUT`, etc., it can scale really well to `N` nouns.

##### Services should ship their own stubs

One final thing that would make life easier for adopting a stub-based approach to fake cross-system integration tests would be if you as a consumer of the vendor API didn't have to write your own stubs in the first place.

I wrote about this [back in 2013](/2013/04/13/services-should-come-with-stubs.html) (although, sheesh, 2006, Yegge's still got me), but to me it makes a lot of sense for owners of the vendor API to write their own stubs, and provide them to their users as a convenience.

This has two benefits:

1. It amoritizes the cost of writing the stubs by having it done once, and then shared across N downstream users
2. The vendor API owners are the ones who best know their API, so can make their stubs match (within reason) the production run-time behavior.

For a concrete example, I think it makes a ton of sense for AWS to ship a stubbed version of it's aws-java-sdk. They already have interfaces for `S3Client`, `DynamoDBClient`, etc. How many of their users could write super-effective test suites by using an in-memory `StubS3Client` or `StubDynamoDBClient` that did a best-effort mimicking of production?

I think it'd be incredibly useful. Such that at Bizo, we started doing this, by writing/open sourcing our own [aws-java-sdk-stubs](https://github.com/bizo/aws-java-sdk-stubs) library, which we used liberally internally, but unfortunately has not seen a ton of adoption otherwise.

One admitted wrinkle is that typically stubs are written as in-process/in-memory implementations, e.g. "just use an in-memory map" in whatever your primarily language is. And for a vendor like AWS that supports N languages, it would suck to provide N stub API implementations. One solution is to still write a local/fake version, but use wire calls to cross process/language boundaries, which is exactly what AWS does with [DynamoDB Local](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) and I'd done for the old-school [simpledb](https://github.com/stephenh/fakesdb).

Conclusion
----------

Wrapping up, this is probably my longest post to date, but I've tried to comprehensively address the topic, as I've been thinking about it a lot lately. 

Well, shoot, I don't really want to add another section for this, but I am fully supportive of developers being able to touch a vendor's shared integration system, or even touch the vendor's production system, to do initial "how does this really work?" exploration, trouble shooting, and debugging.

And having this sort of "debug-on-demand" cross-system/cross-vendor infrastructure to make exploration and debugging easy is a good, worthwhile investment.

But my main point, which hopefully I've articulated well and convinced you of, is that cross-system, cross-vendor infrastructure should not bleed over into automated tests, as without the fundamental first princples of data control and data isolation, I assert you're building on a shaky foundation, and your effort is better spent elsewhere.

(**Update July 2018**: The Google Testing blog has a post, [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), which covers some of the common failure scenarios for end-to-end tests, as well as points out how slow their feedback loop is (such that they become cascading failures of "rarely is everything green"), albeit they end up recommending the same "testing period" approach, vs. my more draconian stance.)

