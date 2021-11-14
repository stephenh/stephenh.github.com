---
date: "2018-03-28T00:00:00Z"
section: TypeScript
title: Stubs in TypeScript using Mapped Types
---

{{page.title}}
==============

Given my obsession with testing, I've been exploring different ways that best-practice "Good Dependency Injection" in Java would look like in TypeScript.

The example I've been exploring is stubbing out a client that makes I/O calls, e.g. maybe it's your database connection or DynamoDB client or what not, but in your test, you want to pass a fake/stub client so you can assert against/return dummy results.

The Reference Point
-------------------

In Java, the painful but "you'll do it and you'll like it approach" requires a trifecta of three types: your interface, primary implementation, and stub implementation (or mock if applicable).

So, something like:

```java
public interface SomeClient {
  int connect();
}

public class RealClient implements SomeClient {
  @Override
  int connect() {
    // make wire calls
  }
}

public class StubClient implements SomeClient {
  @Override
  int connect() {
    // don't make wire calls
  }
}
```

So, there are pros/cons to this approach.

As a con, it has some boilerplate, because adding a new method to `RealClient` means also adding it to the `SomeClient` interface. (And adding it to the `StubClient`, but we'd have to do that anyway.)

Another con is that if we don't control `RealClient`, and whoever wrote it did not provide us with `SomeClient`, we have to write our own wrappers, e.g. make our own `SomeClient` interface, re-type all the methods, and then a dummy `OurRealClient implements SomeClient` that just proxies all the calls through to the real one, again by re-typing all the methods. Which sucks.

So, can TypeScript do better?

First TypeScript Iteration
--------------------------

Technically with TypeScript, we could just re-implement the trifecta of types, but I'll skip that, as we're trying to explore something less boilerplate.

Initially, TypeScript's structural typing looks amazing, because we can do:

```typescript
class SomeClient {
  connect(): int {
    // make wire calls
  }
}

class StubClient implements SomeClient {
  connect(): int {
    // don't make wire calls
  }
}

function businessLogic(client: SomeClient) {
  client.connect();
}

// both of these compile
businessLogic(new SomeClient());
businessLogic(new StubClient());
```

This is pretty amazing, as we've solved several issues with the Java reference solution.

There is no boilerplate interface to maintain, we just have our stub "implement" the `SomeClient` class, and they're magically treated the same (technically we don't even need the `implements SomeClient` for `businessLogic(new StubClient())` to work, I just like adding it for intent/explicitness).

Being able to "implement a class" is something I've wanted to do for ages in Java, precisely to avoid the "crap, I need a dummy interface" boilerplate.

Our `businessLogic` function is also blithely unaware of whether it gets the real implementation or the stub. This is great because code does not have to be written up-front to know about/be coupled to our testing abstractions.

I would use this approach for everything if I could, but unfortunately it falls down as soon as we do:

```typescript
class SomeClient {
  private someState = "state";
  connect(): int {
    // make wire calls
  }
}
```

As, rather unexpectedly, now both our `StubClient` declaration and `businessLogic(new StubClient())` call have compile errors: "Types have separate declarations of a private property `someState`." 

At first, I was surprised that the private member should affect structural typing at all. Aren't they just hidden implementation details?

However, there is a good explanation in [Issue 7755](https://github.com/Microsoft/TypeScript/issues/7755) that shows, because methods like `class Foo { compare(other: Foo) }` are allowed to access the internal/private state of `other`, that then anything structurally compatible to `Foo` (e.g. that would get passed in as `other`) must also have the private members on it.

That is a good point.

However, trying the naive approach of "okay, let's just add `someState` to `StubClient` as well, even if we won't use it" alas does not work:

```typescript
class StubClient implements SomeClient {
  private someState = "pretend state";
  connect(): int {
    // don't wire calls
  }
}
```

This causes the same "separate declarations of a private property" error.

The best explanation for this that I've found is in [Issue 5070](https://github.com/Microsoft/TypeScript/issues/5070): "the idea is that privates are unique to a specific class, and can not be accessed, redefined, or assigned to from outside the class."

This is a fairly logical assertion, but AFAICT it means as soon as your class has a `private` method, structural typing is unavailable to you. Which seems disappointing.

Second TypeScript Iteration
---------------------------

I'm not really comfortable with the limitation "never use `private` methods in classes you want to stub".

So let's fall back a little bit on the Java reference approach, as with an interface we know it will have only `public` members in it.

Using mapped types, we can make a 3-liner version of the Java-esque `SomeClient` interface:

```typescript
type ISomeClient = {
  [key in keyof SomeClient]: SomeClient[key]
}
```

This uses the TypeScript `keyof` operator to loop over each *public* member of `SomeClient` (both methods and properties) and copies them to `ISomeClient`.

So because this drops the private members, we side-step the issue in the previous approach, and can now do:

```typescript
class StubClient implements ISomeClient {
  ...
}
function businessLogic(client: ISomeClient) {
  ...
}
```

Which is nice, but unfortunately we've returned to the trifecta of `ISomeClient`, `StubClient`, `RealClient`...at least `ISomeClient` is tiny, right?

Third TypeScript Iteration
--------------------------

It turns out we can be even more cute, and use generics in our mapped types, e.g.:

```typescript
type I<T> = {
  [key in keyof T]: T[key];
}

class SomeClient {
  private someState = "state";
  connect(): int {
    // make wire calls
  }
}

class StubClient implements I<SomeClient> {
  ...
}

function businessLogic(client: I<SomeClient>) {
  client.connect();
}
```

We declare a generic `I<T>` type just once, and now can use it to create "no really just the public members" interfaces for any type that we want, by doing `I<SomeClient>`, `I<SomeOtherClient>`, etc.

What's impressive is that in 3 lines, we've basically killed the millions of `IThis`, `IThat`, `IWhatever` interfaces that have littered Java codebases for the last 20 years.

And, thanks to structural typing (sans the private members that `keyof` dropped for us), our `RealClient` doesn't even have to know about our `I` type, e.g. note there was no `implements I<SomeClient>` in `RealClient`'s declaration.

```typescript
// both compile because each matches the I<SomeClient>
// type, which is "all public methods of SomeClient"
businessLogic(new SomeClient());
businessLogic(new StubClient());
```

Which means even if `SomeClient` is a 3rd-party type we don't control, we can use the `I<SomeClient>` approach to make our own code testable.

Unfortunately, our `businessLogic` function is affected, as it has to be changed to take the `I<SomeClient>` type instead of the direct `SomeClient`.

Basically it's a compromise to say "yes, I'm fine with the public view of `SomeClient`".

Kill All the Interfaces?
------------------------

With this `I` mapped-type cuteness, we can derive interfaces from any class, which means we never have to write interfaces again, right?

Well, no, admittedly, my previous quip of "killed millions of files" is a little tongue-in-cheek, as there are still valid reasons to explicitly declare an interface.

In particular, separate/dedicated interface declarations are great if you're writing a contract that you know will be implemented many times, by many public consumers.

E.g. something like `java.util.List`, which is a core Java data structure, makes a lot of sense to have a contract declared completely separately from any implementation.

It creates a good place to put contract-specific documentation, and highlights when you're changing the contract definition itself (`java.util.List`) vs. adding methods to one of the concrete implementations.

Would I Actually Use This?
--------------------------

So, as a disclaimer, I've not actually used this `I<T>` approach on a real-world project.

I think that I would, as it seems to strike a balance between "yes, I know I want to pass in test doubles" (using `I<SomeClient>` so I can pass in `new StubClient()`) vs. either a) the boilerplate of the full-blown trifecta approach, or b) the limitation of "no private members" structural typing approach.

Perhaps naively, it would be great to just use structural typing directly, and have this restriction on "private members can't be redeclared" lifted/removed from the TypeScript compiler. But I will generally trust the TypeScript knows what they are doing.

Granted, an elephant in the room is that, as far as I can tell, most JavaScript stubbing/mocking is done at the module-level (e.g. changing `import Foo from 'bar'` to be a different/fake `bar` via something like `jest.mock`), and, being JavaScript, there is no concern for type-checking that your test-double `bar` module (and the fake `Foo` it returns) matches your primary `bar` module's signature.

So, I am likely projecting a Java-ism onto the JavaScript/TypeScript world where "faking via interfaces" is just not done.

I'm not entirely sure how I feel about this (the faking via modules pattern), but I'll leave that for another post.

