---
title: The Futility of Cross-System Integration Testing
layout: draft
---

{{page.title}}
==============

I've been forming an opinion for awhile now that is potentially eyebrow raising, but that I'm now basically convinced of: that cross-system integration testing is not worth it, and in most projects is actually an anti-pattern.

Terminology
-----------

First, a mea culpa that "cross-system" as an adjective to integration testing seems, for traditional usages of the term, very redundant.

E.g. "integration testing" is de facto cross-system. That's the "integration". Obvious.

But I think there is some slight nuance, mostly around sphere of influence.

Let's take a typical webapp, and it has various components:

* Frontend of HTML/CSS/JS
* JSON REST APIs for the frontend to call
* Database layer for REST APIs that persists data to MySQL
* Gateway layer for REST APIs that calls 3rd-party systems (e.g. vendors like a credit card API)

For me, I assert there are two flavors of integration testing:

1. Intra-system integration testing.

   This is integrating (as in starting real versions of) the various sub-systems within the overall system I control, so real-frontend + real-REST servers + real-MySQL database.

   For me, I definitely want to have "intra-system" integration tests that stand all three of these up, and do some happy path testing, e.g. Selenium tests (not a ton of them, but some), to make sure things work well across the stack.

2. Inter-/cross-system integration testing.

   This is integrating the above sub-systems (real-frontend + real-REST + real-MySQL) *plus* the real-vendor system that the gateway layer talks to.

   These are the tests I want to avoid.

So, just to highlight, the differentiation between these two flavors is control:

* Intra-system testing == only sub-systems I control
* Cross-system testing == all sub-systems, even those outside my control

What Do You Mean By Control?
----------------------------

So, continuing with terminology, and now focused on control, by "control", I mean two things:

1. Are my interactions with the system completely isolated, and
2. Can I nuke/pave the system's data whenever I want?

These are basically data isolation and data control: if my test runs, will it see data from other systems or other tests?

So, let's evaluate this against each of our sub-systems:

* For the frontend HTML/CSS/JS, is my test data isolated from other systems and other tests?

  Yes: each selenium test has its own browser so its own cookies, local storage, etc., so it's effectively isolated from the others.

* For the REST API, is my test data isolated from other systems and other tests?

  Yes: REST APIs are typically stateless, so np.

* For the MySQL database, is my test data isolated from other systems and other tests?

  Depends: if I create my very own MySQL database, *and* only run a single test at a time, *and* nuke the data between every test, then yes, I have data isolation for the tests.

  (Alternatively, if my app already supports sharding, maybe I don't have to nuke the entire database, and instead each test gets it's own shard, but the effect is the same.)

  Basically, because I own this sub-system, I can do whatever gyrations (dedicated, frequently nuked db) I need to get isolated data.

* For the vendor API, is my test data is from other systems and other tests?

  Typically not at all.

  I've worked with great vendors and terrible vendors over the years, but even the best vendors have never had a test/integration system that gave me 100% data isolation. There is basically never a way to reset the data in their integration systems.

  Here is where it becomes obvious I don't own this sub-system: I can't hack on it to setup the data isolation I need.

Why Does Control Matter?
------------------------

So, we've established that control is about which sub-systems whose persistent data is at your whim. But why does that matter?

**Because any automated test that touches a system/sub-system who's data is outside of your control is going to suck.**

A baseline, non-negotiable, requirement for effective tests is the ability to control their data.

If the test cannot control it's data, you are risking two very bad things:

1. Test Flakiness
2. Test Complexity
3. System Availability

I'll drill into each.

#### Test Flakiness

Lack of isolation means it will be very easy for "other things" to break your tests. Where "other things" could be other systems, or internal users just harmlessly poking around, or even your tests themselves.

For example, you setup a test account in your vendor's system. You have ~100s of tests using it, and then the vendor decides to nuke the database. Your tests now all break.

Or you have ~100s of tests using it, and one of your own tests causes it to tip over the limit (e.g. maybe every test run only creates data, but cannot delete it), and now the test account is locked/broken.

I have worked with systems that have automated tests that use shared data, and it invariably happens that "something else" pokes the data, and tests break.

When tests break, especially repeatedly for the same core reason, developers quickly get frustrated, become disenfrancised, and the tests themselves and your culture around TDD will start to suffer.

You must have 100% data isolation from day 1, or your building on quicksand.

#### Test Complexity

Besides flakiness, which is actually more paramount, even if you *think* you can build around the above issues, invariably tests that cannot control their data are just inherently complex.

For example, my gold standard of a test flow is a cadence that looks like:

* Given the world looks like X
* When action Y happens
* Then the world looks like Z

In tests where "the world" is not in your control, and so does not start at empty for each test, "looks like X" starts to become a nightmare.

Most frustrating for me is that, often times, "world looks like X" is no longer specified directly in the test. E.g. for me "like X" is something like "is an account for type X with flags Y and Z set". But if the world already exists, this is often "use test account id 50". A reader of the test is left wondering "...what is so special about account 50? What flags does it have set? How do I re-create it if needed? By hand?"

Or, for example, you might try to invent ways to pretend you have data isolation, by making a new test account in your vendor's system for each test.

Or you might try to have a clean-up routine, that uses some of the vendor's delete APIs to re-delete what you just created.

But, whatever you attempt, it's a very slippery slope away from "tests that are actually simple to read and maintain", because you've know introduced a slew of cognitive overhead and compromises the long-term simplicity, readability, and reliability of your test suite.

#### System Availability

I added this one later, as it's not around data, which for me is the key to great tests, but just system availability.

E.g. if your automated tests are part of your CI/deployment pipeline, and your vendor's system goes down for maintenance, what do you do? You can't release? Whatever if your vendor also uses their integration system for beta testing, and regularly pushes out bugs? Their bug means you can't release.

(Granted, there are assertions that this is precisely the point of integration testing, but I'll muse about that later.)

If you limit your integration testing to intra-system sub-systems, you de facto have 100% control over their availability, and so will have the most resilient automated tests.

**tldr: You need data control and isolation or your automated tests will suck so much you just shouldn't write them.**

What Do We Do Instead?
----------------------

If we give up on cross-system integration testing, of touching their real sub-system during our CI/deployment system, obviously we still want to have *some* amount of test coverage of our interactions with them. What should that look like?

To me, the best answer is two things:

1. A well-defined contract between the two systems, and
2. Stubs implementations of that contract.

A well-defined contract is basically documenting the vendor sub-system's API in some sort of schema: [protobuf](https://github.com/google/protobuf) or [Thrift](https://thrift.apache.org/) or [Swagger](https://swagger.io/).

The goal should be to give our codebase a very good idea about "is this request well formed", since we're no longer going to get this validation from the system itself during our automated tests.

And then once we have that contract, which provides a strong sanity check of "we've asked the vendor system to do X", we can use stubs to flush out naive/just-enough-to-work behavior to verify "does our system handle the response for request X correctly?"

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

I have an older, longer [post on mocks vs. stubs](/2010/07/09/why-i-dont-like-mocks.html), that goes into more details, but focusing on the cross-integration testing aspect, there are several pros/cons:

* Pro: We have achieved data isolation, as only our test will use the `StubCreditCardImpl`'s internal state

* Pro: Our tests should become easier to read, because we now control the "world looks like X" step, as we can fabricate `StubCreditCardImpl`'s internal state to be whatever we need. Do we need a cancelled account? An account with nothing remaining? These scenarios are now easy to produce.

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

* Pro: Again see the article on mocks vs. stubs for more details, but particularly for integration tests, stubs are much more usable than mocks because they are stateful, so can more naturally handle a longer-running integration-style test like "start out with no accounts", "load the first page and make an account", "now see the account get returned", which are typically very tricky/verbose to setup with mocks. (Mocks work much better for in-the-small unit testing.)

* Con: We have to write the `StubCreditCardImpl` ourselves.

  I have another post about [vendor services providing stubs out of the box](/2013/04/13/services-should-come-with-stubs.html), but unfortunately that rarely happens.

  So, you have to weight the ROI of "investment in making stubs" vs. the "return of a super-reliable test pipeline".

But That Doesn't Test If It *Really* Works?
-------------------------------------------

The biggest objection to this approach is we don't *really know* if our cross-system interaction works, e.g. what if we try to charge $1000, and their API blows up anytime amount is >$900? Our contract + stubs will never catch this!

That is true, but I have several rationalizations; the first is that you can think of our vendor requests as having two aspects:

1. Stateless "syntax", e.g. is this a well-formed request
2. Stateful "semantics", e.g. does this specific request work given this specific state
3. ...The release velocity you'll get from a fast, stable CI pipeline means you can react to any new state combinations quickly...

Per the previous section, the 1st aspect, the syntax, we have ideally covered at compile/build time by using a strongly-typed contract. So we're good there.

For the stateful semantics, there are a few nuances:

1. In reality, there are a *ton* of these state-based semantics.

   Was the charge amount too high? Was the card number invalid? Was the account actually deliquent? Was our account name too long?

   My assertion is that very few cross-system integration suites actually cover the entire set of state-based semantics, because there are simply too many of them to cover, especially since cross-system integration tests are invariably slow.

   You would end up with 1000s of cross-system integration tests, and this is just not a good goal to be at; they will be too slow, too tedious, too flaky.

   And, really, the point is that we don't *have* to cover these. For the best resiliency, our system should not have to be hard-coded to handle each 1000 of these failure scenarios. We should be coded to handle success and handle failure.

   As long as we handle failure elegantly, it should not matter if the semantics of the API request failed for business rule #3 or business rule #250. Either way, they failed.

2. That said, we *can* test the subset of state-based semantics that we care about by encoding behavior we specifically care about into our stubs.

   For example, if you've fought for 2 hours finding a bug that happens with the vendor API, and you really want to make sure no one in our system forgets this, you could code a unit test for it, but then you could also add this surprising behavior into the stub itself, e.g.:

   ```java
   // Stub implementation that does in-memory logic
   class StubCreditCardImpl implements CreditCardApi {
     private List<Account> accounts = ...;
 
     void charge(String number, int amount) {
       Account a = findAccount(number);
       // this was very surprising
       if (accountHasSurprisingThing(a)) {
         throw new Exception("This was bad");
       }
       a.charges += new Charge(amount);
     }
   }
   ```

   Granted, we have to pay the cost of maintaining our stub, so we do not want to shoot for 100% production fidelity. If a vendor has 100 business/validation rules, we shouldn't need to recode all 100 in our stub; we just need to add the most surprising ones (to us).

Who is a Vendor?
----------------

One interesting musing, especially in larger companies, is: who do you treat as a vendor?

In the example used so far, e.g. a credit card processing vendor, that is a pretty obvious line to draw around "a vendor".

But what about an internal team that you're working with for a new project? They're providing a `FancyFooService` API to you. Are they a vendor?

I think the traditional temptation is to say no, they're not a vendor, they're an internal team, and we can easily access their systems in our dev/test environment, so let's make really sure our flows work, and write cross-system integration tests.

Unfortunately, even though the team/their sub-system is internal, this rarely means you actually have *control* of their sub-system, using the definition of control from the earlier section.

Specifically: is your test data isolated from other systems and other tests?

If this is an internal shared environment (e.g. every system in the company runs in kind of a shadow-production environment), the answer is no, your test data is shared with all of the other systems and all of the other tests.

You don't have control. So you should not write any automated tests against it. This system has effectively become a vendor to you.

Making Life Easier
------------------



