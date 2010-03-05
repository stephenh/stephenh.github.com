---
layout: post
title: Changing My Style
---

Changing My Style
=================

Lately I've been reconsidering my approach with regard to statics.

Basically, less of them.

DI With Manual Wiring
---------------------

Yeah, I know I'm late to the game here, what with DI taking over the Java world, what, 10 years ago.

I've always liked the class-design side of DI. I noticed early on that DI-style projects were much easier to integrate with than others. Pre-DI, projects would typically look at their own proprietary configuration files and then take off running, and not let you easily change things.

Post-DI, integration was much easier, even though I would still manually wire together our DI-enabled dependencies.

Which brings me to the crux of my issue with standard DI: auto-wiring bugs me.

In three ways:

1. Spring auto-wiring still involves XML configuration files that are easily hundreds of lines long.

   This is confusing because the service objects being wired together are usually the ones most likely to be driven by application-level configuration parameters, environment checks, etc. And XML is pretty much the most static place you can put stuff. No ifs, whiles, logic, abstractions, etc.

   Supposedly Java-based configuration for Spring is available, but I've yet to see a project actually use it. I'm not sure why.

2. Leaving auto-wiring to a framework foregoes static typing of your service object dependencies.

   Spring's XML is especially bad at this, being just a grab bag of fun that you get to wait until runtime to see what happens with it.

   But even Guice, which asserts to "embrace Java's type safe nature", can really only ensure that you bind the right type of implementation to an interface.

   Which is fine, but what they cannot check is whether you've added the binding at all in the first place. E.g. you're going to have to wait until runtime to make sure all of your @Inject constructors just magically work.

   Contrast this with manual wiring where, if you're missing a constructor parameter, you'll know it immediately at compile time.

3. Manual wiring shouldn't be that hard.

   Lex Spoon [says it very well](http://blog.lexspoon.org/2009/02/why-not-inject-dependencies-manually.html), that DI propaganda picks on `XxxFactory` as why you need auto-wiring when really the `XxxFactory` is an anti-pattern in and of itself and just needs a dose of good implementation and abstraction.

   (Note I'm working on this--slowly. Nothing awesome yet.)

Joist Example
-------------

Anyway, when building [Joist](http://joist.ws), I wasn't as anti-static as I am becoming, so I'd have code that looks like:

    public class SomeBusinessLogic {
      public void doSomeBusinessLogic(final Integer fooId) {
        // UoW is a static that reaches out and starts a transaction
        UoW.go(new Block() {
          public void go() {
            // Foo.queries is another static that reaches out for a FoodQueries instance
            final Foo foo = Foo.queries.findById(fooId);
            // do stuff with foo
          }
        });
      }
    }
{: class=brush:java}

I think I would write this now as:

    public class SomeBusinessLogic {
      private final Repository repo;

      public SomeBusinessLogic(final Repository repo) {
        this.repo = repo;
      }

      public void doSomeBusinessLogic(final Integer fooId) {
        repo.go(new Block() {
          public void go() {
            final Foo foo = repo.getFooQueries().findById(fooId);
            // do stuff with foo
          }
        });
      }
    }
{: class=brush:java}

The odd thing is that I don't know how useful this would actually be.

Part of my historical anti-DI stance is that some semantics, like the transactional semantics of a database-backed unit of work, just cannot be mocked/stubbed out very effectively.

E.g. with the real unit of work, if you get an instance of `Foo`, change some properties, but then an exception happens, those changes are lost.

However, most any mock/stub repository is going to hand you an instance of `Foo`, let you change some properties, and when an exception happens, leave `Foo` just as it is. It's a mock/stub--it's not smart enough to actually track/rollback object changes.

So, my opinion with Joist was "why bother?" and so I typically have just stuck with integration tests for anything that touches a unit of work/database.

And I still subscribe to this view, e.g. I don't see myself mocking out `getFooQueries` any time soon. 

But what I find odd is that my style has changed such that now even looking at the statics makes me uncomfortable.

Registries Example
------------------

I'm also moving away from a static-based [Registry](http://martinfowler.com/eaaCatalog/registry.html), to an interface-based one.

I still like Fowler's pattern of the Registry being the one singleton in the application. It matches the Spring/Guice semantics of having one application context or application module that is tucked away in a static/thread local/servlet filter somewhere.

So, even though my previous Registries were the only singleton, I still exposed their resources via static getter methods, e.g.:

    public class Registry {
      public static ResourceA getResourceA() { ... }
      public static ResourceB getResourceB() { ... }
    }

    public class Client {
      public void doStuffWith() {
        Registry.getResourceB().doStuff();
      }
    }
{: class=brush:java}

But now, yeah, the static `Registry.getResourceB()` call hurts and I'm changing to something like:

    public interface Registry {
      ResourceA getResourceA();
      ResourceB getResourceB();
    }

    public class RegistryInstance implements Registry {
      public static Registry get() { ... }
    }

    public class Client {
      private final Registry registry;

      // Ideally use this constructor when you've got a registry
      // on hand already
      public Client(final Registry registry) {
        this.registry = registry;
      }

      // Only use the default constructor if you don't control
      // class instantation, e.g. a servlet or domain object
      public Client() {
        this(RegistryInstance.get());
      }

      public void doStuffWith() {
        registry.getResourceA().doStuff();
      }
    }
{: class=brush:java}

Such that now `Registry` can be mocked/stubbed out.

Which, yeah, is obvious in this day and age.

But, I still like the `Registry` as a pure-Java/typed version of your Spring application context or Guice client module. I get to strongly declare the dependencies my application has.

I'll add the caveat that I haven't used this new approach in a huge system yet. I don't intend on the `Registry` context being passed around through layer after layer. Hopefully good design, or a few strategic `RegistryInstance.get()` calls, will avoid that.

And I'm not too worried about the occasional `RegistryInstance.get()` call, especially if used in a default constructor that then defers to a mockable constructor. Spring apps have do the same thing now and then, reach out to a thread-local/etc. application context.

Inner-Class Dependency Interfaces
---------------------------------

One approach I want to play more with is using a GWT MVP-style dependency declaration. E.g. instead of service components being in an application-wide `Registry` interface, or a huge list of constructor arguments, I think an inner-interface would be interesting:

    public class SomeBusinessLogic {
      public interface Deps {
        Repository getRepository()
      }

      private final Deps deps;

      public SomeBusinessLogic(Deps deps) {
        this.deps = deps;
      }
    }

    // off in your Registry
    public interface Registry extends SomeBusinessLogic, ... {
    }
{: class=brush:java}

What I like about this is that each class gets its own declaration of the dependencies it requires. For very common dependencies, you could use inheritance, e.g.:

    public class SomeBusinessLogic {
      public interface Deps extends CommonAppDeps {
      }
    }
{: class=brush:java}

But, without some structural typing tricks, your `Registry` interface is going to have an explosion of `extends XxxLogic, YyyLogic, etc`.

Which, ironically, verbosity is one of my complaints about GWT MVP's use of inner-interfaces as well.

So, perhaps it is not such a great idea.

Thanks
------

Also, I wanted to thank to my coworkers at [Bizo](http://www.bizo.com) for influencing my style lately. It's fun to still be learning.


