---
date: "2014-02-08T00:00:00Z"
section: Architecture
title: Dependency Injection Thought Experiment
---


Recently, I thought of a simple thought experiment.

With a Servlet
--------------

Let's start with a servlet that just writes out "Hello World". I'm going to use a pseudo API instead of something like `javax.servlet` to facilitate the thought experiment.

```java
public void service(Writer w) {
  w.write("Hello World");
}
```

Simple enough. We can fake-out `Writer` (use a mock `Writer` or a `StubWriter`) and put the `service` method under test.

I'll skip the test code as, regardless of whether you mock or stub, it'll be pretty simple.

So, now let's say our code needs access to the query parameters:

```java
public void service(Writer w, Map<String, String> params) {
  w.write("Hello World " + params.get("queryParam"));
}
```

We now have 2 method parameters. Fair enough.

But now let's say we also want the HTTP headers:

```java
public void service(
    Writer w,
    Map<String, String> params,
    Map<String, String> headers) {
  w.write("Hello World " +
    params.get("queryParam") +
    " using " +
    headers.get("User-Agent"));
}
```

We have 3 method parameters. Still fine.

But then next we need the session:

```java
public void service(
    Writer w,
    Map<String, String> params,
    Map<String, String> headers,
    Map<String, String> session) {
  w.write("Hello World " +
    params.get("queryParam") +
    " using " +
    headers.get("User-Agent") +
    session.get("username"));
}
```

Oh, and now we also want to set the response Content-Type header:

```java
public void service(
    Writer w,
    Map<String, String> params,
    Map<String, String> headers,
    Map<String, String> session,
    Map<String, String> outHeaders) {
  outHeaders.put("Content-Type", "text/html");
  w.write("Hello World " +
    params.get("queryParam") +
    " using " +
    headers.get("User-Agent") +
    session.get("username"));
}
```

Eesh. Now we're at 5 method parameters.

How about one last thing--so far our `service` method has been stateless, which is fine, that's how servlets work.

But, illustration purposes, let's pretend our "servlet" component it actually stateful (e.g. one is created per-request):

```java
public class Servlet {
  private final Writer w;
  private final Map<String, String> params;
  private final Map<String, String> headers;
  private final Map<String, String> session;
  private final Map<String, String> outHeaders;

  public Servlet(
      final Writer w,
      final Map<String, String> params,
      final Map<String, String> headers,
      final Map<String, String> session,
      final Map<String, String> outHeaders) {
    this.w = w;
    this.params = params;
    this.headers = headers;
    this.session = session;
    this.outHeaders = outHeaders;
  }

  public void service() {
    outHeaders.put("Content-Type", "text/html");
    w.write("Hello World " +
      params.get("queryParam") +
      " using " +
      headers.get("User-Agent") +
      session.get("username"));
  }
}
```

At this point, passing around the parameter list is getting out of hand.

Which is fine, we can apply a well known refactoring, [Introduce Parameter Object](http://www.refactoring.com/catalog/introduceParameterObject.html), and make `Request` and `Response` interfaces:

```java
public interface Request {
  Map<String, String> getParams();
  Map<String, String> getHeaders();
  Map<String, String> getSession();
}

public interface Response {
  setHeader(String name, String value);
  Writer getWriter();
}
```

And now have our `Servlet` class use them:

```java
public class Servlet {
  private final Request request;
  private final Response response;

  public Servlet(Request request, Response response) {
    this.request = request;
    this.response = response;
  }

  public void service() {
    request.setHeader("Content-Type", "text/html");
    response.getWriter().write(
      "Hello World" +
      request.getParams().get("queryParam") +
      " using " +
      request.getHeaders().get("User-Agent") +
      request.getSession().get("username"));
  }
}
```

This looks a lot better.

We introduced a `Request` abstraction that groups request-lifecycle attributes, and so instead of passing around lots of related parameters, we can pass around `Request` and `Response` instances.

So far, none of this should be new or different, because HTTP libraries in basically any OO language look this way.

Servlet Testing
---------------

After introducing the `Request` interface, testing the `Servlet` class involves a level of indirection.

Previously we could pass fake `Writer`, `Map`, etc. instances directly as parameters to our `service` method--now we have to wrap a `Request` around the test `Writer`, `Map`, etc. and pass the `Request` instead.

If you're mocking, you just mock out the parts of `Request` you need:

```java
private Request request = mock(Request.class);
private Response response = mock(Response.class);

public void testServletOne() {
  // ServletOne only needs Writer
  when(response.getWriter()).thenReturn(mockWriter);
  servlet = new ServletOne(request, response);
  // ...rest of test...
}

public void testServletTwo() {
  // ServletTwo needs headers and Writer
  when(request.getHeaders()).thenReturn(mockHeaders);
  when(response.getWriter()).thenReturn(mockWriter);
  servlet = new ServletTwo(request, response);
  // ..rest of test ...
}
```

Personally, I [prefer stubbing](/2010/07/09/why-i-dont-like-mocks.html) in this scenario, and would use something akin Spring's misnamed [MockHttpServletRequest](http://static.springsource.org/spring/docs/2.0.x/api/org/springframework/mock/web/MockHttpServletRequest.html) (it's really a [stub](http://martinfowler.com/articles/mocksArentStubs.html)):

```java
private Request request = new StubRequest();
private Response response = new StubResponse();

public void testServletOne() {
  servlet = new ServletOne(request, response);
  // ...rest of test...
}

public void testServletTwo() {
  servlet = new ServletTwo(request, response);
  // ...rest of test ...
}
```

But, which ever style you prefer, this extra level of mocking/stubbing in tests is pretty standard for `Request` interfaces.

Thoughts on Servlet Refactoring
-------------------------------

So far, whether you prefer a stateful or stateless `Servlet` class aside, I think this has been a pretty standard "best practice" refactoring.

But let's be pedantic and focus on the API change of our constructor (using the stateful `Servlet` class), both pre- and post-`Request` refactoring:

```java
// before
public Servlet(
    final Writer w,
    final Map<String, String> params,
    final Map<String, String> headers,
    final Map<String, String> session,
    final Map<String, String> outHeaders) {
  this.w = w;
  this.params = params;
  this.headers = headers;
  this.session = session;
  this.outHeaders = outHeaders;
}

// after
public Servlet(
  final Request request,
  final Response response) {
  this.request = request;
  this.response = response;
}
```

What are the pros and cons of the change?

* Pro: less parameters to pass around
* Pro: more decoupled--whoever instantiates our `Servlet` does not have to know exactly which parts of the request our `service` method is going to use
* Con: less explicit--previously we could see exactly what parts of the request we needed; if we didn't need the `session` map, we could leave it out of our constructor, and it is immediately apparent to callers

Personally, I think the pros outweighs the cons here. And given that every servlet-type API I've seen lately has a `Request` interface, I think its fair to say this is a well-accepted, non-controversial refactoring.

You might take a moment to note to yourself whether you do/do not agree with this refactoring, just for the purpose of the thought experiment.

Now with Services
-----------------

Instead of a servlet, let's now write a service, some sort of stateless "bean" (it's 2014, I really should stop using that word) in your application that needs application-scoped dependencies:

```java
public class Service {
  private final EmailSender emailSender;
  private final FooDao fooDao;
  private final BlahService blahService

  public Service(
      final EmailSender emailSender,
      final FooDao fooDao,
      final BlahService blahService) {
    this.emailSender = emailSender;
    this.fooDao = fooDao;
    this.blahService = blahService;
  }

  // ...service methods...
}
```

I've made up `EmailSender`, `FooDao`, and `BlahService` as dependencies of `Service`--what the actual dependencies are isn't important. The main point is that they are all application-scoped dependencies.

Do you notice how similar this `Service` code looks to the pre-`Request` `Servlet` code?

Most people look at the `Service` constructor and think there's no way they want to instantiate by hand all 10-50-whatever services they have in their project when the constructor is going to vary so widely from service to service.

So, in steps auto-wiring dependency injection (Spring, Guice, whatever) as the hero to solve this problem. They give up strongly-typed `new Service` calls and say "here, let me use reflection to call all these nasty constructors for you".

Which makes sense if you're forcing yourself to stick with the `Service(EmailSender, FooDao, BlahService)` constructor.

But what if we apply the same refactoring that we just applied to `Servlet`? We applied Introduce Parameter Object and made a `Request` interface--let's apply it here and make an `AppContext` interface:

```java
public interface AppContext {
  EmailSender getEmailSender();
  FooDao getFooDao();
  BlahService getBlahService();
}
```

And now let's use it:

```java
// style 1
public class Service {
  private final AppContext appContext;
  public Service(final AppContext appContext) {
    this.appContext=appContext;
  }
  // service method calls appContext.getBlahService().xxx();
}

// style 2
public class Service {
  private final EmailSender emailSender;
  private final FooDao fooDao;
  private final BlahService blahService

  public Service(final AppContext appContext) {
    this.emailSender = appContext.getEmailSender();
    this.fooDao = appContext.getFooDao();
    this.blahService = appContext.getBlahService();
  }
  // service method calls blahService.xxx();
}
```

Whichever style you prefer, we've drastically simplified our constructor--instead of saying "I need X, Y, Z, ...", it's "I need some of my application's app-scoped dependencies".

Service Testing
---------------

Much like Servlet Testing earlier, adding an `AppContext` adds a level of indirection to our tests that we must mock/stub out.

You can either mock:

```java
private AppContext appContext = mock(AppContext.class);

public void testServiceOne() {
  // ServiceOne only needs FooDao
  when(appContext.getFooDao()).thenReturn(mockFooDao);
  service = new ServiceOne(appContext);
  // ...rest of test...
}

public void testServiceTwo() {
  // ServiceTwo needs needs FooDao and EmailSender
  when(appContext.getFooDao()).thenReturn(mockFooDao);
  when(appContext.getEmailSender()).thenReturn(mockEmailSender);
  service = new ServiceTwo(appContext);
  // ...rest of test ...
}
```

Or, stub:

```java
private StubAppContext appContext = new StubAppContext();

public void testServiceOne() {
  service = new ServiceOne(appContext);
  // ...rest of test...
}

public void testServiceTwo() {
  service = new ServiceTwo(appContext);
  // ...rest of test ...
}
```

Thoughts on Service Refactoring
-------------------------------

Okay, so what are the pros/cons of the `AppContext` approach for `Service`?

To me, they are the same as the pros/cons of the `Servlet` refactoring:

* Pro: less parameters to pass around
* Pro: more decoupled--whoever instantiates our `Service` does not have to know exactly which parts of the application context we need
* Con: less explicit--less obvious what our `Service`'s application-scoped dependencies are

Either way, our instantiation of `Service` is now trivial. We can just call `new Service(appContext)`.

I assert that our constructor is now simple enough that mere mortals can instantiate services--we don't need Spring, Guice, or anything fancy to call `new` for us.

We still have Dependency Injection:

* The `AppContext` methods return interfaces whose implementation is determined at runtime
* No statics are involved that would complicate testing
* No `XxxFactory` classes are involved (which is a popular strawman in auto-wiring DI tutorials)

And, most importantly, it's simple. Anyone who understands interfaces can understand `AppContext`. And not just how to *use* it, but how it *actually works*. There is no magic.

I think this is a stark contrast to auto-wiring DI, where only a handful of experts on a project truly understand what is happening behind the scenes. The rest of the team, or even entire teams if they lack a true expert, cargo cult their way through auto-wiring DI because it's best practice.

Are `Request` and `AppContext` that Different?
----------------------------------------------

So, the `Request` object groups request-related/request-scoped parameters.

The `AppContext` object groups application-related/application-scoped services.

My assertion is that they are based on the same underlying principles.

Which is why, when debating pros/cons of an `AppContext` approach vs. an auto-wiring approach, I find it frustrating when the admitted cons of `AppContext` come up (like less explicit which services are actually being used).

I will not disagree that they are not cons, but I feel they are generally outweighed by the pros (simple, type-safe, no need to rely on a framework), that, in other "Introduce Parameter Object" instances (like Request, etc.), are taken as perfectly fine and a worthy trade-off.

But something about these parameters being "dependencies" (usually application-scoped, but also custom-scoped, given frameworks support that), means developers end up treating/thinking of them differently. I'm not sure why.

Personally, I've been using this `AppContext` style for quite awhile in various codebases, since I wrote [Changing my style](/2010/01/15/changing-my-style.html) (where I referred to it as a registry), and it is still working well. (Note that I make no claim for originality.)

Perhaps there are cases where an `AppContext` approach becomes very degenerate, say with hundreds of services. Hundreds of services would be awkward, but I would be tempted at that point to apply the [GooS](http://www.growing-object-oriented-software.com/) philosophy that the awkwardness is pointing out a real smell (a huge codebase with many unstructured dependencies), and not just sweep it under the rug by throwing a framework at it.

But, even if it does become degenerate in some scenarios (extremely large system/something/something), I can somewhat selfishly assert that, that's fine, those are not my scenarios.

(And vice versa, if other developers assert that an `AppContext` approach would be degenerate for their demonstrably different scenarios, and auto-wiring DI is awesome, I'm willing to trust them on on that.)

That said, I suppose I will go a bit further and assert that most systems that are using auto-wiring DI because it's "best practice", would likely be just fine, and in fact easier/simpler to understand, with a "standard OO" solution to the problem.

As a final note, this was sitting in my "drafts" directory for ages, so I'm somewhat past the whole DI/AppContext debate; I'm not sure why, perhaps because I've been away from any DI-using systems for awhile now. Definitely at [Bizo](http://www.bizo.com), but also in the wider Scala community, it seems that Scala systems have eschewed adopting auto-wiring DI as idiomatic.

But I thought I'd still go ahead and publish it, if anything so that I can have a link to point people to in the future.


