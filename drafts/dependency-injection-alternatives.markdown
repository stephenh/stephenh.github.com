---
layout: post
title: Avoiding Dependency Injection
---

Dependency Injection Alternatives
=================================

Introduction
------------

Dependency Injection is a de facto best-practice these days. It has made its way into frameworks, JSRs, and all sorts of areas.

However, as with many things that start off as good ideas, I think it's been taken a tad too far.

I'll briefly outline my gripes with DI, and then propose how I would accomplish the same with regular Java.

First, the complaints.

DI Encourages Overuse of Interfaces
-----------------------------------

Interfaces are great for public APIs or places where you are in fact providing various, different implementations of an interface.

However, DI "best-practice" has led to the infamous `IFoo` and `FooImpl` where `FooImpl` is the only implementation of `IFoo` in the entire codebase. There never has been another `IFoo` implementation than `FooImpl` and never will be.

This is such a waste of code. I usually see it in persistence layers, where every table has an `IMyTableMapper` and a corresponding `MyTableMapperImpl`. And despite the DDD people waxing poetic about different repository back-ends (one db-based, another map-based), hardly anyone actually does that, and so, in a large project, there are easily 100-200 some extra interfaces lying around and getting in the way of developers stepping through the code.

That Eclipse, in its 3.5 release, added a hover over `Ctrl-Click` that, when on a variable that is an interface, will take you either to interface "Declaration" or jump immediately to the **one** "Implementation" of that interface just highlights how widespread this anti-pattern has become.

My caveat here is that this seems to be a 1st-generation DI limitation, and that many/most DI frameworks will instantiate a concrete class for you without the interface using some CGLIB sub-classing magic.

So, hopefully the needless interfaces will stop. But I still begrudge DI for leading so many projects down this path.

And, to the point, interfaces are for documenting contracts that you know will have separate implementations--not to use for every class that ends up in DI.

Which leads me to:

DI Infects Your Entire Codebase
-------------------------------

As an architect, one of my goals is to make different aspects of the system as orthogonal as possible. Persistence should be decoupled from GUI, business logic all in the domain, that sort of stuff.

But what stuns me about DI is how it reaches across your entire codebase and says "No! I own your objects!" This is a huge coupling across your entire project to a single technology.

A friend and I came into a DI-infected project awhile ago and consistently were bitten by using `Foo f = new Foo()`, wondering why stuff wasn't working, and then realizing we had to somehow jury rig `Foo` out of the `ApplicationContext`, which we may/may not have access to at that point. Great.

`Foo`, and all of the classes in its layer (and other layers), had to be owned and instantiated by Spring to get automatically wired up or they were effectively useless.

I would be more understanding if only the handful of objects you really needed to have handled DI were effected. To me, this is objects like your mail gateway, SOAP gateway, or other "boundaries" that you want to switch out at runtime. Course-grain stuff.

The problem is that usually the client of this infrastructure piece is a low-level domain object/service whatever that needs, say, an `IMailClient`. And, to follow DI correctly, the `IMailClient` must be injected into the service on instantiation. Which means whoever instantiates the service must have an `ApplicationContext`. Which best-practice is to have injected. Which means whoever instantiates whatever instantiates the service must always have an `ApplicationContext`.

It's a turtles all the way up. Eventually all the frameworks cave and just integrate DI into each other so that Hibernate/Seam/whoever becomes infected with the awareness of your DI strategy and directs things along.

To me, this is not at all orthogonal. All we're doing is managing a few dependencies, it shouldn't require infecting the entire stack with DI.

The Stack Traces Suck
---------------------

My only experience with DI is Spring, and all I'll say is the stack traces are ridiculously long and useless.

When I choose a technology to integrate, the ease of debugging/trouble shooting is a factor in the decision, and, historically, DI has not faired well here.

Aspects are Best Done with AspectJ
----------------------------------

One argument I've heard for DI is that you can use the indirection to return proxy objects. You can then add method interception logic to most any class in your codebase, not just what you would necessarily switch out at runtime (per my argument about interface abuse).

I will grant that this is technically possible, especially once DI infects your entire codebase, but I'll counter that just being a possibility is not justification in and of itself.

I've had good luck with AspectJ, a technology specifically built for weaving method interception throughout your codebase, and, so far, think it is a better choice for weaving concerns throughout layers of your codebase.

Maybe by killing all of the proxies we could finally be done with declarative transaction management. But I'll leave that alone for now.

So, What is Dependency Injection, Really?
-----------------------------------------

Global variables. That do fancy things.

Hear me out.

In a Spring `ApplicationContext`, all beans have an id. This is basically a global variable--granted, scoped to the `ApplicationContext`, so "global" is stretching it, but that is the idea.

And the "fancy things" is that the global variable is not the object instance itself, but a proxy/reference to the object that can do various things--return a new instance each time ("prototype"), the same instance each time ("singleton"), the same instance per thread ("thread local"), etc.

The `ApplicationContext` also provides a pseudo-container for starting/stopping resources.

Can We Do This in Java?
-----------------------

Factories/singletons/etc. have always been possible in Java, but the traditional techniques were very verbose. Witness the legacy singleton:

<pre name="code" class="java">
    public class ResourceA {
        private static ResourceA instance;

        public static synchronized ResourceA getInstance() {
            if (instance == null) {
                instance = new ResourceAImpl();
            }
            return instance:
        }
    }
</pre>

To me, in plain Java, riffing on Fowler's Registry pattern, this looks like:

<pre name="code" class="java">
        private final Ref&lt;T&gt; resourceA;
</pre>

Flushing out some of the code, it could look like:

<pre name="code" class="java">
    public class Registry {
        public static T getResourceA() {
            return Registry.getInstance().resourceA.get();
        }

        private static final Registry instance = new Registry();
        private final ResourceRefs refs = new ResourceRefs();
        private final ResourceRef&lt;T&gt; resourceA;

        private Registry() {
            this.resourceA = this.refs.newRef(ResourceA.class)
              .impl(ResourceAImpl.class)
              .make();
        }
    }
</pre>

Then we basically forget the Hollywood principle. It sounds cool, but it leads us down the path of DI owning all our objects (because no one wants to instantiate and wire all that crap by hand, so the DI container steps in to "help" us out of the very problem DI itself created--how convenient).

So, instead of `MyService` having `setResourceA` called automatically by DI, we can just have it call the `Registry`:

<pre name="code" class="java">
    public class MyService {
        public void foo() {
            ...
            Registry.getResourceA().doStuff();
            ...
        }
    }
</pre>

Want to switch out `ResourceAImpl`s at startup time? It's Java code, write an `if` statement.

Want to switch out `ResourceAImpl`s for a test? Write a test helper method that will set `resourceA` differently, and then put it back in `tearDown` (there should be a nice way to automate/streamline this--I have not spiked it yet.)

Or, if you wanted to be really spiffy, use static imports for `Registry.*`, and just call `getResourceA()`.

We have a little boilerplate code--the `getResourceA` static method. But, hey, `Ctrl-Shift-G` works on it, so I'll willing to trade a 3-line method for that sort of traceability.

Conclusion
----------

I'm just throwing things out here--I've used this in a small system and its worked fine so far. I've yet to do anything that required a thread local resource, so I can easily see how it would be implemented, but have not kicked the tires in practice yet.

