---
title: Faking at the Right Level
description: ""
date: 2012-07-23T00:00:00Z
tags: ["Testing"]
---



It's common to use fakes (either mocks or stubs) to test specific layers of your code without incurring the complexity and expense of also exercising all of the upstream layers (e.g. testing your UI layer without having to test/touch your database layer).

Fakes generally occur naturally at system boundaries, which are obvious places to add decoupling, but I wanted to more generally talk about them. I see these general types:

* Good In-Project Abstractions
* Bad In-Project Abstractions
* Reusing Cross-Project Abstractions

Good In-Project Abstractions
----------------------------

"Good" is obviously subjective, but to me the good, in-project abstractions are those that avoid I/O.

For example, if you're writing an `ApiClient` that talks over HTTP, to me it makes sense to add an `Http` abstraction that `ApiClient` uses instead of directly calling a (typically complex, verbose) HTTP library implementation like `commons-http` (or, worse, actual wire calls).

Admittedly, this example is not even really in-project, because the HTTP wire/and `commons-http` libraries are external projects.

You might start out with something simple:

```scala
// interface you're exposing to clients
trait ApiClient {
  def getFoo(id: Int)
  def sendFoo(foo: Foo)
}

// your real implementation for clients
class ApiClientImpl(http: Http) extends ApiClient {
  override def getFoo(id: Int) = {
    // use http.get here
  }

  override def sendFoo(foo: Foo) = {
    // use http.post here
  }
}

// http abstraction for testing ApiClientImpl
trait Http {
  def get(path: String): String
  def post(path: String, body: String): Unit
}

// http implementation for real usage
class HttpImpl extends Http {
  override def get(path: String) = {
    // use commons-http
  }

  override def post(path: String, body: String) = {
    // use commons-http
  }
}
```

Note that this `Http` interface is purposefully extremely simple: you can have as small and clean of an API as your `ApiClient` needs, as then your `ApiClient` and it's tests are really clean, and then only add more complexity to the `Http` interface as needed (e.g. methods, headers, return codes, etc.)

This approach is fairly standard, encapsulating your code from both dependencies and I/O. It simplifies your code, by providing the bulk of your codebase (which is `ApiClientImpl` in our example) with a simple/idealized HTTP API that then in just one class you adapt to a specific underlying concrete implementation.

Also, with the `Http` abstraction, now in your tests for `ApiClientImpl`, you can fake out the HTTP layer:

```scala
val stubHttp = new StubHttp()
stubHttp.when("GET /foo").thenRespond(
  "{ foo: { id: 1 } }")

val api = new ApiClientImpl(stubHttp)
// hits the in-memory stub
val foo = api.getFoo()
assertThat(foo.getId(), is(1));

api.sendFoo(new Foo(2));
stubHttp.assertHas(
  "POST /foo",
  "{ foo: { id: 2 } }")
```

Which is still pretty standard stuff.

I frequently start out with mocks, but eventually end up with stubs, as I think their state/abstraction scales better than pure mocks (see [Why I Like Stubs](/2010/07/09/why-i-dont-like-mocks.html) for a longer tangent on that).

Bad In-Project Abstractions
---------------------------

Again, "bad" is subjective, but abstractions I typically think are overdone are when interfaces are used to draw arbitrary lines between components that merely call each other in memory.

The stereotypical example from mid-2000s Java projects are a `HomeController` calling a `HomeService` calling a `HomeDAO` which finally made database calls.

Okay, I get you want your `HomeDAO` to be an abstraction, so you can avoid I/O, but typically the `HomeService` was also an interface that had to be implemented and injected into the `HomeController`.

If we're not drawing lines between systems (e.g. a vendor or a sister team) or lines in-front of I/O (expensive disk/wire calls), I really question whether the overhead of these abstractions are worth it.

From what I've seen, it can degenerate into testing that is solely behavior-based, e.g.:

```
def testHomeController() {
  // given the user calls /home
  val home = new HomeController(mockHomeService)
  home.visit()
  // then we call the service
  verify(mockHomeService).whateverMethod();
}
```

Have we really tested anything here? Does the user really care the `whateverMethod` was called?

No, they don't.

For me, I prefer to have state-based assertions (this ties into my preference for stubs) that show the state of the world changed, which I believe are much more resilient to internal refactoring and less coupled to implementation details.

So, basically if we're not using the `HomeService` interface/abstraction for testing (because the tests its allows are brittle and weak), then `HomeService` might still be a fine class to fine, but I would not have it be an abstraction, and instead I'd have it just be a concrete class that gets called as boring, old-school method calls from `HomeController` when we're testing it.

Reusing Cross-Project Abstractions
----------------------------------

So, those cases are within project; for cross-project abstractions, there can be some nuance.

Let's pretend you shipped our `ApiClient` project example above, and I'm now consuming it in my `AwesomeWebapp`.

I now want to test my `AwesomeWebapp`, which uses your `ApiClient`, but I of course don't want to make real HTTP calls.

I have three choices:

1. Reuse your `Http`/`StubHttp` abstraction for my own tests
2. Make my own in-project `ApiClient` abstraction (e.g. create a new, minimal interface)
3. Use the `ApiClient` interface as is

For the 1st option, reusing an upstream project's abstraction, I have done this before and it is generally a mistake. The reason is that your tests end up being both more verbose and coupled to the upstream (`ApiClient`) implementation details.

For example, my code might look like: 

```scala
def testAwesomeWebapp() {
  // pull in StubHttp from the ApiClient project
  val stubHttp = new StubHttp()
  // use it to make a "real" ApiClientImpl
  val apiClient = new ApiClientImpl(stubHttp)
  // now make my webapp that I want to test
  val webapp = new AwesomeWebapp(apiClient)

  // now, i want to test a request happening
  sync.gotARequest()

  // note here my assertion is coupled to the low-level
  // HTTP details of what ApiClientImpl did.
  stubHttp.assertHas(
    "POST /foo",
    "{ foo: id: 2 } }")
}
```

So, I tested `AwesomeWebapp` not by observing state changes/method calls on its direct dependencies, but in the dependency of it's dependency.

This may seem harmless at first, but it quickly becomes tedious making the `AwesomeWebapp` fake out such a low-level implementation detail like HTTP just to test it's high level operation (finding `Foo`s and sending them to the `ApiClient`).

For the second option, creating another abstraction solely for `ApiClient`, I generally find this is overkill.

Given this is "cross-project" abstractions, e.g. both of these projects exist in house, as long as we can keep `ApiClient` from making wire calls, I don't think it's worth the overhead of on our internal abstraction.

Instead, the 3rd option is generally best, assuming the `ApiClient` ships its own interface, and that is to mock/fake against that interface.

**Update May 2018:** Note that technically my [micro-serving testing at-scale](/2018/01/21/microserving-testing-at-scale.html) posts proposes doing exactly the opposite of this, and using `ApiClientImpl` with magical, org-wide `Http` stubs, but that is somewhat of a special case, e.g. more fake-integration style testing than unit tests.

Use Project-Specific Abstractions
---------------------------------

Instead, as is perhaps obvious, it is a lot cleaner to test `SyncService` by faking out it's dependencies directly, e.g.:

```scala
def testSyncService() {
  val mockClient = new MockClient()
  val sync = new SyncService(mockClient)

  sync.run()

  verify(mockClient).sendFoo(...)
}
```

Where this becomes really helpful is when you stub at this project-specific level, as you can start applying state and dummy behavior to cut down on the mock tedious.

For example, a stub `ApiClient` might look like:

```scala
class StubApiClient extends ApiClient {
  private val instances = List[Foo]()

  override def getFoo(id: Int) = {
    instances.find(_.id == id).get
  }

  override def sendFoo(foo: Foo) = {
    if (foo.getId == null) {
      sys.error("foo id is required")
    }
    if (instances.find(_.id == id)) {
      sys.error("foo id already exists")
    }
    instances += foo
  }
}
```

With this dummy behavior, you can now put parts of `SyncService` under test that need to get/send `Foo`s and have both the `SyncService` implementation and your test method get the behavior for free (no setting up mocks with `when sendFoo` for every little `sendFoo` call).

Reuse Stubs Across Projects
---------------------------

Once your `ApiClient` is used as a dependency by multiple downstream projects, it makes a lot of sense to reuse the `StubApiClient` for all the downstream project's tests.

This is so helpful that I've begun packaging the `StubApiClient` directly in the same jar as the `ApiClientImpl`. Not because it's used in production, but because any project that uses `ApiClientImpl` almost always uses the `StubApiClient` for its tests.

This allows any downstream project to get a fast, in-memory "smart" (e.g. can handle generic behavior like adding a `Foo` and then returning the same `Foo` later, without constantly respecifying the behavior in the tests) stub client almost (after you initially create it) for free to use in their tests.

