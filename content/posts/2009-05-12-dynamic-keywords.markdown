---
date: "2009-05-12T00:00:00Z"
categories:
  - Languages
title: Dynamic Keywords
---

Dynamic Keywords
================

One of the things I love about [boo](http://boo.codehaus.org) are its [macros](http://boo.codehaus.org/Syntactic+Macros) that allow you to rewrite the AST at compile time.

This makes a lot of sense. All of malleability that people loves in dynamic languages like Ruby and Groovy, screwing with classes at runtime, etc., to me, should be done at compile time. 

Typically, meta-programming in dynamic languages is only performed at load time anyway, when the interpreter first loads a file...it is not like after being deployed for 2 weeks, the Employee object suddenly gets another attribute added to it. At least I hope not.

Historically it has not been possible to plug into the compiler of type-safe languages, so it was easier to go with dynamic languages that let you screw with their types. I've seen Scala making some progress towards type-safe compiler plugins, but they seem non-trivial to write. Though, granted, I have no real experience other than glancing at them and thinking "wow, looks hard."

Anyway, back to boo, what I find intriguing is if a language was macros all the way down...i.e. even basic constructs like `class`, `method`, and `if` were not baked into the syntax, but just macros that ship by default and that you could override/add to as needed.

I think the result would end up looking something like [io](http://www.iolanguage.com/), albeit with the magic happening at compile-time instead of runtime.

I've been typing out a syntax:

    class Foo extends(Object) implements(Bar)
        field name

        method bar param(p1, String) param(p2, String)
            ...
        end
    end

Where `class` is a shipped macro. `extends` and `implements` are...additive-macros? I dunno, either options baked into the `class` macro itself, or, ideally, layered onto the `class` macro. So, conceptually, you could add your own extensions, e.g. `class Foo mixin(Bar)` or what not.

The `field name` and `method bar` lines are a little jarring at first--in C-based languages, the field-ness/method-ness is taken for granted by being baked into the syntax, so you don't have to explicitly say "I'm doing a field now", "I'm doing a method now".

What I don't have an intelligent answer for is how to differentiate between regular runtime method calls and AST-mucking compile-time macro calls.

Maybe something silly like prefixes, e.g. `$class Foo` or `@class Foo`. A little too Perl for my liking. I also thought of suffixes, e.g. `class: Foo`, `field: name`, which seems better.

There is a risk of ending up too fancy--a mailing list discussion recently made the comment that Java hits a sweet spot of being simple enough to just glance at and understand, without having to know all of the concise DSL-enabling syntax tricks of Ruby/Groovy.

Nonetheless, if done right, I think macros all the way down would be very cool.

