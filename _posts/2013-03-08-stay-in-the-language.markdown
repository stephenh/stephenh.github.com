---
layout: post
title: Stay in the Language
section: Languages
---

{{page.title}}
==============

I made a "gumpy old man" comment, on a G+ post from [Mike Brock](https://plus.google.com/u/0/109101057654691472275/posts/97b5HKdkMkS) this morning.

The topic was some new IntelliJ support for [Errai](http://www.jboss.org/errai), JBoss's GWT framework. The new IDE support allows cool stuff like auto-completion in templates based on the user's annotated view classes.

It does this because these annotations/glue code are filled in later at GWT compile time, so it's very useful to provide the user with instant/up-front feedback that something will break later on. Which is a great goal. Faster feedback cycles.

Here's my comment:

---

"This reminds me of Groovy, where the language was dynamic, but, contrary to the delusions of the Groovy committers, in reality the majority of Groovy users really did want (in 90% of their code) static type checking/intellisense/etc.

So, since it couldn't be in the language, they built static checking into the IDEs.

IntelliJ is really awesome at this game, of finding languages and frameworks that are dynamic enough that users love the static tooling they can bring to the table.

...but at the end of the day, it seems like all of this inference/etc. should be in the language proper, instead of glued on the side and rewritten by each IDE (IntelliJ/Eclipse/Netbeans).

Granted, templates are a different beast, and I'm sure this is a boon to Errai users, so that's awesome. The IntelliJ guys are amazing at what they do.

But, personally, I just like approaches to templates, and frameworks in general, that, as soon as possible, handle control back over to language proper, so that the default tooling/language semantics can take over."

---

This ties in a lot with my feelings of code generation--to me, code generation "done well", scans external artifacts (templates, databases, schemas, etc.) and turns them into representations that the user-code can program directly against.

This is a great approach, because as soon as the user-code has an in-language representation (some generated interface/class), it's "business as normal", and all of the existing tools (auto-complete, type checking, etc.), "just work".

In contrast, code generation approaches that are "post-compile" (e.g. GWT's deferred binding, which runs after the user's code is compiled, or most annotation/CDI/runtime bytecode-generated based approaches) do not create in-language representations, or at least ones that users can program directly against.

The result is that built-in tooling doesn't work, so you need to rely on IDEs plugins that re-implement/re-use 90% of the code generation logic, but this time only to provide extra hints that tell the user "oh right, when code generation eventually runs, this is going to fail".

**In my opinion, if we run the code generation up front, a framework should get all of that error checking for free.**

This opinion is the basis for a lot of my open source projects:

* [Joist](http://joist.ws) (an ORM that does all code generation up-front off the schema),
* [Tessell.org](http://www.tessell.org) (GWT framework that, among other things, parses templates up-front), and
* [dtonator](http://www.dtonator.org) (DTO generator that parses a YAML file up-front, plus some reflection, to pre-generate DTOs + mapping code).

I won't say these any of these projects are perfect, but in my experience the approach has worked well.

I am biased, and of course intimately familiar with these projects, but the approach seems both simpler to implement and simpler to debug. Because if/when things go wrong, you have visible output on your hard drive to "control-click" through, instead of "crazy stuff happened at runtime".

Of course, YMMV, there are multiple ways to skin a cat, etc.

