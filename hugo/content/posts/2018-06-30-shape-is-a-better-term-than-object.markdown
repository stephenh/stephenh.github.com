---
date: "2018-06-30T00:00:00Z"
section: Languages
title: Shape is a Better Term Than Object
---


This won't be a super-long post, but lately I find myself talking more about "shapes" than "objects".

E.g. by shape, like "this method returns a list of 'things' with a first name and last name", and it doesn't really matter what "thing" is, just that it has first and last name (...and that they are strings!).

Historically for me (a Java/Scala/JVM programmer), these "things" were always objects, and so the term "shape" and "object" were pretty synonymous.

That said, the term "object" has a lot of baggage, e.g. it implies methods, polymorphism, and inheritance (oh my!).

Personally this did not bother me, because I think with judgement (and refactoring) you can differentiate between "objects that should encapsulate behavior" vs. "objects that are just data" (DTOs), and, in theory, not make a mess of things by abusing/misusing OO (and nor have to abstain from OO entirely).

However, "object" can still be a trigger phrase, which "shape" seems to avoid.

E.g. in dynamic languages, saying "the return type is `X` object" or even "the return type is `X` *type*", can start to feel like "hey now, you're trying to make this too much like Java".

But thinking of it as "the return type has `X` shape" seems more accepted, as, intuitively, of course it has a shape, and who cares about the implementation details.

Obviously, this is structural typing, which Scala [kinda/sorta did](/2011/10/04/why-no-one-uses-scala-structural-typing.html), but TypeScript does really well, as does Go (disclaimer I'm still a Go newbie).

And, besides dynamic languages, this also carries over into cross-system integration/design, where behavior can't be shipped over the wire, so objects are forced to sit out, everything is de facto shapes/DTOs.

Note that I'm still a fan of knowing shapes statically, via types or schemas or IDLs or what not. But, in general, I'm not as dogmatic about "the shapes must be objects", and instead "objects are a kind of shape", and other behavior-less/object-less shapes are fine too.

(E.g. I think I could get into a heavy FP language like OCaml, which divorces state/behavior, but still tracks the shape of its data, unlike something like Clojure/Lisp, which do the same thing, but are blithely unaware of what the shapes are as they move around.)


