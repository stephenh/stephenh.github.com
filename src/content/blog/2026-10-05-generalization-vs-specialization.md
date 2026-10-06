---
title: Generalization vs Specialization
description: "Maybe why LLM output sucks so much?"
date: 2026-10-05T00:00:00Z
tags: ["AI"]
draft: false
---

A friend linked to [Jim Nielsen's post](https://blog.jim-nielsen.com/2026/online-in-2026/) about LLMs gaslighting/hallucinating Bryan Cantrill.

Jim relays what Bryan's AI said in response, when called out on it:

> What happened here is a classic AI “hallucination”. Because the phrase you shared used highly stylized, melodramatic language, “ghoulish claims”, “strike brazenly at the hearth”, my system misidentified the tone as belonging to Sideshow Bob who is famous for speaking in exactly that kind of grandiloquent Shakespearean style.

This misidentification, i.e. conflating two separate concepts as "meh close enough to be the same thing", is exactly what I see in my daily AI usage, driving agents while still reading the code.

My observation is that AI is _very good_ at generalizing (using tokens to squint & find very useful insights / knowledge / intelligence) but _generally bad_ at "specializing" that knowledge back into the artifacts it's producing.

It's like a lossy translation, where they first generalize (i.e. to tokens & reasoning, very useful & necessary to their function), but then have a hard time "going backwards", and generating output that doesn't sound awkward or esoteric.

Specifically, AI-written code frequently uses esoteric terminology, writes awkward comments, and over-engineers features--but my suspicion is that, to the LLM, my "esoteric terminology" is actually tomato/tomato to its internal token speak.

If this naive assertion is right, then I think LLMs likely have a limit on their usefulness (I know, I know, this is ludicrous to suggest!) until they can start getting "re-specialization" right.

Fwiw, I also think this generalization/specialization imbalance is why LLMs found programming so ripe for disruption: LLMs can "just output over-generalized-incoherent shit while hill climbing to the desired outcome" (vibe coding) and it can be considered a good/acceptable outcome, because software generally has a very binary outcome: the code compiled yes/no, the tests passed yes/no, etc.

But I'm not sure other domains (medicine? law?) will be as forgiving as programming, in that they probably don't have the same strict binary outcome, particularly one you can keep attempting over & over while hill climbing to success.

As a final disclaimer, this imbalance doesn't mean LLMs' generalization is not useful! It's very useful because they are so fast & broadly trained--it really is like cheating. But it's why, personally, I feel like I have to keep following them around & iterating/re-specializing their output to not suck.
