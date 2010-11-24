---
layout: default
title: Why I'm a Static Typing Bigot
---

{{page.title}}
==============

As most anyone who has had a conversation about programming languages with me knows, I'm a static typing bigot.

Briefly, here's why.

What I Like About Static Typing
-------------------------------

1. A type system is basically free tests.

   Of course you still need real tests, but it's all about quick feedback. No matter how fast my unit tests are, a compiler can follow me along and check for trivial errors. In a mature IDE, this happens as you type, which is pretty darn quick.

   Assuming the type tests check, then you proceed to unit tests. Just like after unit tests check, you proceed to integration tests. Gradually progressing to slower, but more encompassing levels of tests.

2. Deep down all programmers want the features of a type-aware IDE.

   Look at IntelliJ's [RubyMine](http://www.jetbrains.com/ruby/) and Spring's [STS](http://www.springsource.com/developer/grails) for Groovy. They make programmers who've been using dynamic languages drool with their (inferred) type-aware hints, navigation, and refactoring.

   My assertion is that, if bolted-on type inference is such an awesome thing, shouldn't it just be spec'd as part of the language, instead of leaving it up to ad hoc IDE implementations?

   Furthermore, if type inference (and meta-programming, per my next point) was part of the language, then the type-aware IDE could check your entire program, not just the parts that were normal/bland enough (no `instance_eval`) for the IDE-based type inferencer to figure out.

3. Most dynamic meta programming is done relatively immediately at program startup time, and then things settle down and start to look more static in nature--hence most of it could just as well be done at compile-time.

   I think a generic timeline for meta-programming is:

   1. The programmer types input-program
   2. Meta-programming magic transforms input-program to result-program
   3. The result-program runs

   In dynamic languages, 2 is done at runtime, and is very coupled with 3. I naively think that 2 could run just as well at compile-time, after the programmer types, via compile-time meta-programming (AST transformations).

   For example, I think it is unlikely that, after ActiveRecord adds database columns to a model class, and ActiveSupport opens up String to add helper methods, after two weeks of uptime, there will suddenly be new methods popping up in `Employee`, `String`, or other classes.

   Furthermore, if meta-programming is done at compile-time, then the results would be available to the type-aware IDE and it could now type check your entire program, not just the parts that don't use runtime `method_missing`, `instance_eval` magic.

   Unfortunately, compile-time meta-programming is not available in a mainstream language yet.

What I Don't Like About Static Typing
-------------------------------------

However, even in my bigotry, I will definitely concede static languages have their downsides:

1. Type-aware IDEs are hard.

   As nice as they are, type-aware IDEs also stifle innovation as they become a barrier to entry for new languages.
   
   Designers of new languages can't just have a great language, with a great library, with a great community--they also need to invest a very non-trivial amount of time into an Eclipse plugin.

2. Type systems are hard.

   Type theory is a very academic field. You don't see hobbyists sitting down and writing a new type system for their language over the weekend. But you see plenty of hobbyists sitting down and writing a new syntax for their language over the weekend.

3. Consequently, static languages always lag behind dynamic languages. Especially with regards to syntax.

   I wish static languages evolved at the rate that dynamic ones do, as I like shiny new things as much as the next programmer.
   
   This is mostly why I pine so much for compile-time meta-programming--that it would hopefully allow similar, programmer-driven productivity enhancements without having to build a new language each time.

4. Type systems can be too constraining. I'll accept that they occasionally need to be circumvented for the better good.
   
   (However, I don't think needing to circumvent the type system maybe 5% (if that) of the time in your application means that the other, more normal, bland 95% of your program needs to also give up type checking.)

4. Compile-time meta programming is still a fringe technique.

   Much to my chagrin, compile-time meta programming is not going to be in a mainstream language anytime soon. Despite promising alternatives ([boo][boo], [nemerle][nemerle], [lombok][lombok], [groovy++][groovypp]), it's lacking from more leading "Java next" contenders like [Scala][scala].

[boo]: http://boo.codehaus.org
[nemerle]: http://nemerle.org
[lombok]: http://projectlombok.org
[groovypp]: http://code.google.com/p/groovypptest
[scala]: http://www.scala-lang.org

Other Notes
-----------

1. Dynamic languages are known to "reload on the fly".

   Static languages (on the JVM anyway) really should be able to do this as well. Unfortunately, until this [OpenJDK patch][hotswap] lands, you need [JRebel][jrebel] or framework-level classloader gymnastics. Yeah, this is unfortunate, but a temporary limitation.

2. Dynamic languages often have better designed libraries.

   Java in particular is known for it's ugly APIs. However, very often, the problem is just that an API lacks higher levels of abstraction, and is not related an inherent language flaw.

   Perhaps there is a larger reason why dynamic languages have nice APIs, though my cop out assertion is just that their language designers are better at API design.

3. Language implementation choice is a very minor factor in resulting code quality.

   Perhaps I should have written this up-front as a disclaimer, but I've read very good, good, bad, and very (very) bad code in both dynamic and static languages.

   So, admittedly, the type checks, IDE tooling, etc. is quibbling, because a good programmer should be able to produce good code in either type of language.

[hotswap]: http://wikis.sun.com/display/mlvm/HotSwap
[jrebel]: http://www.zeroturnaround.com/jrebel

Over Emphasis
-------------

I don't think I have added anything interesting to the dynamic vs. static debate, though that wasn't my intent--I just wanted to codify my opinion.

I do have a gnawing suspicion that most users of dynamic languages would, without realizing it now, prefer a static language, if there existed a sufficiently robust static language with a syntax/type system/runtime that would allow them to keep their current style of development.

That being said, there are several developers I respect who are more self-aware than this, and still love dynamic languages.

Which probably just means I put too much emphasis on static vs. dynamic typing debates.

