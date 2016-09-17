---
layout: post
title: Faking at the Right Level
---

{{page.title}}
==============

It's common to use fakes (either mocks or stubs) to test specific layers of your code without incurring the complexity and expense of also exercising any dependent layers (e.g. testing your UI layer without having to test/touch your database layer).

In-Project Abstraction
----------------------

For example, if you're writing an API client that talks over HTTP, it makes sense to add an `Http` abstraction that your `ApiClient` uses instead of directly calling an HTTP library implementation like `commons-http`.

You might start out with something simple:

```scala
// interface you're exposing to clients
trait ApiClient {
  def getFoo(id: Int)
  def sendFoo(foo: Foo)
}

// real implementation for clients
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

(Note that this `Http` interface is really simple--it is something you'd start with, and then add more support for other methods, headers, return codes, etc., if/as you need them.)

This is fairly standard, encapsulating your code from dependencies. It simplifies your code, by providing the bulk of your codebase (`ApiClientImpl`) with a simple/idealized HTTP API that then in just one class you adapt to a specific underlying concrete implementation.

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

Which is still pretty standard stuff. I frequently start out with mocks, but eventually end up with stubs, as I think their state/abstraction scales better than pure mocks (see [Why I Like Stubs](/2010/07/09/why-i-dont-like-mocks.html) for a longer tangent on that).

Downstream-Project Abstraction
------------------------------

One thing to be careful about is avoiding the temptation to reuse one project's abstraction level (e.g. `Http`) for also testing downstream projects.

For example, let's say you have a `SyncService` that uses your `ApiClient`. I've gone down the path of writing something like:

```scala
def testSyncService() {
  val stubHttp = new StubHttp()
  val apiClient = new ApiClientImpl(stubHttp) // the real api client
  val sync = new SyncService(apiClient)

  // now, i want to test sync sending a foo
  sync.run()

  stubHttp.assertHas(
    "POST /foo",
    "{ foo: id: 2 } }")
}
```

Here we're testing `SyncService` not by observing state changes/method calls to it's direct dependencies, but in the dependency of it's dependency.

This may seem harmless at first, but it quickly becomes tedious making the `SyncService` fake out such a low-level implementation detail like HTTP just to test it's high level operation (finding `Foo`s and sending them to the `ApiClient`).

For example, once your application becomes more complex, syncing `Foo`s might first require syncing `Bar`s and `Zaz`s, all of which need low-level `GET`s/`POST`s faked out just to test a `Foo`.

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

