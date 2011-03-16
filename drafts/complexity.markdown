---
layout: post
title: Complexity
---

Conclusion: Why Do We Subject Ourselves to This
-----------------------------------------------

Ruby doesn't do DI. People claims its because of its open classes and dynamic nature, they can do DI without DI. I don't buy this.

Scala has staved off DI so far (except for Jonas Boner's spike). It seems that having the `object` keyword in the language means that simple/non-DI singletons are okay now. Cool with me, I guess.

Java had lots of perfectly fine systems built before Spring came along--DI is not a requirement for a good system. Granted, it also had many crappy systems pre-Spring.

But I would blindly assert that the ratio of good systems to crappy systems remains fairly constant--despite whatever the current darling technology of the day is, many enterprise systems lack the quality of a well-maintained codebase.

I don't understand the fascination with over-engineering things. Layer this, facade that. Runtime codegen this, dynamic proxy that.

Our jobs can be so much simpler. I don't understand.


