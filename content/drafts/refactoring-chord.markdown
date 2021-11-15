---
layout: post
title: Refactoring Chord
---

Lately I've been using a series of refactorings that has worked well to break up large classes into smaller concerns. The series consists of several steps:

1. Extract Method,
2. Make Static (if possible),
3. Move Method or Extract Class (if appropriate)

For example, let's say you start with a large method:

    public void foo() {
      for (Thing thing : getThings() {
        // ...
        // some random logic with thing
        // ...
      }
    }
{: class="brush:java"}

The random logic is too big for just `foo`, so first we apply the common Extract Method:

    public void foo() {
      for (Thing thing : getThings() {
        someRandomLogic(thing);
      }
    }

    private void someRandomLogic(Thing thing) {
      // ...
      // some random logic with thing
      // ...
    }
{: class="brush:java"}

So, smaller methods are good, this is better than it was before.

But I think this is where a lot of people stop. If we keep pushing forward, let's see what happens.

Specifically, a good question to ask is: does `someRandomLogic` use any instance fields of the class it's in? If not, and it only uses parameters that `foo` has passed to it, we can make it static:

    public void foo() {
      for (Thing thing : getThings() {
        someRandomLogic(thing);
      }
    }

    private static void someRandomLogic(Thing thing) {
      // ...
      // some random logic with thing
      // ...
    }
{: class="brush:java"}

This seems like a trivial change, but it highlights that `someRandomLogic` doesn't really belong in this class. Since none of the instance's fields are being used, it's fairly obvious `someRandomLogic` is not related to the core purpose of the class.

This now gives us a few options. For `someRandomLogic`, we can:

1. Leave it where it is

   This is fine for a few, small utility methods. If anything, the static methods are now easier to test because they don't require an instance of the containing class to be instantiated.

2. Move it to a `XxxUtil` class

   This works well for larger utility methods, especially those that are going to be used by other classes.

3. Move `someRandomLogic` into the class of one of it's parameters, e.g. `Thing`

   This may make sense if `someRandomLogic` makes heavy use of `Thing`'s getters, indicating it's really the responsibility of `Thing`. This assumes that you own the source for `Thing` and can easily introduce this new functionality.

4. Make a new class that represents what `someRandomLogic` is trying to do but is separate from `Thing`

   This is the most elegant outcome, where `someRandomLogic` hints at a new concern that had not previously been explicitly stated in your code, but that now will live nicely in some new, appropriately named class that likely has some/all of `someRandomLogic`'s method parameters as its own instance fields.

I need a better example.

---

Extract static method + inline local variables.
