---
title: Rewriting Comments by Hand
description: "Effective reps on AI generated content"
date: 2026-10-22T00:00:00Z
draft: true
---

Of course I use AI to write all my code lately 🤖, but I'm still in the camp of reading the code, my assertion is pragmatically: I still catch so many dumb mistakes (despite passing the tests, despite adversarial code reviews, etc) that I personally am not comfortable absolving that responsibility yet.

(Outside of vibe-coded hobby projects, where I _mostly_ don't look at the code. 😅)

Anyway, given that context, one of my favorite new tactics is **rewriting the AI's awkward, esoteric comments BY HAND**. 😱

I know it's easy to either a) not care about the awkward comments (again 😱) or b) just nudge the AI to "please rewrite it better for me this time" (which tbh is often the right call).

But, for the ~handful of key comments--the ones that will really help future me, future maintainers, future AI know wtf we're doing _and why_--I've found two upsides to rewriting by hand:

1. They will actually be good.

   AI is great for many things, but articulating rationale in prose is something that, at the moment anyway 😅, experienced humans are still better at.

   Note that I don't mean just copy editing out the AI slop terms of "load bearing" and "gate"--because you can tell the AI to do that copy editing, sure.

   I mean really stepping back and articulating, in ~2-3 simple sentences/phrases, why we're doing what we're doing.

   Applied consistently, this practice makes all the difference in a codebase staying robust, healthy, and enjoyable for long-term development--it really is one of my "secret sauces" and so far something AI cannot replicate.

2. You can ask the AI to check your rephrase for accuracy, and then _debate back & forth when it's not_.

   Honestly it's somewhat embarrassing how often my first rewrite-by-hand is not 100% correct, __which is great__ because it means I've missed some understanding of the code/approach, and now the AI & I can debate that.

   Did the AI do something smart, and I just missed it? Honestly often yes.

   Did the AI do something dumb or over-engineered that my rephrase is catching that it doesn't need to do? Also often yes.

   Whatever the result (I'm wrong, the AI's wrong, we're both mostly right, etc) the outcome is better understanding for both myself and the AI.
