---
date: "2018-08-07T00:00:00Z"
section: Testing
title: Integration Test is a Useless Term
---

{{page.title}}
==============

I feel "integration test" as a term has become less useful (which is admittedly somewhat harsh and clickbait-y, I could also say fuzzy) because it means different things to different people.

Meaning different things to different people is basically the opposite of shared language / Domain Driven Design's [Ubiquitous Language](https://www.martinfowler.com/bliki/UbiquitousLanguage.html) and leads to miss-communications and unclear thought when using the term.

Similarly, "unit test" can also mean different things to different people, albeit to a lesser extent than "integration test".

Within previous teams, we would generally/organically come to loose agreement on what those terms meant to us, but obviously then we have to start over when talking to new people, and it wasn't that formalized. So I thought I'd take a shot.

Starting Over: Fast vs. Slow
----------------------------

Instead of first describing what is wrong with "integration test" as a term, i.e. its multiple meanings, I thought I'd first start from scratch with the [MECE](https://www.caseinterview.com/mece) scaffolding that I have in my head.

The primary distinction I make is "fast tests" vs. "slow tests".

Specifically:

* Fast tests are RAM-only and no I/O.

  Since they touch no HDDs or SSDs or sockets, they are very fast.

* Slow tests use I/O.

  Since they touch files on the file system or more likely a database connection or a REST API, they are slow (this can be mitigated by local-only I/O, but I'll punt on that for now).

Admittedly, there are multiple ways to articulate this dimension ("fast vs. slow", "I/O vs. no I/O", "RAM vs. disk", etc.), and I don't have an obvious favorite, but they're all essentially the same.

(Pedantically, since RAM tests can be slow (e.g. if you have many loops/iterations) and I/O tests can be fast (e.g. if you use local resources), the terms "fast" and "slow" are potentially misnomers, but I don't really like "I/O vs. no I/O" or "RAM vs. I/O" in terms of rolling off the tongue, so I'll stay with "fast vs slow" for now.)

Next dimension: Controlling Input
---------------------------------

The next dimension I think about for tests is "can you control the input?", which is pretty simple:

* Controlled input means you can run the system-under-test against exactly the state you want.

  Ideally this state is very small and very deterministic; both of these properties lead to easy comprehension, code reivew, and maintainability.

* Uncontrolled input means you have to run the system-under-test against state you cannot control.

  This means the tests must be either coded defensively to handle the input changing, or make typically-verbose copies of the input (e.g. record/reply tests).

What's interesting is this dimension already maps fairly close to the previous dimension of "fast/RAM" vs. "slow/I/O", but with a few wrinkles. So let's combine these two characteristics (fast/slow and controlled/uncontrolled) into a quadrant (someone give me an MBA):

* Fast/controlled: you setup data structures in RAM, no problem
* Fast/uncontrolled: ...what?
* Slow/controlled: you setup isolated I/O on disk/database/network
* Slow/uncontrolled: you use shared I/O on disk/database/network

What falls out is the "fast/uncontrolled" option. **It's basically impossible to write fast/RAM tests that are uncontrolled** (...okay, aside from testing concurrency, and assuming good testing habits). By definition the process needs your test, and your test only, to define the input that is passed to the system-under-test.

However, the slow/controlled and slow/uncontrolled distinctions are quite important, and we'll talk about those more later.

Next dimension: Number of layers
--------------------------------

There is one more dimension that is useful: how many layers are covered by the test.

For simplification, I'll use just "single-layer" vs. "multi-layer", although it is really `N` layers for whatever your given `N` is.

This increases our matrix to 8 permutations, however not all of them are valid, e.g.:

* Fast/controlled/single-layer: valid
* Fast/controlled/multi-layer: valid
* Fast/uncontrolled/single-layer: ignore because fast/RAM rams are inherently controlled
* Fast/uncontrolled/multi-layer: ignore for same
* Slow/controlled/single-layer: ignore because slow/I/O tests are inherently multi-layer
* Slow/controlled/multi-layer: valid
* Slow/uncontrolled/single-layer: ignore for same
* Slow/uncontrolled/multi-layer: valid

So, after dropping the ones that don't make sense (e.g. assume all slow/I/O tests are multi-layer), we're left with four primary combinations:

* Fast/controlled/single-layer
* Fast/controlled/multi-layer
* Slow/controlled/multi-layer
* Slow/uncontrolled/multi-layer

Finally: What Are "Integration Tests"
-------------------------------------

So, the rub with "integration test" as a term is that it can legitimately describe 3 of the 4 options, specifically any of the "multi-layer" options:

* Fast/controlled/multi-layer "integration tests" can be cross-unit/cross-layer but still RAM-only tests within a single project. E.g. maybe testing your view layer with your presenter layer (but no physical device/browser), or your controller layer with your repository layer (but no I/O to the database).

  (FWIW, I think this category is actually misuse of the term "integration test", but it exists in public usage, e.g. Ember's "integration tests" are really cross-layer RAM tests.) 

* Slow/controlled/multi-layer "integration tests" are I/O tests that use the project's "owned" I/O source(s). E.g. like typical database-driven tests (Rails ActiveRecord or Spring JPA/Hibernate) that use the project's local MySQL/Postgres database and can create/destroy data for each test.

* Slow/uncontrolled/multi-layer "integration tests" are I/O tests that use "unowned" I/O sources. E.g. calling microservices that are ran by another team or vendor, which almost always means our local/CI testing environment cannot automatically create/destroy test data.

All three of these "integration tests" definitions have very different characteristics:

* Fast/controlled/multi-layer tests are great: they're fast! The more layers, the better.
* Slow/controlled/multi-layer tests are okay: they're slow but at least deterministic.
* Slow/uncontrolled/multi-layer tests are terrible: they're slow and **always flaky**.

And so the problem is, when I say "integration test", what do I mean?

Note that I've heard "end-to-end" used as a potential discriminator, but it also fails: for some projects "end-to-end" can be controlled I/O all the way through (typically monoliths), but others, "end-to-end" is almost by definition uncontrolled I/O (typically microservices).

My Proposed/WIP Terminology
---------------------------

Given this potential ambiguity, what I've personally been using (...or will start, see disclaimer) using for terminology is:

* "Unit test" is anything that is fast/RAM-only, e.g both fast/single-layer and fast/multi-layer. Granted, having subset terms, e.g. "widget unit tests" or "validation unit tests" or "component unit tests" is useful (this is what Ember was trying to do when they appropriated "integration test"), but I'd still roll them all up into "unit tests". This is somewhat imprecise, but I think matches common usage.

* "Internal system test" means slow/I/O that we control (slow/controlled/multi-layer). Previously I'd called this "intra-system integration tests", but that was a mouthful and continued to use the ambigious "integration" test term, just with an extra modifier. Granted, "internal" is a modifier to "system" (where "system" == "I/O"),  but it is more succint and seems cute.

* "Cross system test" means slow/I/O that we don't control (slow/uncontrolled/multi-layer). As I mentioned before, this is probably what "end to end integration tests" means to most people, but that doesn't specifically capture controlled-ness, and for me that distinction is too important to ignore. Previously I'd called this "cross-system integration tests" (e.g. how [they suck](/2017/08/23/futility-of-cross-system-integration-testing.html)), but that was also a bit too long.

  (I considered calling this "external system test", as "external" is the opposite to "internal", but "external" can trick people into thinking "external systems are only those outside my company, so within the company we should have a giant end-to-end suite", when really in microservice orgs "external to your system" can actually include "teams you sit right next to".)

  (I am also setting up "unit" == "fast/RAM" and "system" == "slow/I/O" as orthogonal terms. I think previously "integration" might have meant "I/O" but, per previously, it can be taken to be mean "integration of units in RAM".)

As the ironic disclaimer, I've actively refined these terms while writing this post; previously I'd been using longer/more annoying terms, but writing them up as-is highlighted their awkwardness. So I refined them a bit. Which I think is exactly the point of writing things up: it clarifies your thinking.

As a huge disclaimer, I'm sure "system test" has been used for years, so I'm not proposing anything new/unique; but within the circles I converse anyway, "system test" seems unused enough that I'm going to co-opt it to mean what I want it to mean (I/O) (which perhaps it already meant for other people; hopefully it does not mean other things for other people, or if so hopefully it's a small minority that won't mind too much).

I also have more thoughts on the fast/single-layer and fast/multi-layer dichotomy, but I'll save that for another post.

If you like this topic, I've written several other posts about integration tests (mostly that they suck), albeit with my prior terminology:

* [The Futility of Cross-System Integration Testing](/2017/08/23/futility-of-cross-system-integration-testing.html) is how slow/uncontrolled/multi-layer tests should be avoided at all costs (with perhaps very slight exception for less than 10 smoke tests).
* [Skepticism About Record/Replay Tests](/2018/06/20/skepticism-about-record-replay-tests.html) is my raised-eyebrow around trying to paper over the uncontrolled aspect of slow/uncontrolled tests by recording results.
* [Microservice Testing At Scale](/2018/01/21/microserving-testing-at-scale.html) is armchair musing about clawing the traditional slow/uncontrolled microservice testing mess within a large engineering org (e.g. that is large enough to need/afford/build the bespoke tooling) into the slow/controlled cell by replacing or stubbing I/O higher up the stack.


