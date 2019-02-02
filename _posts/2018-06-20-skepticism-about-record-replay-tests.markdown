---
layout: post
title: Skepticism About Record/Replay Tests
section: Testing
---

{{page.title}}
==============

I don't like record/replay test frameworks, e.g. [VCR](https://github.com/vcr/vcr) in Ruby, this new [Polly.js](https://netflix.github.io/pollyjs/#/) from Netflix, and a similar server-side framework that LinkedIn used internally for [Rest.li](https://github.com/linkedin/rest.li) called RTF.

I've been mulling over my gut reaction to them for awhile, and finally got around to writing it up.

I get why they *seem* great:

* Instead of hand-writing mock/stub code, you just record whatever production does today. Insta-test!
* While in replay mode, you're "isolated from production flakiness" and the tests run more reliably and faster.

However, to me, this initial allure is basically lip stick on a pig.

These are really cross-system tests
-----------------------------------

To me, record/replay means you're running cross-system automated tests.

I use the term "cross-system" because record/replay is a tell that you can't control/isolate the upstream data source (the one that you are recording against).

Because if you could control/isolate the upstream data source (e.g. reset it for each test case, and give each test its own specifically-crafted test data for that use case), surely you would, because controlled/isolated tests are much more reliable, deterministic, and easier to understand than running against ever-changing production/staging databases.

Basically, controlled/isolated tests are not flaky (at least fundamentally so), and given the primary reason for moving to record/replay is "reduced flakiness", the fact that you have flakiness to move away from logically insinuates you're testing against a system you don't control.

I have a [longer post](/2017/08/23/futility-of-cross-system-integration-testing.html) on this, but basically I don't think the developer-time investment in any cross-system testing is worth it.

But I'll expand a bit on record/replay in particular.

Recording is always manual and sucks
------------------------------------

So, I get why the replay phase sounds sexy cool, but I think people overlook that the record phase is fundamentally broken.

This is for both of the recording use cases (initial recording and re-recording):

1. Your initial recording requires manually-configured production/shared data (in whatever upstream system you're recording against), e.g. to setup "the world looks like X" as a precondition for your test case.

   This is tedious and slows down developer velocity, and stays a constant large cost/drag (e.g. it does not get easier/cheaper as the project scales, and if anything gets worse).

   As a developer, I don't think I could bring myself to "click click click" setup the ~2, ~5, ~10+ entities that are necessary for *each* test case I'm working on, without some sort of automation.

   And note that the details of this initial recording (e.g. what exactly the developer clicked in the production UI) is extremely isolated knowledge, because it is not documented anywhere: it's not in the test (ideally in the code as Given in [Given/When/Then](/2017/11/28/given-when-then.html)), it's probably not in a ticket, it only exists in the developer's head.

2. Your re-recordings require re-divining what the initial recording's upstream state was (mentally tedious), mentally diffing that against what the upstream state is today (again mentally tedious), and finally massaging production back into that state by hand (physically tedious).

   E.g. after 6 months goes by, and the replay test fails during a refactoring, your replay isn't working (you're passing new data, or need new data back), so you need to do a new recording.

   Except now all the data in production has changed, so you're tasked with spending ~half your day figuring out how exactly you can massage production back to the boundary case that your test case is handling.

   And, per the previous point, what exactly that "world looks like X" was is not documented anywhere, so you just have to guess.

Both of these recording scenarios would be nails-on-chalkboard annoying for me, in terms of my local developer productivity.

Sure, "no one will touch the data"
----------------------------------

A typical mitigation for "re-recordings would suck" is to promise "no one will touch the data that we setup for/by the initial recording".

And, perhaps even more alluring, a proposal might be to setup the test data as global to all tests, and so the tedious click-click setup is "only done once" up-front, and is not an on-going cost.

These are nice ideas, but I think both are somewhat naive and do not happen in practice.

In reality:

* **Developers and testers** will invariably mutate the shared test data while poking around and debugging (we're all humans).

  Note this will happen even if you try to have each test have it's own test account, e.g. "test case foo uses employee #123"; invariably someone will nuke all the employees in the upstream system, or somehow wander into your test's "isolated" test data and muck it up.

* **Your system itself** will invariably mutate the shared test data as a by-product of normal operation.

  There are various ways this can happen, e.g. maybe a production batch process runs each night and processes new/pending data; your test data won't stay "unprocessed", unless you somehow whitelist it from processing.

  Or maybe two years goes by, and a system cleanup process ages off all your test data (to keep production data usage low); maybe you can remember to not run this cleanup process in staging, or somehow whitelist your test accounts. I have seen this happen.

* The **upstream system** will invariably mutate the shared test data.

  E.g. the upstream system's development team releases a new version to production, or staging, and the data migration mutates/nukes your hand-crafted state without realizing it will break your tests. I've had this happen.

* The **tests themselves** will invariably mutate the shared test data.

  Just by running the test that reads from production/shared data, means the test is very likely (either accidentally or purposefully) to also write production/shared data, which means it has self-corrupted its initial recording data.

  There are a few ways to "prevent" this:

  * Avoid testing mutation use cases (seems extremely limiting, and a test will invariably mutate something anyway)
  * Craft your tests' mutations to be additive/transitive (e.g. every test run appends a new transaction, but the test magically asserts against the just-added transaction).

  In my opinion/experience, neither of these work at scale.

Finally, if you attempt to have a "global, setup-once" test data:

* You'll invariably **need to cover a new test case** that your initial test data doesn't represent.
 
  When this happens, you'll have to juggle what to do: how much can you massage the existing global test data to handle your new test case, without breaking your previous test cases?

  Note that you can probably reason about this when you have ~5 test cases. You will not be able to reason about this when you have ~100 test cases.

  So, the safest thing is to leave all existing test data alone, and copy/paste a brand new test account/test employee/test whatever entity that is dedicate to your test. Which will be very tedious without automation.

  (I have technically seen, but not personally used, a system that vended new test users/accounts throughout the upstream system/ecosystem for every single test run. This is not a bad idea, but as far as I could tell, it had fallen into disuse, likely because a) it still didn't achieve isolation, b) it supported a small subset of data you'd need in the upstream ecosystem, and c) it was slow waiting for the test data to be created.)

So, tldr, I think it's naive to think test data will be "setup by hand once and then never changed" (either globally for all tests, or once per test); something will happen, and it will be a nightmare to keep your test data clean/stable as your test suite scales.

You won't know when test data is changed
----------------------------------------

Insidiously, whenever your initial-recording data is changed by one of the above methods, you won't know right away.

So you will have **inevitable, silent corruption** leak into your test suite over time.

Ironically, this is supposed to be a benefit to record/replay, as your test is happily churning away in replay mode every time CI runs. This is great!

...until you finally have to touch the test (e.g. while refactoring or adding a new feature in your system), and suddenly it's obvious that a ton of your upstream test data has changed, and creating updated recordings is going to take a non-trivial amount of your time.

And, note that you have no idea who/what/when/why the test data behind the recording is not what you expect.

Or, again insidiously, maybe the test data *is just fine* and you've broken the code while refactoring. Or someone broke the code a few weeks ago, but in a way that the replay version didn't catch/care about.

...which of these is it? Good luck finding out!

Reducing flakiness != Removing flakiness
----------------------------------------

So, record/replay promises reduced flakiness for your tests (and reduced stub/mock setup, which I'll address later).

However, to me, this is a half-truth, because it only "removes flakiness" from the replay mode, and, per the previous sections, **moves all of it into the record mode**.

None of the issues that cause flakiness (lack of control, lack of isolation, lack of availability) is fundamentally solved by record/replay, we just pretend it doesn't exist during replay, but still have all of the same pain, same tedium during record.

And, unlike a scalable solution like stubs/test DSLs, it will just get worse as you scale.

But continuous integration!
---------------------------

Another reason cited for record/replay is that we "have to have" integration tests (and that record/replay is the nicest/cheapest way of doing this, vs. hand-coding HTTP requests/responses).

This seems logical, but my depressing conclusion/assertion is that, no, we don't.

I say depressing because I'd love to have fast, isolated, controlled integration tests; they would be amazing. But those basically do not exist (short of [very fancy arm-chair infrastructure](/2018/01/21/microserving-testing-at-scale.html)).

I also have a side-tangent that record/replay is not really continuous integration, as it's only testing true "integration" during the record mode. And during replay mode, they are just regular, local-to-your-codebase regression tests. Which is fine, but regression tests are not integration tests.

That said, this can be mitigated by periodically forcing all tests to run in record mode (e.g. once per day, once per week), which provides you with an actual integration test signal on a regular basis. (My pessimistic comment is that, for all the reasons above, these periodic record-mode executions will have a number of false negatives, again due to fundamental lack of true isolation and control, and so become an annoyance rather than an assert.)

What to do instead?
-------------------

So, I've harped a lot on record/replay, and flippantly said "bah, who needs integration tests". Should we have no tests?

Of course not. I'm a huge fan of tests.

What I prefer is:

* Bake assumptions about the upstream system into a local abstraction.
  * For me, this is almost always some sort of fake/state-based version of the upstream service (stubs).
  * If possible, get the abstraction from [the upstream team directly](/2013/04/13/services-should-come-with-stubs.html)
* Bias your local abstraction towards [state over behavior](/2010/07/09/why-i-dont-like-mocks.html)
  * E.g. a test that says "upstream system has Employee X", run our code, "upstream system now has Employee X and Y" (state-based) is much more resilient than "we executed HTTP request with these headers and this body and this response" (behavior-based)
  * Granted, you need the low-level HTTP/etc. behavior for your code to exercise against, but you can hide this behind a well-written test DSL/abstraction layer. Or, even to the point of implementing your own "dumb" version of the upstream service.
* As the upstream system evolves, update your local abstraction.

Granted this approach sounds both: a) expensive and b) reactive.

Per expense, yes, it is usually expensive up-front to invest in a testing DSL/abstraction library. However, this cost **amortizes over time**.

E.g. as your codebase gets bigger, more of the tests will reuse more of the testing DSL/primitives that you've made. Basically, you have an abstraction, and so unlike record/replay with manually-massaged production data, which I assert **grows worse at scale**, testing DSLs **become better at scale**.

Per reactive, yes, that is true, but the reactivity, in my experience, is actually net faster than a "true integration test" approach.

Granted, I am cherry-picking, and `N = 1`, etc., but I've seen teams I've led that use "copy/paste unit test `testFooBar` to near-instantly reproduce the production bug" run circles around teams that had to muck with their integration environment for reproductions. Granted, there are other factors (we had a newer codebase, smaller team, etc.).

What about the testing pyramid?
-------------------------------

Invariably, every book on testing shows the pyramid of:

* Lots of fast/cheap unit tests
* Some more expensive "module tests" (or some other similar term that means "testing more than just 1 class at at ime")
* A handful of slow/expensive integration tests

I'm aware of that, and I preached it for a long time, and still do to a certain extent; but, per all reasons above, yes, I really am fine with dropping the "top" layer of the pyramid.

Well, slightly less draconian, if you do have integration tests, I think they should strive to have:

* a) automated, per-test data setup (e.g. make API calls to the upstream system to create a new account/user/etc. for your test),
* b) good-enough isolation to basically never stomp on each other,
* c) robustness in terms of race conditions (e.g. a way for the test to intelligently wait/block for backend changes to flush that is just not hardcoded `sleep` calls), etc.

Then you really can just run the real end-to-end integration tests on every test run.

Other misc cons
---------------

Other various things I don't like about record/replay:

* The downstream system cannot write any tests until the upstream production system is done.

  This forces an inherently sequential, waterfall development process that slows everyone down.

  If you're smart, sometimes the upstream production system will release dummy/no-op versions of their endpoints, so you can start poking at what their assumptions are, but if they are no-op, they are likely not useful for your record/replay tests.

  If you know the contract of the upstream service (e.g. it's REST API, grpc API, or GraphQL API), you should ideally be able to start coding against it immediately, before the true production, super-optimized, fault-tolerant version is done, but either consuming a fake/naive version from the upstream team, or writing one yourself.

* False negative test failures, similar to mocks vs. state-in/state-out.

  Because the record mode is generic, it records everything in very minute detail.

  So now any little protocol change (a new header, etc.) will likely break of your test recordings.

  Granted, "just re-record", but to me this is lots of noise in testing/code reviews/etc. that is not necessary.

  (A colleague reminded me that LinkedIn's internal RTF tool has a fuzzy-match capability, where if your recorded request is "close enough" to what the new execution's request looks like, it will continue using the recorded response. I admittedly do not know the details, but we agree this seems scary, as the fuzziness might be important. Granted, perhaps you can whitelist it only specific/innoculous headers/something.)

* Code reviews suck.

  When I see a record/replay PR go by, I have no indication of what the "world looks like X" test data is.

  This makes it hard to a) know what boundary case is being tested, and b) verify the developer correctly setup the boundary case.

  Instead I just have to trust/guess at what they clicked around and setup in the production/shared UI.

  In theory you could solve this by checking in scripts/automated code that setup the data, but the only context of record/replay is that you can't nuke/touch/massage the production/shared data in an automated way.

Conclusion
----------

I am perhaps overly harsh on record/replay. I can see it having a place, but it not should be a fundamental part of your testing strategy.

As always, my gold standard for tests is:

```java
public void testWhatever() {
  // Given the world looks like X
  ...make entity one...
  ...make entity two...
  ...make entity three...

  // When action happens
  ...system under test...

  // Then the world looks like Y
  ...assert entity one is now...
  ...assert entity two is now...
}
```

This is for unit tests, component tests, and integration tests: they should all try and look like this.

This is fundamentally not possible with record/replay, so I would personally have reservations basing anything "more than ~10 tests" (e.g. smoke tests), and definitely not "~1-2 record/replay tests per new system feature", on a long-term codebase because I don't think the net developer productivity/ROI would be higher than a more robust approach.

tldr: I think they make teams slower rather than faster in the long run.

