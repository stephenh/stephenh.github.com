---
date: "2011-03-17T00:00:00Z"
categories:
  - Architecture
title: Framework-less Dependency Injection
---


Overview
--------

I'd like to present an alternative to framework-based DI that allows you to still have clean, decoupled, testable code without handing over control of every non-trivial object's instantiation to a DI framework.

The key idea is to:

1. Make a single interface for retrieving all application-wide shared objects
2. Pass an instance of this interface around in your application

That's it. This basically combines Fowler's old school [Registry](http://martinfowler.com/eaaCatalog/registry.html) pattern with the DI hipness of constructor injection. I don't claim this is anything novel, nor perfect; but I'm surprised I haven't seen it being used more.

I've been using this approach for awhile now (since my [Changing My Style](/2010/01/15/changing-my-style.html) post from a year ago) and it has been working out quite well.

There are pros and cons, but first an example.

Example
-------

To frame the example, let's setup three class that respond to a user request.

(**Update June 2018:** I use the terribly uncool name `Servlet` here, but don't let that color your judgment :-), as this is a very generic problem, "how to stitch your application together", that happens in any codebase, regardless of the framework/language, and even across both backend and frontend codebases).

Something like:

```java
public class Servlet {
  private Handlers handlers = new Handlers();

  // called when user hits the service
  public void handle(HttpRequest request) {
    handlers.handle(request);
  }
}

public class Handlers {
  public void handle(HttpRequest request) {
    // dispatches request to the right handler for the request type
    if ("bar".equals(request.getParameter("type"))) {
      // note that we call `new BarHandler`
      new BarHandler(request).handle();
    }
  }
}

// instantiated per request
public class BarHandler {
  private final HttpRequest request;

  public BarHandler(HttpRequest request) {
    this.request = request;
  }

  public void handle() {
    // here we want to touch external dependencies
    databaseRepo.lookupId(...);
    emailRepo.sendAnEmail();
  }
}
```

This is completely made-up, but the idea is that we have several objects involved in servicing the request. Some of them are stateless (`Servlet` and `Handlers`) but some are stateful (`BarHandler`).

The problem then is how to get the `databaseRepo` and `emailRepo` dependencies passed down into the `BarHandler`.

Potential Approaches
--------------------

Throwing out possibilities, we could:

* Instantiate `databaseRepo` and `emailRepo` in `Servlet` and pass them to `Handlers`'s constructor, which `Handlers` can then pass to `BarHandler`.

  This works, however, with more than a few application-scoped variables (e.g. pretend we have ~10-20 or more services, and fairly frequently add new ones), this would become quite tedious, especially for intermediary classes like `Handlers` which wouldn't use the dependencies but just pass them on.

* Create a `DatabaseRepo.getInstance()` static singleton method, and change `BarHandler.handle` to just call the static method.

  This is cheap and easy, but we add coupling and lose easy testability, so has been validly out of favor for awhile.

* Use a DI framework to inject `DatabaseRepo` and `EmailRepo` into `BarHandler`.

  (E.g. we would use `@Inject` annotations in the `BarHandler` constructor, and ask a DI framework to automatically figure out which are the "right" instances of `DatabaseRepo` and `EmailRepo` are, each type we create a new `BarHandler`.)
 
  Because we've asked the DI framework to wire the `BarHandler`'s dependencies, this means we can no longer directly call `new BarHandler`.

  So, instead our `Handlers` class would have to be passed a `Provider<BarHandler>` in it's constructor, which is how it asks "DI framework, please create an appropriately-wired `BarHandler` for me".

  Which means `Handlers` also needs to be instantiated by the DI framework, etc.

  So, the DI framework generally becomes an all-or-nothing affair. To be effective, it has to wire together all of your application.

I'm sure there are other potential approaches I'm missing, but I think these are the most common.

Per the comments with each approach above, I wasn't satisfied with any of these and so was looking for something else.

AppRegistry Approach
--------------------

The approach I've settled on lately is based around an `AppRegistry` interface, where all of the shared, application-scoped objects (`DatabaseRepo`, `EmailRepo`) go into a single interface:

```java
public interface AppRegistry {
  DatabaseRepo getDatabaseRepo();

  EmailRepo getEmailRepo();
}
```

I use the term `Registry` in deference to Fowler's pattern, but you could just as well call it `AppContext`, which is more Spring-like.

(Which, speaking of Spring, you can basically think of `AppRegistry` as making a plain, strongly-typed interface with a `getXxx` method for each bean in your Spring config file.)

And now we just create a new instance of it and pass it around:

```java
public class Servlet {
  // registry can potentially be shared via the ServletContext
  private AppRegistry registry = new AppRegistryInstance();
  private Handlers handlers = new Handlers(registry);

  // called when user hits the service
  public void handle(HttpRequest request) {
    handlers.handle(request);
  }
}

public class Handlers {
  private final AppRegistry registry;

  public Handlers(AppRegistry registry) {
    this.registry = registry;
  }

  public void handle(HttpRequest request) {
    // dispatches request to the right handler for the request type
    if ("bar".equals(request.getParameter("type"))) {
      new BarHandler(registry, request).handle();
    }
  }
}

// instantiated per request
public class BarHandler {
  private final DatabaseRepo databaseRepo;
  private final EmailRepo emailRepo;
  private final HttpRequest request;
  
  public BarHandler(AppRegistry registry, HttpRequest request) {
    this.databaseRepo = registry.getDatabaseRepo();
    this.emailRepo = registry.getEmailRepo();
    this.request = request;
  }

  public void handle() {
    databaseRepo.lookupId(...);
    emailRepo.sendAnEmail();
  }
}
```

And that's it.

Pros/cons are discussed next, but the short of it is that we can still test the `BarHandler` class--a fake (stub or mock, but, no, really, [use a stub](/2010/07/09/why-i-dont-like-mocks.html)) `AppRegistry` can be passed into `BarHandler` with whatever fake versions of the dependencies you want to use for the test.

Briefly, the `AppRegistryInstance` class just instantiates the dependencies and holds on to them:

```java
public class AppRegistryInstance implements AppRegistry {
  private final DatabaseRepo databaseRepo;
  private final EmailRepo emailRepo;

  public AppRegistryInstance() {
    databaseRepo = new DatabaseRepo(...settings...);
    emailRepo = new EmailRepo(...settings...);
  }

  public DatabaseRepo getDatabaseRepo() {
    return databaseRepo;
  }

  public EmailRepo getEmailRepo() {
    return emailRepo;
  }
}
```

And you could just as well create a `StubAppRegistryInstance` for all of your tests to reuse:

```java
public clas StubAppRegistryInstance implements AppRegistry {
  private final DummyDatabaseRepo databaseRepo = new DummyDatabaseRepo();
  private final DummyEmailRepo emailRepo = new DummyEmailRepo();

  public DummyDatabaseRepo getDatabaseRepo() {
    return databaseRepo;
  }

  public DummyEmailRepo getEmailRepo() {
    return emailRepo;
  }
}
```

So that now instead of copy/paste setting up a lot of mock expectations/results, your test can pass a `StubAppRegistryInstance` to the `BarHandler` under test and then assert against the side affects that `BarHandler` makes to `DummyDatabaseRepo` and `DummyEmailRepo`.

Pros/Cons
=========

* Pro: No auto-wiring DI framework. No magic.

* Pro: Intermediary classes (e.g. `Handlers`) don't have to know about each individual app-wide dependency of the classes it instantiates (either directly or indirectly). `new` calls stay clean, with at most the extra `AppRegistry` parameter passed.

* Pro: Only classes that require app-wide sharing are in the `AppRegistry` interface--unlike auto-wiring DI, if a class is not going to be doubled out (like `BarHandler`, which there is only ever one implementation of), we can just use `new` and not worry about a DI library/`Provider` creating it for us.

* Pro: `AppRegistryInstance` is regular Java code, so can freely use configuration files, system properties, even `if` statements to configure the implementations of `DatabaseRepo` and `EmailRepo` appropriately.

* Pro: "scopes" become a lot less confusing--where as DI frameworks will, to the client, arbitrarily return shared (singleton) or new (prototype) instances, everything in `AppRegistry` is by definition application scoped. If you need a "prototype" instance, just call `new`. If you need a request scope, make a new `RequestRegistry` (or `RequestContext`) interface that follows the same `AppRegistry` pattern and explicitly models the request-scoped dependencies.

* Con: `BarHandler`'s constructor signature only declares that it's dependency is the `AppRegistry` (meaning some number of application-scoped beans). This is not as clear or self-documenting as a traditional DI constructor signature which would specify each direct dependency as a separate parameter (e.g.`DatabaseRepo` and `EmailRepo`).

* Con: You give up the DI container's "more than just DI" features (like Spring's automatic transaction management, aspect/proxy features, etc.). Although, personally, I don't consider this a huge loss anyway.

Other Alternatives
==================

There is a (at least one) variation of this "make an interface for your dependencies" approach.

[Context IoC][cioc] is a pattern than uses per-class interfaces instead of per-scope interfaces. Which addresses the con listed above of `BarHandler`'s explicit dependencies not being apparent from the API.

E.g. Context IoC would have a `BarHandler.Context` interface that declared the explicit `DatabaseRepo` and `EmailRepo` dependencies, plus extended the corresponding `Xxx.Context` interface of each object that `BarHandler` instantiated (so that `BarHandler.Context` could be used for constructing those instances as well).

I think the Context IoC approach is quite novel, but it leads to a lot of extra interfaces and so is a bit excessive in my opinion.

Conclusion
==========

For me, this pattern has worked out very well to test-enable my code. I can switch out dependencies as needed without giving up the `new` operator and without making object instantiation so painful that only a DI framework can do it.

So I can apply "YAGNI" to a DI framework and stay with the simplicity of regular Java.

[cioc]: http://sonymathew.blogspot.com/2009/11/context-ioc-revisited-i-wrote-about.html

**Update June 2018:** I recently read a Go blog post, [Go for Industrial Programming](https://peter.bourgon.org/go-for-industrial-programming/#the-component-graph), that makes this same appeal to simplicity (although technically without the `AppRegistry` parameter object). In general, auto-wired DI seems to be in favor less than these days than when I originally wrote this, perhaps because microservices are generally smaller codebases, so the pain-point of "I need a DI framework to handle the 100s of dependencies in my monolith" just doesn't happen as often.


