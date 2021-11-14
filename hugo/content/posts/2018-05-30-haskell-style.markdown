---
date: "2018-05-30T00:00:00Z"
section: Languages
title: Is Haskell's Complexity Artificial?
---


I recently read a book on Haskell and it was fun.

It's been a long time since "pick up language X" has taken me more than glancing at intros/tutorials, jumping in, and then hitting up Stack Overflow as needed.

Not because I'm a savant programmer, but just because even among all the various flavors of dynamic, static, functional, object-oriented, etc., most mainstream languages just aren't that different these days.

But Haskell is, for me, a "...yeah, I have to read a few books about this" challenge. (Rust would be another, albeit it's very different from Haskell.)

And it's pretty fun to be dropped back to newbie stage.

Haskell's Laziness Actually Seems Intuitive?
--------------------------------------------

That said, as I got through the book, Haskell's lazy evaluation actually seems relatively simple? Maybe deceptively so?

Initially I was thinking it would be hard to reason about, given "no other language does this!?!", which makes it sound weird and esoteric.

But it's just call-by-value vs. call-by-name, which are both terms I'd been exposed to before.

My primary exposure was from Scala, which kinda/sorta hacked call-by-name semantics into the JVM. E.g. in Scala you can do:

```scala
// note the '=>' prefix to the Seq[Int] type
def someMethod(arg: => Seq[Int]): Unit = {
  // ...
  val a = arg
  // ...
}

someMethod(Seq(1, 2, 3));
```

And, due to the fat arrow in the `=> Seq[Int]` type declaration, the `Seq(1, 2, 3)` parameter that is passed to `someMethod` will be auto-lambda'd and the `Seq` constructor will not actually be called when `someMethod` is called (i.e. construction of the `Seq` is now lazy).

Instead it's only created when the `arg` parameter is touched, on the `val a = arg` line. Which is lazy evaluation.

So, Scala has opt-in call-by-name, where as Haskell has everything call-by-name. Fair enough.

That doesn't seem too hard.

(Tangentially, Haskell also memoizes its call-by-name values, which I don't believe Scala does, as Scala's `Stream.continually(foo)` will lazily call `foo`, and also repeatedly call `foo` for each new element of the Stream. So, that is different between the two, but that doesn't seem like a fundamental shift in the mental model.)

IO Seems Fine Too
-----------------

The next "ooh scary" aspect of Haskell is that you "can't do I/O": all functions are pure (which means they only rely on their input parameters and can't make random calls off to static/global shared functions like `System.out.println` or "block while we read from disk").

So, instead there is an `IO` type, which is of course a monad. :-)

E.g. to read from standard in, Haskell has a library method `getChar`, and its  type is `IO -> IO char`, which if I Java-ize that in my head is:

```java
public static World<char> getChar(World<?> w) {
  // some native implementation
}
```

So, now to "do I/O", I can't directly touch chars, but I can pretend I do, e.g.:

```scala
public World<char> pretendImHaskell(World<?> w) {
  World<char> c1 = getChar(w);
  World<char> c2 = getChar(w);
  // ignore syntax errors
  return c1.map(c1 -> c2.map(c2 -> c1 + c2));

```

Basically, instead of directly "touching" chars, we build an AST, a DAG, of "things that *will later* muck with chars", and then return that "unevaluated AST" to Haskell.

This allows our functions to be created purely, and only later will the Haskell runtime handle the dirty work reading/writing I/O while interpreting the "AST" we handed it.

(As a disclaimer, I've never written code that actually used Haskell's `IO`; I only believe I understand the concept, so I could be wrong on some nuances. I heard [this article](https://wiki.haskell.org/Haskell_IO_for_Imperative_Programmers) is good but haven't thoroughly read it yet).

So, okay, this is different, but also doesn't seem mind-boggling complex.

So Where's the Inherent Complexity?
-----------------------------------

Checking where we are at:

* Lazy evaluation: check, I think I understand, seems fine
* IO: check, I think I understand, seems fine

Which is great, but I'm left wondering where the infamous Haskell complexity is.

Most Haskell conversations seem to quickly become academic, e.g. monads, applicatives, category theory, etc.

In my super-limited exposure so far, I haven't seen why those are necessarily needed.

Well, that's not quite true: I can see how they are necessary to massage the various shapes of "ASTs" (I basically think of monads/etc. as passing around AST-like computations of values instead of the values themselves).

E.g. applicatives, if I have it right, allow to you massage values within boxed/monads like `Option`, without doing a "verbose" `option.map { i => ... }` (again mapping to Scala concepts).

But I've done smaller-scale versions of that in Scala, and instead of refactoring everything (or introducing fancier and fancier operators) to get to the point of point-free elegance, we just call `flatMap` directly, or have a few more characters of what in Haskell would be boilerplate.

Which makes me wonder, but first a concrete example.

Two Sorting Examples
--------------------

I also recently, and rather coincidentally, worked on an interview-style sorting problem.

You can [read the question](https://www.geeksforgeeks.org/nuts-bolts-problem-lock-key-problem/) on Geeks for Geeks.

Because I'd read the Haskell book, and also had seen how simple a naive (fixed pivot) Quicksort is in Haskell, I decided to use Haskell for my solution.

Here is my first (cleaned up) attempt, which I believe is pretty canonical Haskell ([code here](https://github.com/stephenh/haskell-stutton-book/blob/master/src/boltsort.hs#L43)):

```haskell
boltsort2 :: ([Nut], [Bolt]) -> ([Nut], [Bolt])
boltsort2 ([], []) = ([], [])
boltsort2 ((n:ns), bs) = (sn' ++ [n] ++ ln', sb' ++ [b] ++ lb') where
  (sb, [b], lb) = partition (\b -> negate (compareNutBolt n b)) bs
  (sn, _, ln) = partition (\n -> compareNutBolt n b) ns
  (sn', sb') = boltsort2 (sn, sb)
  (ln', lb') = boltsort2 (ln, lb)
```

I'm using conventions I'd read in the Stutton Haskell book, e.g. `n:ns`, variable names like `sn` and `sn'`.

Granted, I have written zero lines of production Haskell, but again, I am pretty certain this is "good Haskell".

For my second attempt, I took a somewhat different approach, and kept exactly the same structure, but used "boring enterprise" variable names ([code here](https://github.com/stephenh/haskell-stutton-book/blob/master/src/boltsort-names.hs#L51)):

```haskell
-- this is basically a two-pass quicksort, which:
-- 1) picks a nut as a pivot
-- 2) partitions the bolts using the nut-pivot
-- 3) using the nut pivot to find the matching bolt pivot
-- 4) partitions the nuts using the bolt-pivot
-- 5) recurses/combines
boltsort2 :: ([Nut], [Bolt]) -> ([Nut], [Bolt])
boltsort2 ([], []) = ([], [])
boltsort2 ((pivotNut:nuts), bolts) =
    (sortedSmallerNuts ++ [pivotNut] ++ sortedLargerNuts, sortedSmallerBolts ++ [pivotBolt] ++ sortedLargerBolts)
  where
    (smallerBolts, [pivotBolt], largerBolts) = partition (\b -> negate (compareNutBolt pivotNut b)) bolts
    (smallerNuts, _, largerNuts) = partition (\n -> compareNutBolt n pivotBolt) nuts
    (sortedSmallerNuts, sortedSmallerBolts) = boltsort2 (smallerNuts, smallerBolts)
    (sortedLargerNuts, sortedLargerBolts) = boltsort2 (largerNuts, largerBolts)
```

And I included a verbose, "just repeats the code" function comment.

Looking at the two examples, "canonical Haskell" and "enterprise Haskell", my impressions are:

1. The first example tickles my reptilian programmer brain as being "ooh, sexy! So succinct! So graceful!"

2. The second example looks comparatively drab and verbose, so many wasted characters, re-typing out long variable names.
 
However, my conclusion is: the 1st is what I'd like to **write** for an interview assignment to show off--the 2nd is what I'd like **read** 6 months later when doing maintenance or fixing a critical production bug. 

(Granted, all I changed here is variable naming, and nothing about how the data is shaped.)

How Much of Haskell's Complexity is Accidental
----------------------------------------------

This basically gets me to the thrust of this post: does Haskell really have to be as complex as most people (myself included) think it is?

I don't think I'm off base in asserting Haskell is the generally realm of academics with esoteric terms and symbol-heavy programs.

However, my nagging feeling is that it does not have to be that way.

Part of what makes me suspect this is Scala. I did enough Scala to exposed to a spectrum of styles:

1. Scala that is just "better Java"
2. Scala that is a judicious blend of OO+FP
3. Scala that is "wanna be Haskell", i.e. [scalaz](https://github.com/scalaz/scalaz)

Where, for me, the "judicious blend of OO+FF" is a sweet spot of readability + cuteness that is demonstrably more succinct than just the "better Java" level, but also stops short of the "nuclear code golf" level where it exceeds the readability/reasonability of the typical programmer.

So, that is my question: are the functors, applicatives, and another terms I don't even know of, *required* to write elegant Haskell?

Or, could a person write "judicious Haskell", which would be a compromising style that was purposefully more-verbose, likely more LoC, but, in theory, dramatically easier to read and reason about?

Or, could the complexity of Haskell be necessary within the realm of the core library writers and language implementers, to build a theoretically solid foundation, but then kept more behind-the-scenes for the every-day programmer? (Which, to me, is what Scala has pulled off: Martin Odersky thinks in [Dotty](https://github.com/lampepfl/dotty) so that I don't have to.)

Writing for the Everyday Programmer (which is me)
-------------------------------------------------

I also wonder if Haskell's elegance attracts people that are basically too smart.

I've seen this in the past, where programmers who are extremely intelligent ironically end up writing harder to maintain code, because *they* have the intellectual prowess to reason about their code (at least when they write it), but no one else does.

To that end, I think one of my strengths is that I do have a limit on the complexity I can hold in my head, so I push for simplicity as a trump card, even at times sacrificing sacred cows like DRY.

So, that makes me curious, if "everyday Haskell", or "judicious Haskell", would be a viable style.

I've never written production Haskell code (and likely never will, not out of prejudice, but just realistically), so I personally don't know.

Or maybe such a "judicious Haskell" style exists already, and I'm not aware of it.

Or, as a final disclaimer, I am still very much on the Haskell-newbie spectrum, so perhaps once a few weeks/months of everyday-coding acclimation goes by, all of this becomes second nature, and I'm making much to do about nothing.

My suspicion is that that is not the case, but it could be.


