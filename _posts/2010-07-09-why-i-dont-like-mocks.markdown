---
layout: post
title: Why I Don't Like Mocks
---

<h2>{{ page.title }}</h2>

---

I am not particularly fond of mock objects. This gets me a few raised eye brows, given how wide spread their usage is these days.

The best I can do is link to Fowler's [Mocks Aren't Stubs](http://martinfowler.com/articles/mocksArentStubs.html) which does a great job of explaining state verification (stubs) vs. behavior verification (mocks) and the pros/cons of each. Typical Fowler, he does a great job of articulating what seems obvious in retrospect.

Nonetheless, I'll reiterate a few things.

State vs. Behavior
------------------

For tests, I care more about state than behavior.

If during `SomeFooTest`, method `foo(1, 2)` got called or `fooBar(3, 4)` got called, I don't think the test should care as long as the desired output/state was reached.

This will result in a test that is less brittle to refactoring, as typically any given test's input/output conditions won't change (think of them as requirements, stable, at least while refactoring), but how your program derived the output will.

I read once of an XP project that was extreme about unit tests, but that they'd reached a point where their tests were a burden. Always breaking and requiring lots of effort to refactor. My jumping-to-conclusions, probably-wrong, but I'll throw it out anyway, hunch is that they had mock tested lots of the small, detailed behavioral interactions between classes. So each time the big picture changed (a new feature was implemented), they had myriads of nit-picky behavioral tests to go fix.

Higher Level of Testing
-----------------------

This leads to another point, that stubs allow you to test at a higher, courser level of detail than mocks.

This pushes your unit tests towards being more like integration tests. Which, as long as speed is not sacrificed, I find preferable because then your unit tests are closer to testing customer-specified input/output conditions, and not just the implementation details of your current class design's approach.

In Fowler's words:

* *"In essence classic xunit tests are not just unit tests, but also mini-integration tests. As a result many people like the fact that client tests may catch errors that the main tests for an object may have missed, particularly probing areas where classes interact. Mockist tests lose that quality. In addition you also run the risk that expectations on mockist tests can be incorrect, resulting in unit tests that run green but mask inherent errors."*

The primary reason stubs facilitate higher-level testing is that mocks, in my opinion, become too complex, verbose, and repetitive to setup and verify scenarios that are not trivial, 1-level of calls.

For example, say you have a `IClient`, and need to get an `IEmployee` from that and then a `IAccount` from that.

This would look something like:

    IClient client = mock(IClient.class);
    IEmployee ee = mock(IEmployee.class);
    IAccount a = mock(IAccount.class);
    when(client.getEmployee(1)).thenReturn(ee);
    when(ee.getAccount(2)).thenReturn(a);
{: class="brush:java"}

Contrast this with a stub (+ builder) approach of:

    StubRepo repo = new StubRepo();
    repo.addClientWithEmployeeAndAccount(1, 2);
{: class="brush:java"}

Granted, domain objects are not usually a target for mocking ([usually](http://www.qi4j.org/)), but this is first example of an `n`-layer object graph that came to mind. Eh, I should come up with a better example.

Anyway, at first, it may seem like the mock is preferable. It is simpler, especially to get started, as it is just a few inline `mock`/`when` calls. Contrast this with the `StubRepo` which is a separate class and needs a separate `addClientWithEmployeeAndAccount` builder method. The stub requires some infrastructure.

However, the key is scale--as a project grows, the stub can be reused over and over in many different tests. The investment in building a stub pays off as soon as 5, 10, 100 tests are using it.

In contrast, the `mock`/`when`/etc. methods typically are not abstracted out and, in my experience, end up being repeated in each test.

This is just my opinion, of course--Fowler's article points out I'm like showing my classicist bias:

* *"As a result I've heard both styles accuse the other of being too much work. Mockists say that creating the fixtures is a lot of effort, but classicists say that this is reused but you have to create mocks with every test."*

Dummy Behavior Scales
---------------------

Stubs also scale better than mocks because they can contain dummy/default behavior that mocks otherwise to have to repeat in each test.

For example, take an `HttpServletRequest` and wanting to mock out the `getAttribute`/`setAttribute` methods.

With a mock, each time any business logic wants to use attributes, your test is going to have to contain setup code for each attribute involved in the test:

    HttpServletRequest req = mock(HttpServletRequest.class);
    when(req.getAttribute("foo")).thenReturn("bar");
    doBusinessLogic(req);
{: class="brush:java"}

And, if you have verify an attribute is being set via `setAttribute`, something like:

    ArgumentCapture<String> key = ArgumentCapture.forClass(String.class);
    ArgumentCapture<Object> value = ArgumentCapture.forClass(Object.class);
    verify(req).setAttribute(key.capture(), value.capture());
    assertThat(key.getValue(), is("foo"));
    assertThat(value.getValue(), is("bar2"));
{: class="brush:java"}

With a stub, you can have one class `StubRequest` which uses a map to implement simple `getAttribute`/`setAttribute` methods. Now all of your tests can use it:

    StubRequest req = new StubRequest();
    req.put("foo", "bar");
    doBusinessLogic(req);
    assertThat(req.get("foo"), is("bar2"));
{: class="brush:java"}

Besides just the `"foo"` attribute, if the business logic under test was setting its own attributes that it later wanted to retrieve, the stub's dummy map implementation scales even better as our test is encapsulated from those implementation details.

Spring even realized this, as they intelligently include for testing a [MockHttpServletRequest](http://static.springsource.org/spring/docs/2.0.x/api/org/springframework/mock/web/MockHttpServletRequest.html) that is actually a stub, though I can understand if they named it before the terminology of mocks/stubs/doubles had been settled.

Too Many Interfaces
-------------------

Mocking encourages testing behavioral interfaces between classes, e.g. [role interfaces](http://martinfowler.com/bliki/RoleInterface.html).

However, I personally prefer to use real objects in tests as long as possible, and only create interfaces as a last resort when doubling is required. Otherwise I think you end up with the anti-pattern of interfaces that have only 1 implementation.

To me, these 1-implementation interfaces just clutter a code base and make life more tedious for the developer as they copy/paste the same method definitions, etc., between the two. (See [interfacegen](http://github.com/stephenh/interfacegen) for my begrudging hack to help with these scenarios).

Fowler asserts that mockists actually like these extra interfaces:

* *"Mockists favor role interfaces and assert that using this style of testing encourages more role interfaces, since each collaboration is mocked separately and is thus more likely to be turned into a role interface."*

Which, in my current style, I just don't see the benefit of.

Lately I don't any more consulting-related project-hopping, so perhaps my data points are few/stale, but two of the worst "wtf were the architects thinking" systems I've seen involved 1-implementation/role interfaces. So until I see a convincing example otherwise, I consider them a bad thing.

Conclusion
----------

So, that's my take. I've [changed my style](http://www.draconianoverlord.com/2010/01/15/changing-my-style.html) before, so we'll see if I end up being a mockist a few years from now. But for now I'm a classicist.

(Nothing like some good labels to throw around.)

