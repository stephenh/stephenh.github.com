---
title: Philosophy of Software Design Notes
description: ""
date: 2019-08-25T00:00:00Z
tags: ["Books"]
---



I recently read John Ousterhout's [Philosophy of Software Design](https://www.amazon.com/dp/1732102201) and really enjoyed it.

I found his description of the challenges of software development (complexity, cognitive load, encapsulation, etc.) to be spot on.

While everyone knows "the two hardest problems in Computer Science are naming and cache invalidation", PoSD (while not directly referencing this existing rule of thumb) basically adds a 3rd: encapsulation.

The rationale being that what really limits software projects is **our ability to understand them**, and encapsulation is our primary method for fighting this complexity, i.e. hiding and breaking up complexity into smaller chunks so that we can reason about them separately.

I was originally going to call this post a "book review" but really I don't having anything super-interesting to say that is not "I agreed with basically everything in this book", which doesn't really seem like a review.

So, I'm just calling it "my notes" and jotting down the terms and definitions that stood out to me:

### Ch 2. The Nature of Complexity

**Complexity** is anything that makes a system:

1. hard to understand, or 
2. hard to modify.

Symptoms of complexity are:

1. Change amplification--simple changes require updating multiple places
2. Cognitive load--how much a developer needs to know to complete a task
3. Unknown unknowns--when its not obvious what parts of the system need to change for a task

Sources of complexity are:

1. Dependencies--anything that means the code can't be understood in isolation
2. Obscurity--when the code is just hard to follow (due to inconsistency, lack of comments)

A system's total complexity is the sum of "each module's complexity * how often that module is changed", i.e. if you hide certain complexity in parts of the system no one has to change, it is effectively not as large of a burden on total system complexity.

### Ch 3. Working Code is Not Enough

Most new code in a system extends the existing code, so your most important job is to facilitate future work.

Teams should spend 10-20% of their time on non-deliverable / technical debt / refactoring work.

The best way to lower development costs is to hire great engineers, because their productivity multiple is higher than their cost multiple.

### Ch 4. Modules Should Be Deep

Modules are anything with:

1. An interface and
2. An implementation

I.e. even functions are modules, their interface is their parameter signature, and their implementation is their method body. But also classes, etc.

"Deep" modules provide:

1. Simple interfaces, that hide
2. Complex implementations

This is basically the ROI of a module: the revenue (complexity of the features provided by the implementation) over the cost (the complexity of the interface to use it).

Examples:

1. The POSIX file API has 5 syscalls that hide a ton of caching, buffering, encoding, device, hardware, etc. details, so has a great ROI.
2. The Java file API has a ton of BufferedReader, Reader, etc. that has a much higher "cost"/complexity of using correctly, so has a lower ROI.

### Ch. 7 Different Layer, Different Abstraction

As TCP changes layers, i.e. from a top-level "reliable stream of bytes" layer to the "packets of bounded-size delivered on best-effort" layer, the abstractions change at each layer. This basically proves that each layer is doing something useful.

In software without this, i.e. layers with a bunch of pass through methods to the layer below them, without doing any real transformations ("service" layers come to mind in the EJB era), it's an indication the layer isn't actually providing any value.

Either delete it, or find the new noun/verb/abstraction that is the value it can provide.

### Ch 8. Pull Complexity Downwards

Most modules (i.e. an interface + implementation) have more users (of their API) than developers (of their implementation).

So its better ROI if **the module's developers suffer more than the module's users** (by biasing to keep as much complexity as possible hidden within their implementation, to make the interface as simple as possible).

### Ch 9. Better Together or Apart

This is a fairly anti-mainstream stance, but John asserts that breaking up large classes / large methods into a bunch tiny classes ("classitis") / tiny methods is not necessarily the right approach.

The rationale being that you've created many more modules (more APIs) that, by definition of being smaller must not be very complex (i.e. hide much complexity from the user), so have a minimal ROI on his "deep module" scale, and so end up actually *adding* to cognitive load b/c the developer has to string them all back together in his head.

I'm not sure I agree with this point; I do like the term classitis, and I think it is a bad thing, for the most part small methods are supposed to reduce cognitive load, which is one of John's goals.

### Ch 12. Why Write Comments

Good comments capture information that was in the mind of the programmer but could not be represented in code.

If a progammer must read all of a method's code to understand it, there is no actual abstraction/complexity-reduction provided, and a good comment provides this (i.e. it in effect becomes the "simple API" for the "deep module implementation").

It is possible for readers to deduce some of this information, but it's time consuming and leads to high cognitive overhead. Good comments increase the ROI by lowering the cognitive overhead.

### Ch 14. Choosing Good Names

Always use the same name for the same concept.

Never use that name for a different concept.

### Ch 14. Write Comments First

Similar to TDD, write comments first to:

1. Avoid backfilling comments (which John asserts are _always_ bad comments, but pendantically I've written a fair amount of "good comments" in legacy systems)
2. Be a design tool to tease out good abstraction layers before you commit to implementations.

This is an interesting idea that I haven't tried before, but hope to try at some point.

### Ch 16. Modifying Existing Code

Ideally, when you have finished with each change, the system will have the structure it would have had if you had designed it from the start with that change in mind. (Props also my colleague Mark for coining this rule of thumb on our prior projects.)

Comments belong in the code, not the commit log / pull request.


