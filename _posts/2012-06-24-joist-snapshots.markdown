---
layout: post
title: Joist Snapshots, A 2nd-Level Cache Alternative
---

{{page.title}}
==============

[Joist](http://joist.ws) 1.4.x got a new feature, Unit of Work snapshots, which I think are a neat way to handle a particular use-case that sometimes the chattiness of ORMs doesn't handle well.

The Use Case
------------

Specifically, I worked on an enterprise system once that had a fairly common pattern of:

```java
// as part of the nightly batch cycle
for (Integer parentId : allParentIds) {
  for (Integer childId : loadParent(parentId).getChildIds()) {
    for (Integer grandId : loadChild(childId).getGrandChildrenIds()) {
      // load parent
      // load child
      // perform business logic on the grand child
    }
  }
}
```

Each 3rd-level/grand child entity was processed in its own transaction. But, for an ORM, that generally means a new session, which means re-querying the database for the parent, the child, etc., on each iteration of the loop.

For a few, or even a few hundred, iterations, this isn't a big deal. But on iteration 1,000 or 10,000, re-loading the parent (and any parent-level related domain objects) on each time through the loop, and the latency inherent in that going out over the wire, starts to add up.

The Typical Solution, 2nd Level Cache
-------------------------------------

The answer most ORMs, AFAIK, have to this scenario is to turn on 2nd-level caching. Then the parent and child entities will be cached in memory, avoiding the wire call, and things will be snappy again.

However, I have a few problems with 2nd-level caching:

1. It is commonly all-or-nothing at the entity level. E.g. `Parent` is always cached or never cached.

   I dislike this lack of flexibility, because often times I don't want the caching--if I'm on the CRUD screen for the parent, I really do want to see the latest results, even if it means a wire call.

2. You're basically knowingly introducing eventual consistency throughout your system, where, sans a fancy cache invalidation scheme, you will have stale data.

   Given one of the main advantages of an RDBMS is the simplicity of the ACID semantics, I generally try and hold on to that simplicity for as long as possible, and only give it up if I absolutely have too.

   And I don't trust fancy distributed cache invalidation schemes.

For these reasons, I've generally avoided using an ORM-based 2nd-level cache.

Which is not to say I never use caching; caching is great, when appropriate. I just usually have better luck applying it more subtly than entity-level all-or-nothing. There are pros and cons to this, but I'll leave it at that for now.

An Alternative, Joist's Snapshots
---------------------------------

So, Joist's alternative was to look at this specific use case and realize the programmer probably knows *exactly what data they want to cache*, and *what the scope of that cache should be*.

I.e., in the above loop, we don't need `Parent` cached for the entire JVM, and to force every single other thread to use the cached version (especially if they don't want to, whatever their process/semantics happen to be). If they make an extra wire call, that's fine. We just don't want to make 10,000 in a loop.

Snapshots then, allow the programmer to do this, e.g.:

```java
// as part of the nightly batch cycle
for (Integer parentId : allParentIds) {
  // load parent data just once
  Snapshot s1 = UoW.snapshot(repo, new Block() {
    public void go() {
      // load parent, any other parent-level objects
    }
  };
  for (Integer childId : loadParent(parentId).getChildIds()) {
    Snapshot s2 = UoW.snapshot(repo, s1, new Block() {
      public void go() {
        // load child, any other child-level objects
      }
    };
    for (Integer grandId : loadChild(childId).getGrandChildrenIds()) {
      // now use cached parent/child data:
      UoW.go(repo, s2, ...);
    }
  }
}
```

Thanks to Java's anonymous inner classes, this is a tad verbose, but should show the basic idea.

In the outer loops, the programmer has a chance to load this level of domain objects just once. First for `Parent` level in the `s1` snapshot, and the building on top of that for the `Child` level in the `s2` snapshot.

Now with the `s2` snapshot, any loads for the `Parent` or `Child` entities (including their one-to-many relations/collections) within the grand child's Unit of Work will avoid going over the wire, and instead use the serialized state from the snapshots.

Which, yeah, this is still a cache. However, the important difference is that the programmer explicitly populates and references the cache. 

This can be a good thing or a bad thing. It does mean more code, i.e. it's not completely transparent like ORM-wide 2nd level caching is, where the client code doesn't even know it's happening. (If you want/need that, that's fine, maybe Joist will do that someday, it just does not currently.)

Personally, I find the more explicit snapshot approach to be, for this use case, both more intuitive and more precise than just saying "any `Parent` entity in the app may be ~5 minutes old".

Sometimes implicit semantics are nice, and sometimes they're too magical. It is a trade off that will depend on your situation.

However, I'll note that I think often times the more implicit approach wins de facto, just because it has less LOC. This may be perfectly fine, as I'm certainly not advocating boilerplate. But abstractions have their cost (conceptual overhead, leakiness, etc.) and that sometimes you're better off just using the more explicit approach whose semantics are easier to understand.

Future Improvements
-------------------

I should add some very basic metrics to Joist to allow easy profiling, without using a full-fledged profiler. Since often times a system won't be bottlenecked on CPU or IO, but instead always waiting on wire call latency, easily showing what the ORM is up to would be really nice.

For example, every 10-30 seconds, output the number of object loads per table, number of collection loads per table, and maybe even highlight specific objects being constantly reloaded.

E.g., for the original code snippet above, if `Parent#5` showed up in Joist's stats as being loaded more than 5-10/whatever times per 30-second interval, Joist could log an info/warning that the programmer might look into applying snapshot-style caching.

That should make hunting down ORM-level waste, or at least the low-hanging fruit that hopefully is 80% of the performance problem, pretty easy.



