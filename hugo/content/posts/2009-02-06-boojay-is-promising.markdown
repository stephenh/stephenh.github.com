---
date: "2009-02-06T00:00:00Z"
section: Languages
title: Boojay is Promising
---

Rodrigo B. de Oliveira has a new [post][1] up about his progress getting [boo][2] running in Eclipse and compiling to the JVM. This is very cool stuff.

Boo has both a wrist-friendly syntax and macro meta-programming abilities, but in a type-safe language without all the "gee, what does this code do at runtime again?" ambiguities of dynamic languages like Groovy and Ruby.

Okay, yeah, boo can't do `method_missing`, but I don't want that anyway. Closures, type inference, and macros? That's all the magic I want and need.

If you watch the video in his post, it even shows a dual view of the "regular" macro/type inferred source code that you actually type, then you can press a shortcut and see a read-only view of the "processed" source code after it has been expanded by macros and had the types filled in. I.e. you can easily see exactly what the code you write is going to end up as after the magic is applied.

Try doing that in the dynamic language of your choice.

I tried to get Rodrigo's example working on my Windows box, and it seems to be really close, but I cannot get the Mono Eclipse plugin to find my local Mono runtime, so nothing is compiling right now. But I'm not too worried--it's not ready to go just yet, but the progress is very impressive.

Boo has also impressed me with its longevity--back in the early days, it seemed like a very cool .NET hobby language that would probably fade after a few releases. IIRC, it even had an edge on C# 1.0 for awhile. Then Microsoft blew everyone away with the C# 2.0 and 3.0 releases, but, contrary to Java, boo is steadily [catching up][3].

In my opinion, boojay is currently the best "Java++" contender. I can't wait for a few more releases to go by to see where it goes.

[1]: http://blogs.codehaus.org/people/bamboo/archives/001751_experience_boojay_with_monolipse.html 
[2]: http://boo.codehaus.org
[3]: http://docs.codehaus.org/display/BOO/2009/01/27/Boo+0.9+is+here!

