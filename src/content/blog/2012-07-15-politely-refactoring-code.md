---
title: Politely Refactoring Code
description: ""
date: 2012-07-15T00:00:00Z
tags: ["Todo"]
---


I just read Bob Martin's [Clean Coder](http://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) and really enjoyed it. (Thanks, [Blaine](http://blog.blainebuxton.com/), for the book recommendation!) There are quite a few "back in the day" stories, but I overall liked and enjoyed Bob's points about professionalism in software development.

He also makes a very convincing case for [TDD](http://en.wikipedia.org/wiki/Test-driven_development), which I had generally considered myself a practitioner of. But after reading Bob's book, sheesh, I'm an amateur, as I frequently violate the "3 rules" of TDD. So, I have a renewed conviction to adhere to TDD.

While discussing TDD, Bob also reiterated one of the most important, to me, aspects of having tests: it gives you the freedom to mercilessly refactor.

As I think/hope is generally understood, programmers who have solid tests can constantly change and tweak the code they maintain to make it better, without fear of breaking things. As long as the tests still pass, you're good to go. Which is fine, nothing new.

However, speaking from experience, changing code this mercilessly can get touchy when the code in question is someone else's. To the original author, the refactoring can feel like an insult, insinuating their original code was inferior.

Which, yeah, is sometimes the case. However, most of the time, evolutionary improvement is just a natural process that happens to all code, regardless of who wrote it, as programmers gain more understanding, implement new requirements, or just provide a fresh set of eyes.

So, once you do find yourself refactoring other people's code, I think you can make the process much less emotional by how you approach and implement the changes. Specifically, I think one of the most important things is to use small, explicit commits that are objectively "better".

For example, if you rip through a module, change everything up, and push out a single commit with a commit message of "Cleanup.", the original author is going to see a huge, likely incomprehensible diff (especially if they're not as experienced in the language as you are), utter "wtf, this is not cleaner," and generally resent your efforts.

Instead, if you make small commits, e.g. "Format", "Use nicer variable names", "Extract method foo to class Bar", etc., breaking the previous 1 large commit into 20 small, incremental ones, you explain and document each step of the process.

Now when the original author sees the changes, either after `svn up` or in a code review, instead of a large "just trust me, this is better" diff, they should be able to follow along and generally agree that each small step is a gradual improvement. Then, instead of the "wtf" reaction, hopefully the reaction is "okay, I can see how/why this really is better...cool".

Besides the immediate communication, my other intent with this approach is pedagogical. Hopefully when the original author sees each commit, they will internalize that one small improvement and, in the future, be able to apply the same refactoring to their own code. Granted, whether or not this learning takes place ultimately depends on the initiative and competency of the original author.


