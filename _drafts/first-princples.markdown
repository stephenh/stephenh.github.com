---
layout: draft
title: First Principles
---

{{page.title}}
==============

A collection of first principles from which to reason about decisions.

Note that my experience is predominantly from successful-startup/enterprise-ish environments.

I also make no claim that these are original; I'm just collecting them.

Principle of least surprise
---------------------------

You should reduce the amount of surprises future-maintainers (which is future-you) will face.

This means if you typically have a convention like `getFoo()`, don't start using `get_foo()`, because that is surprising. It will cause future-maintainer, or future-you, to stop and wonder "huh, I wonder why that is that way", and now future-you is distracted from their original task.

While formatting/naming conventions are an obvious/simple example, this extends beyond just the coding-in-the-small, to coding-in-the-large and architecture-in-the-large.

E.g. for coding in the large, you might consider "should I add this functionality to this class or a new one?" Or "should I add this functionality to this project or a new one?" If the answer is "a stranger would find it surprising that this class has this functionality", then you should put it somewhere else.

E.g. for architecture, you might consider "where should I store this state"? Maybe you could use database A or B. Maybe database A is the easiest, but it'd be really surprising, because most similar state like this is stored in database B. So prefer database B.

So, concrete actions:

* When writing code, think "would I find this surprising?" If so, don't do it, or add a comment why it has to be this way.
* When reviewing code, think "did this code surprise me?" If so, comment and ask the author to either change it, or add an explanatory comment.
* When reviewing design docs, same thing

(See [Principle Of Least Astonishment](http://wiki.c2.com/?PrincipleOfLeastAstonishment).)

A codebase should look like it was written by one person
--------------------------------------------------------

Obviously codebases are not written by one person; they are written by teams of 5-10 people, with team members coming and going over the years.

However, they should *look*, as much as possible, like they were written by one person.

It is hard to articulate how nice it is to work in a codebase like this. If you haven't, it can seem like not a big deal, e.g. why is this important? However, after you have worked in a codebase like this, you realize how nice life can be: you can easily find things, because they're all in their expected place. You can easily read code from other team members, because you all use the same convention/idioms/etc. You get to focus on the real business problems and logic.

To achieve this, you basically pick conventions and follow them. Advocate for them in code reviews. Adapt them as needed. If a convention is not working, that's fine, change it, but go change all of the old convention over to the new.

Concrete actions:

* If you find yourself doing something different than existing convention, don't.
* If you find yourself still hating that convention, lobby others to change the convention across the codebase

Code should look like the current requirements have always existed
------------------------------------------------------------------

(Originally articulated to me by Mark Dietz.)

Design and code for a 5-year codebase
-------------------------------------

Day to day, everything seems urgent. Product wants this feature now. Support needs this bug fixed now. Your partner team needs this API shipped now.

All of which is true.

However, if you get sucked in continually serving these short-term interests, you will end up *under-serving* these interests in the long-term. (This is of course Technical Debt.)

Your job as an engineer, or engineering manager, is to protect the future. Yes, PM wants 1 feature now. But over the next 5 years, they're going to want 1000 features. What is more important is being able to competently deliver all of those 1000 features, not just the 1 we're fixated on now.

(Again, disclaimer that my context is successful-, post-Ramen-noodle startups and enterprises. If you have only `N <= 4` weeks of VC money left, you live in a different context.)

When you start a new codebase, the most important thing is not getting Feature A shipped. It's ensuring the architecture, development environment, TDD cycle, deployment steps, are setup so that, over the next 5 years, Feature A will be easy, Feature B will be easy, and Feature Z will be easy.

All codebases look great when they're new and ~2,000 LOC. It takes discipline to have a mature codebase that is 50,000 LOC, 100,000 LOC, still look good, and be a productive, pleasant experience to development in.

Always choose future pleasure
-----------------------------

A higher-level articulation of several of these principles is: always choose future pleasure.

This is a fairly "Protestant", eat-your-vegetables, delayed-gratification approach to software development.

I don't have any new rationale that was not in earlier principles.

Just that software development can be both very fun, and very, very frustrating.

In my experience, if you don't practice delayed-gratification, it becomes frustrating very quickly. You get codebases that are not fun to development in. Features take a long time. Things break a lot. Developers are afraid to change things.

If you slow down, and focus on making *your* future pleasant, while that initially sounds very selfish, you, by making your future job easier, are actually providing the most business value, the most features, the best ROI for the organization.

Software development does not scale
-----------------------------------

(See [software has diseconomies of scale](http://allankelly.blogspot.com/2015/10/software-has-diseconomies-of-scale-not.html).)

Comments should explain why, not what
-------------------------------------

Comments are often maligned (and often rightly so), because "code should be self-documenting".

This is very true, for *what* the code does.

E.g. if you write `getFoo()` and add a comment that says "return the foo", you're describing *what* the method does, and yes that is redundant and not useful information.

However, if the *why* of `getFoo` is surprising, then a comment describing this rationale is very useful to future-maintainers and future-you.

E.g. "`getFoo` has to do X because if it did Y, then Z bad thing happens".

Concrete actions:

* Anytime you find yourself forced to violate the principle of least surprise, that's a good indication you should leave an explanatory comment.
* If you see "what" comments that are rundant, remove them/ask the author to remove them

Statically typed languages are just better for large scale development
----------------------------------------------------------------------

For small/personal projects, I think individual-choice, use-whatever-you-think-is-neat is just fine.

But I'm currently fairly convinced that static types are demonstratively better for large-scale development. Where "large" is teams larger than 5, and especially teams larger than 5 that are collaborating with other teams larger than 5.

See [Why I'm a Static Typing Bigot](http://www.draconianoverlord.com/2010/11/24/why-im-a-static-typing-bigot.html) for more.

The speed of your TDD cycle is the primary driver of productivity
-----------------------------------------------------------------

Software development is a constant exercise of:

* "Try this, did it work?"
* "Yes, next thing."
* "No, tweak, try again."
* "If I make the code look like this, is that cleaner?"

The faster a developer can go through this loop, the more productive they will be.

Your entire tool chain (IDE, build system, test framework, application framework) needs to be optimized for this.

For example, if the application framework takes a minute to start, then you either need to:

1. Choose a different application framework, or
2. Change your use of your application framework, e.g. remove/conditionalize any expensive startup/initialization logic, or
3. Ensure most day-to-day development is decoupled from the application framework
  * E.g. structure your primary business logic (and unit tests) so that it can run by itself, without even booting the application framework in the first place.
  * This is ideal, but is usually hard to retrofit if you didn't have it initially

As another example, if on a sufficiently large codebase, your chosen language's incremental compiler causes a noticeable interrupt to developers' flow, that is a significant con that you need to weight against the other pros of the language.

Yet another example, when working on web applications, it's very common for the production Javascript to require lots of optimization/minification, etc. This is just fine, but this should expensive minification process should never be part of a developer's regularly, daily flow/TDD cycle. It's just too expensive and time consuming.



The less layers in your code's TDD cycle, the faster you will go
----------------------------------------------------------------


Repositories are best owned by teams
------------------------------------

Full-stack/cross-functional teams
---------------------------------

Avoid serialized development
----------------------------

In complicated/enterprise environments, it's very common for a project to require output from multiple teams.

Invariably, Team A's work will require some amount of output from Team B.


Avoid thrashing
---------------

Avoid rewrites, support incremental change
------------------------------------------

Deadlines are an anti-pattern
-----------------------------


