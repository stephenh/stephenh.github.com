---
layout: post
title: Are Classes and Prototypes that Different?
---

{{page.title}}
==============

There is a lot written about class vs. prototypical inheritance, much of it very good, and so I'm not sure I have that much to add (I'm also ~5-10 years late to meaningfully contribute to the conversation).

But I do want to mention my knawwing suspicion that I don't think they are as different as people think they are.

Granted, this is likely my old-school class/OO background rationalizing a new way of thinking, but hear me out.

Class (v-table) based dispatch
------------------------------

In "static" languages, method dispatch (for (virtual) instance methods) is still done at runtime, e.g. if you have the stereotypical example of `class Dog extends Animal` and `class Cat extends Animal` and do:

```java
  Animal a = getMeAnAnimal();
  a.walk();
```

The execution of `a.walk()` will, at runtime, check if your `a` variable is a `Dog`, `Cat`, or some other `Animal`, and call the right `walk` method.

The fancy word for this is polymorphism: the `a.walk()` execution can change ("morph") into many ("poly") implementations: it could be the dog `walk` method, the cat `walk` method, etc. (I don't remember if I was more relieved or disappointed that an intimidating word like "polymorphism" was actually such a simple thing.)

It does this by, in C++ parlance (which disclaimer I've never written professionally, so bear with my potential abuse of terminology) using virtual tables ("v-tables"), which are just look up tables of "method `walk` is opcode `XYZ`".

Java works in a similar way, where each class file has a method lookup table baked into it.

(For simplicity, I'm going to avoid the tangent that C++ can have non-virtual methods.)

So, the runtime method resolution looks like:

<div style="display: flex; justify-content: center;">
<img src="/images/v-table.png" style="height: 80%; width: 80%;" />
</div>

Steps for `d1.walk()`:

1. Since `d1` is a `Dog` instance, check the `Dog` v-table for the `walk` method, it's found, call it.

Steps for `d1.jump()`:

1. Since `d1` is a `Dog` instance, check the `Dog` v-table for the `jump` method, it is not found.
2. Since `Dog` extends `Animal`, check the `Animal` v-table for the `jump` method, it is found, call it.

Note that we never look at `d1` at all (other than to determine it is a `Dog`).

Prototype (map) based dispatch
------------------------------

Now let's see how this works with prototype method dispatch, where we have a typical chained of prototypes set up, e.g. `Dog.__proto__ = Animal.prototype`, etc.

(I'm going to hand wave and assume you know about prototype chaining, e.g. we either did this by hand, or used the ES6/TypeScript `class Dog extends Animal` syntax to setup the prototype chaining for us implicitly.)

Now it looks like:

<div style="display: flex; justify-content: center;">
<img src="/images/proto.png" style="height: 80%; width: 80%;" />
</div>

Steps for `d1.walk()`:

1. Check the `d1` map for a `walk` property, it is not found.
2. Since the `d1.__proto__` is `Dog`, check the `Dog.protoype` map for `walk` property, it is found, call it.

Steps for `d1.jump()`:

1. Check the `d1` map for a `jump` property, it is not found.
2. Since the `d1.__proto__` is `Dog`, check the `Dog.protoype` map for `jump` property, it is not found.
3. Since the `Dog.prototype.__proto__` is `Animal`, check the `Animal.prototype` map for the `jump` property, it is found, call it.

Compare and Contrast
--------------------

To me, these two dispatch methods are actually very similar, at least at method execution time: they both recursively look for method implementations up a tree of boxes.

Granted, I'm using a cherry-picked example that is stereotypical OO, so perhaps of course the prototype execution is going to seem similar/obvious.

That said, I think it's interesting to examine the differences:

1. Classes/v-tables are fixed at compile-time, prototypes/map are setup at runtime.

   While the resolution of `d1.walk()` for both looks similar ("just follow some boxes"), how/when the "boxes" themselves (the `Dog` v-table or `Dog` prototype) are constructed is different.

   The `Dog` class is a static lookup table that lives in a C++ binary/Java class file and is created at compile time.

   The `Dog` prototype is a dynamic map that is populated at runtime (either by your code manually setting `Dog.prototype.walk = function() { ... }` or by the ES6/TypeScript `class Dog` syntax sugar).

   If you're using JavaScript and pretending it is Java, there is not much difference here: all of the methods declared in your ES6 `class Dog { ... }` end up in the prototype map, does it really matter?

   (E.g. as a mental exercise, you can squint and think of the first ~10ms your JavaScript app boots as a "mini-compile time", where all of your files are loaded, IIFEs are executed, and your prototype chains setup. After which, I assert in most apps, you generally leave all of the prototypes alone, and they become relatively stable/static.)

   It depends on your point of view.

   If you're using ES6 classes for everything, probably not. (Which I imagine is exactly the point of the `class` syntax.)

   However, creating prototypes at runtime means you can do very creative things: you can add methods (or values) into the prototype map that were not in the ES6 `class Dog { ... }` file. Or maybe you're not even using ES6 classes. (The OO programmer in me gasps!)

   This has the effect of methods magically showing up on your instance, e.g.:

   ```javascript
   const d = new Dog();
   doSomeMetaProgramming(d);
   d.flyToSpace(); // wow, where did that method come from?
   ```

   This can be either very fun, or very confusing.

   From the static/Java/TypeScript worldview of "I want to know which methods are good and which ones are not, so you can tell me about my stupid typos", it is not that great.

   But, alternatively, from a worldview of "I have an abstraction that doesn't neatly fit into single-class inheritance", doing this sort of metaprogramming at runtime is usually an order of magnitude easier than a comparable static-language approach.

   (The main approaches to metaprogramming for class/static languages are compile-time code generation (can be either good or bad), in-language macros (still evolving, not in most mainstream languages yet), or runtime bytecode generation (mostly awful). I think in-language macros have the most promise, but they are still maturing).

2. Prototypes treat methods and values the same.

   In Java/etc., there is a strict distinction of "methods go in v-tables" (behavior), "values go in the instance" (state). (Granted, there are static variables, but let's ignore those for now.)

   For prototype dispatch, it doesn't care: if you look for `d1.size` (a value), and it's not in `d1`'s map, it will gladly go up the prototype chain, trying to find `size`.

   Whether this is good or bad again depends on your point of view.

   On one hand, declaring "all of my cats have the same size", and modeling that as a value on the `Cat.prototype`, can be handy, as you don't need a `size` field repeated/wasted in each cat's map.

   (And, without the prototype, e.g. in class-based languages, if you still wanted to model "`size` is a value that is different based on the type", you'd have to "methodize" it, and all callers would have to use a "huh, I guess it's a method" `.size()` syntax, even if it's not really a dynamically-computed value.)

   On the other hand, if all of your cats share a litter box (state/a value), and the litter box is set on the `Cat` prototype, the litter box is going to fill up quickly and likely be a memory leak (there are linter rules against these sort of things in Ember projects, to keep models from accidentally sharing instance state on their prototypes).

   To me personally, I don't think this is a significant different in practice. I can't think of any times where having values "shareable via prototypes" or "absolutely not shareable due to v-tables" would make or break an architecture either way.

3. Prototype dispatch adds an extra initial step, where it checks the instance first.

   It the v-table world, all things are forced to be like their kind. If you have a `Dog`, its `walk` method has to act like all the other dogs.

   In the prototype world, your specific dog can be given it's own unique snowflake of a `walk` method, e.g.:

   ```javascript
   const d = new Dog();
   d.walk = function() { ... };
   ```

   Is this good or bad? ...again (sorry), it depends on your point of view.

   Do you want your program to be able to make this granular of decisions? If I'm writing code that takes a `Dog`, and calls `dog.walk()`, but it does something completely different, is that a good thing?

   On one hand, that's the definition of polymorphism (we've just added another layer), and polymorphism is good!

   But on the other hand, have I broken my abstractions? Where in my hierarchy of thinking (e.g. if I'm classifying behavior/types of animals) does this `walk` method go? It's just in some random spot in the code. How am I as a programmer going to find that? How is my IDE going to find that?

   (You can tell my biases. :-)

   There is also a performance nuance, in that the extra step of resolution (check the `d1` instance's map first) adds more work for the runtime. E.g. in Java/etc., the runtime optimizer (JIT) can create super-optimized machine code for each v-table. And then it's more or less done. In JavaScript, adding properties on-the-fly to an object basically gives it its own unique v-table (which can change at any time) and now the runtime has to: a) track when/if that happens, and b) generate unique machine code for that new shape. Which is doable, but this "haha, I changed my v-table!" complexity is exactly what led the V8 team to build Dart. That said, I think in practice JavaScript runtimes are getting so sophisticated that this is hopefully moot.

Prototypes Can Do More
----------------------

As I've read in a few other places, prototype/map-based dispatch is a superset of class-based dispatch, but not the other way around.

Which makes sense: we can model classes with prototypes, by just pretending our prototype maps (which are super dynamic/do whatever you want) are v-tables (which are static/cannot change).

This is what ES6 classes do, and many different home-grown "add classes to JS" libraries have done over the years.

But you can't go the other way around, as we can't "undo" the fixed nature of v-tables to make them behave like runtime-modifiable maps.

So prototypical inheritance is objectively more powerful.

As an unapologetic fan of static languages, this power (as I'm sure you can tell) actually makes me nervous, but nonetheless I like to understand and appreciate it, even if just observing from the safe confines of my Java/Scala/TypeScript bunker.

TypeScript Adds Some Nuances
----------------------------

Somewhat tangentially, TypeScript's type system is impressive and is blurring the lines a bit, as with things like union types, it can now model "mix types A and types B together" , e.g.:

```javascript
function makeDogFly(d: Dog): Dog & Flyable {
  ...
}

makeDogFly(d1).flyToSpace();
```

And the `flyToSpace` method call is now type-safe.

It can even do:

```javascript
function addRandomThings[T](d: Dog, t: T): Dog & T {
  ....
}

addRandomThings(d1, { newField: 1 }).newField = 2;
```

And the `newField` field access is now valid and type-safe. Which is just amazing. (I've been meaning to write a dedicated blog post on it, but to me TypeScript went from "what you choose so you don't have to write JavaScript" to "what you choose because it's a legitimately impressive/advanced language in its own right".)

This capability mitigates some of the hyperbolic "classes force me to use inheritance as my only abstraction, so prototypes are the one true way!" by teaching the compiler about type combination/composition as a first-class notion.

Which, "the compiler caught up" echos back to a section of my 2010 post, [Why I'm a Static Typing Bigot](/2010/11/24/why-im-a-static-typing-bigot.html), that posits that static languages, which are often cast in the "stodgy old solution" role, just take longer to evolve/catch up to dynamic languages (in terms of sexy syntax, new abstractions, etc.) because it's demonstrably harder to stop and teach the type system about these new things.

Another interesting musing is that the flexibility of a prototype-based runtime likely directly contributed to TypeScript's ability to have its novel type system features in the first place (or at least implement it as cleanly/quickly). E.g. on the JVM, which has the "classes are fixed v-tables" assumption baked into the runtime, it's hard for other languages to map their novel abstractions onto/around this limitation (for either substantially-different languages like Clojure or even incrementally-different languages like Scala).

The JVM has some next-gen features, e.g. Graal (that admittedly I really don't know much about), that are supposed to fix this disparity, but by an 80%/20% combination of "being built into browsers" and "already having a flexible/lowest-common-denominator runtime", JavaScript thwarted Java/the JVM as the "run anywhere" runtime de jour.

But Will This Change Your Designs?
----------------------------------

Anyway, coming back to the main topic, I personally don't think class dispatch and prototype dispatch are that different: they both "walk a tree of boxes".

In prototypes, the "boxes" are maps (objects), defined at runtime. This is both powerful as well as potentially complicated, as there are many different ways to string boxes together (see the various good/bad/personal style differences of pre-ES6 JavaScript).

In classes (for static languages, e.g. not Ruby/Python/etc.), the "boxes" are tables, defined at compile time. This is more tractable (for both programmers and the compiler) but also makes it harder to implement any novel abstractions that the compiler is not already aware of.

All said, while this is a big difference, I don't think it would fundamentally change how I build systems: when I think of objects, objects are objects.

E.g. the nouns, names, entities, types, units of single responsibilities, etc., I would use in "objects via prototypes" designs vs. "objects via classes" designs would be fairly similar, I think.

Sure, in class-based systems, "fragile base classes" can be a problem (and the other litany of anti-patterns/code smells), but wouldn't that translate to "fragile base prototypes" in a prototype-based system? Or, if it wouldn't and you're just modeling the problem with composition, wouldn't you use the same composition in a class-based system? Objects are objects.

Given this, I don't think there is a ground-breaking difference between the two (certainly not as much as, say, OO vs. FP), or at least not as much as I think people typically think.

My suspicion/bias is that the JavaScript community has been slowly figuring this out, likely implicitly/without realizing it (or, who knows, perhaps very explicitly), and this is why things like ES6 classes, TypeScript, etc., are all, as far as I can tell, becoming more popular.

