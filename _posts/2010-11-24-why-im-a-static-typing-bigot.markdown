---
layout: post
title: Why I'm a Static Typing Bigot
---

{{page.title}}
==============

As most anyone who has had a conversation about programming languages with me knows, I'm a static typing bigot.

Briefly, here's why.

What I Like About Static Typing
-------------------------------

1. Types act as documentation.

   When I read dynamically typed code, I feel completely lost looking at untyped variables and untyped method calls. What methods can I call on this variable? What does this method require of it's input parameters? What exactly is this parameter going to be? A map? An object? An int?

   Instead, you have to infer what the type is based on the method calls made against it. Sometimes this is very easy, e.g. only the `Employee` type has an `isFired` method. Other times, especially in a large/unfamiliar codebase, this is quite hard; you have to hunt down callers (usually with some form of `grep`), see what most of them are passing, and make an educated guess.

   This is basically programmer-time type inference, and, for me, requires a lot of mental overhead that distracts from the core task of understanding "what does this code really do?".

   Contrast this to a static language, where you can simply glance up to a type declaration (or hover in an IDE for inferred types), know right away what types you're dealing with, and then proceed to analyze the actual semantics of the code you're reading.

   There are several sub-points here:

   * This is why "instead of static types, I'll just add comprehensive unit tests" is not a compelling argument to me: that line of reasoning focuses soley on correctness.

     Basically, the assertion is, instead of relying on the compiler to say the code is correct, we'll use unit tests to tell us it's correct instead.

     Which I actually completely agree with. Relying on the compiler for correctness is naive, so the more unit tests, the better.

     However, unit tests do not address the documentation aspect of static typing, e.g. when I look at a method, can I immediately tell (without jumping to callers or the unit test), what the expected input types are, what the expected output types are, etc.

   * Henry-Milner-based languages (e.g. Haskell, OCaml) also implicitly focus solely on "static types for correctness", to the deteriment of types-as-documentation, because they infer so much (they can infer even method input types and return types) that they force the programmer back into programmer-time type inference.

     This was a surprising insight to me, because I'd always thought I'd really enjoy something like Haskell/OCaml, because I think they are seen as "the most pure" form of static typing.

   * I do not buy the assertion that I should not care what the types of variables are--that, like Smalltalk, objects will react to whatever messages I send them and I shouldn't care beyond that.

     While `method_missing` is occasionally very handy (see the meta-programming discussion later), in the far majority of cases, I assert simple method resolution semantics are going happen anyway (e.g. `foo.bar()` is going to call the explicitly-declared method `void bar()` in the `Foo` class), so the language might as well clue me in when this extremely common/simple case applies.

2. Types make abstractions explicit. (**Added July 2016** based on [Victor Savkin's blog post](https://vsavkin.com/writing-angular-2-in-typescript-1fa77c78d8e8#.wxyd5yv7w).)

   Really I should just copy/paste Victor's "Types make abstraction explicit" here, because it's a great point, and very well articulated.

   My inadequate summary is basically that all programming involves finding the right abstractions, and building up those abstractions up into a coherent, well-designed system.

   Writing code in either static or dynamic languages involves making these abstractions, so they are always there--the difference is that in dynamic languages, you don't even see them.

   I base this "you don't even see them" on the assertion that abstractions are, in OO languages, basically always interfaces: contracts that a set of types implement. (Or maybe type classes/etc., but same sort of thing.)

   In dynamic languages, you do have types, e.g. you can declare classes/etc., but you don't declare, or even come up with a name, the abstractions/interfaces that declare contracts across types.

   Granted, you can assert "I don't need the compiler to enforce that I implemented a contract; I have a unit test to do that", but the nuance here is that it's not about compiler enforcement (although that is nice): it's about not even having a term, a common language, to connate what the abstraction is.

3. A type system provides free, blazing-fast, pre-"unit test" type tests.

   Of course you still need real unit tests. Just like having unit tests doesn't absolve you from having acceptance tests, having type check tests does not absolve you from having unit tests.

   That made clear, to me the benefit of compiler-based type tests is the quick feedback. No matter how fast my unit tests are, a compiler can follow me along and more quickly check for trivial errors. In a mature IDE like Eclipse's JDT, this happens as you type, which is pretty darn quick.

   Assuming the type tests check, then you proceed to unit tests. Just like after unit tests check, you proceed to integration tests. Gradually progressing to slower, but more encompassing levels of tests.

4. Runtime meta-programming (adding new methods/types on the fly) is not as dynamic as one would think, and ideally can be done just as well with compile-time meta-programming.

   (In terms of meta-programming, I'm talking about Rails adding `getter`/`setter` methods for each database column to ActiveRecord domain objects, and other similar `method_missing` or `instance_eval` in Ruby or changing prototypes in JavaScript.)

   I assert most dynamic/runtime meta programming is done relatively immediately at program startup time, and then things settle down and start to look more static in nature--hence most of it could (in theory) be done just as well at compile-time (e.g. per the Rails example, by a pre-compilation "look at the database schema and generate code" code generation).

   To explain, I think a generic timeline for all meta-programming (either run-time or compile-time) is:

   1. The programmer types input-program
   2. Meta-programming magic transforms input-program to result-program
   3. The result-program runs

   In dynamic languages, step 2 is done at runtime, so it is very coupled with step 3, to where people consider them the same thing (because, yes, they are). However, I naively think that step 2 could run just as well at compile-time, after the programmer types, via compile-time meta-programming (either AST transformations or even more simple "just generate some source files" code generation).

   For example, I think it is unlikely that, after ActiveRecord adds database columns to a model class, and ActiveSupport opens up String to add helper methods, after two weeks of uptime, there will suddenly be new methods popping up in `Employee`, `String`, or other classes. E.g. "dynamic meta programming" is, in reality, not *that* dynamic; it's not "adding new dynamic behavior throughout the lifetime of the program", but more like "add a few things at program initialization time". 

   Furthermore, if meta-programming (step 2) is done at compile-time, then the result-program is also available at compile-time. So now the compiler/type-aware IDE can type check your entire program, not just the parts that don't use runtime `method_missing` or `instance_eval` (for Ruby) or runtime bytecode generation (for Java) magic.

   (Note: I still think on-the-fly changing of code, e.g. via a console/debugger, etc., is a good thing, see the "Other Notes" section below.)

   **Update:** This [blog post](http://gnuu.org/2010/12/13/too-lazy-to-type/) by Loren Segal states this point much better than I do and includes links to papers/profiling results that back up the assertion.

5. Deep down all programmers want the features of a type-aware IDE.

   Look at the success of IntelliJ's [RubyMine](http://www.jetbrains.com/ruby/) and Spring's [STS](http://www.springsource.com/developer/grails) for Groovy. (**Update in July 2016**: and now similar IntelliJ, Eclipse, and Visual Studio Code features for JavaScript.) They make programmers who've been using dynamic languages drool with their (inferred) type-aware hints (code completion), navigation, and refactoring.

   My assertion is that, if bolted-on (IDE-time) type inference is such an awesome thing, shouldn't it just be spec'd as part of the language, instead of leaving it up to ad hoc IDE implementations?

   Furthermore, if type inference (and meta-programming, per my last point) was part of the language, then the type-aware IDE could check your entire program, not just the parts that were normal/bland enough (no `instance_eval`) for the IDE-based type inferencer to figure out.

What I Don't Like About Static Typing
-------------------------------------

However, even in my bigotry, I will definitely concede static languages have their downsides:

1. Type-aware IDEs (Eclipse, IntelliJ, etc.) are hard to build and so become barriers to entry.

   Compilers themselves, for either static or dynamic languages. are a very well-known, basically solved problem--lots of books, parser libraries, etc. The compilation environment is a very static: take input text X and transform it into output code Y.

   IDEs, however, are really hard. The compilation environment is no longer static--the IDE still transforms X to Y, but while transforming X to Y, it also has to put errors on the right line, squiggles under the right words, pop ups at the right place, cache the entire program's type data to provide instant navigation, and all while the user is flying around the source file changing things and trying to make the IDE developer's life a nightmare.

   Supposedly JVM-based languages can leverage Eclipse's existing IDE infrastructure. But from looking at the Groovy and Scala IDE plugin histories, it still takes a really long time to get solid, quick integration with the Eclipse JDT.

   Type-aware IDEs also stifle innovation as they become a barrier to entry for new languages.  Designers of new languages can't just have a great language, with a great library, with a great community--they also need to invest a very non-trivial amount of time into an IDE, if they want to see the sort of massive adoption that requires getting the average autocomplete-loving programmer to switch to their new language.

2. Type systems are hard.

   Type theory is a very academic field. You don't see hobbyists sitting down and writing a new type system for their language over the weekend. But you see plenty of hobbyists sitting down and writing a new syntax for their language over the weekend.

3. Consequently, static languages always lag behind dynamic languages. Especially with regards to syntax.

   I wish static languages evolved at the rate that dynamic ones do, as I like shiny new things as much as the next programmer.

   However, the reality is that dynamically-typed languages will always evolve faster, because they need comparatively so much less infrastructure, that innovation shows up in dynamic languages first (e.g. a new language written by one guy and then eventually stewarded by a small team). And then eventually static languages will catch up, when an organization assembles a large team to crank out a new language.

   (The delay to get new static languages is also why I pine so much for compile-time meta-programming--in theory that capability would allow similar, individual-programmer-driven productivity enhancements without having to build a brand new language each time.)

4. Type systems can be too constraining, and I'll accept that they occasionally need to be circumvented for the better good.

   (However, I don't think needing to circumvent the type system (e.g. calling `foo.bar()` when the method `bar` does not actually exist) maybe 5% (if that?) of the time in your application means that the other normal/bland 95% of your program (where method `bar` does actually exist) needs to also give up type checking.)

4. Compile-time meta programming is still a fringe technique.

   Much to my chagrin, compile-time meta programming is not going to be in a mainstream static language anytime soon. Despite promising alternatives ([boo][boo], [nemerle][nemerle], [lombok][lombok], [groovy++][groovypp]), it's lacking from more leading "Java next" contenders like [Scala][scala].

[boo]: http://boo.codehaus.org
[nemerle]: http://nemerle.org
[lombok]: http://projectlombok.org
[groovypp]: http://code.google.com/p/groovypptest
[scala]: http://www.scala-lang.org

Other Notes
-----------

1. Dynamic languages are well-known for their "reload on the fly" productivity. Code can be changed without restarting a process, leading to a faster feedback loop for developers.

   I think this is a great thing--and that static languages really should be able to do this as well. Unfortunately, for the JVM anyway, until this [OpenJDK patch][hotswap] lands, you need [JRebel][jrebel] or framework-level classloader gymnastics to get more than the JVM's default "only method contents can be updated" behavior. Yeah, this is unfortunate, but a *cough* temporary *cough* limitation. **Update July 2016:** Still coughing.

   For static languages, applying the type changes, especially if any compile-time meta-programming is involved, likely means using an IDE debugger to change running types, instead of the "just retype the function in a console" approach some dynamic languages can use. But I think the effect is the same.

2. Dynamic languages often have better-designed libraries.

   Java in particular is known for it's ugly APIs. However, I assert these APIs are not due to inherent flaws in the language, they are just due to stylistic differences and/or lack of abstractions (e.g. the built-in Java library APIs are ~20 years old at this point, and have maintained backwards compatibility that entire time).

   Instead, I assert you can find well-designed APIs for most things, albeit maybe not built-in. E.g. for the frequently-cited "I can't succinctly read a file from Java" problem, see the archetypical Apache [commons-io](http://commons.apache.org/io/api-1.4/org/apache/commons/io/FileUtils.html) library, or Rickard's elegant alternative [I/O API](http://www.jroller.com/rickard/entry/a_generic_input_output_api). **Update July 2016:** Guava also has a nice [sources/sink abstraction](https://github.com/google/guava/wiki/IOExplained) that can make some nice one-liners.

   Perhaps there is a larger reason why dynamic languages have nice APIs, though my cop out assertion is just that their language designers are better at API design.

3. Language implementation choice is a very minor factor in resulting code quality.

   Perhaps I should have written this up-front as a disclaimer, but I've read very good, good, bad, and very (very) bad code in both dynamic and static languages.

   So, admittedly, the type checks, IDE tooling, etc. is quibbling, because a good programmer should be able to produce good code in either type of language.

4. As a thought experiment, let's say you're going to write a method `void foo(arg1, arg2)`.

   I assert, when you write the `foo` method, you de facto already have the types of `arg1` and `arg2` in your head. You would never write `foo` thinking "eh, whatever the type of `arg1` is, I don't care"...(unless you legitimately are writing a method that will works on all `Object`s, but there again you still have the type `Object` in your head).

   The types are actually there; all mainstream languages these days, static or dynamic, have types.

   Now, you open a code review. As your reviewer, you're basically hiding information from me: you know in your head that `arg1` is supposed to be type `Xyz`. But I don't. I have to infer it. And I might get it wrong.

   Now, someone (or you yourself) comes into the codebase 6 months later. They have to fix something in `foo`, and so look at `arg1`. They have to wonder, and again infer on their own, "what type did the author have in mind when they wrote this method?".

   In this way, you can think of static typing in terms of information theory: it communicates demonstrably more information from the author to the reviewer to the maintainer.

   This is basically a re-iteration of the "types as documentation" point, but with the thought experiment of a real-world scenario highlighting that the information is already there (at author time), in either static or dynamic languages, but effectively gets "lost" in dynamic languages.

   As a disclaimer, this line of reasoning can actually extend to local variable type inference, e.g. that `val foo = ...` is a similar disservice to reviewers/maintainers (which is [Stephen Colebourne's view](http://blog.joda.org/2016/03/var-and-val-in-java.html)). My rationalization is that with local variable type inference, you already have known types (from the declared types of method parameters/etc.) to start from and to guide your programmer-type inference. And, in IDEs anyway (unfortunately not code reviews), you can hover for the compiler-inferred type.)

Over Emphasis
-------------

I don't think I have added anything interesting to the dynamic vs. static debate, though that wasn't my intent--I just wanted to codify my opinion.

I do have a gnawing suspicion that most users of dynamic languages would, without realizing it, prefer a static language, if there existed a sufficiently robust static language with a syntax, type system, and runtime that would allow them to keep their current style of development.

That being said, there are several developers I respect who are more self-aware than this, and still love dynamic languages.

Which probably just means I put too much emphasis on static vs. dynamic typing debates.

**Update July 2016**: Since writing this post, or at least during this current phase of my career, I'm starting to feel more bold about asserting static languages are demonstrably better *for large software projects*. I'll certainly accept everyone can have personal preferences for what they personally enjoy working in. But, when you start talking about 10+ person software projects, written over 3-5+ years, with new people joining and leaving the team, the types-as-documentation rationale I think becomes a very compelling argument that the team's net productivity will be higher in a statically typed language (of course controlling for the other more important factors like test coverage, a good architecture, attention to detail, etc.).


[hotswap]: http://wikis.sun.com/display/mlvm/HotSwap
[jrebel]: http://www.zeroturnaround.com/jrebel

