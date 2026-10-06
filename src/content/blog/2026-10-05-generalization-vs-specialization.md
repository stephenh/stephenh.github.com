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

This "misidentification" is exactly what I see in my daily AI usage (driving agents but still reading the code), where AI is _very good_ at generalizing (using tokens to squint & find very useful insights/knowledge/"intelligence") but _generally bad_ at "specializing" that knowledge back into the artifacts it's actually producing.

It's like a lossy translation, where they first generalize (very useful/necessary to their function), but then have a hard time "going backwards", and generating their output in a way that doesn't sound awkward or esoteric.

Specifically, when reading/iterating on AI-written code they constantly pick esoteric terminology, write awkward comments, over-engineer features--but my naive assumption is that, to the LLM, my "esoteric terminology" is actually tomato/tomato to their internal token speak.

If my naive assertion/mental model is right, then at the moment I think LLMs are potentially at/near peak usefulness (I know, I know, this is ludicrous to suggest) until they can start getting "re-specialization" right.

Fwiw, I also think this generalization/specialization imbalance is why LLMs found programming so ripe for disruption: LLMs can "just output over-generalized-incoherent shit while hill climbing to the desired outcome" (vibe coding) and it can be considered a good/acceptable outcome, because software generally has a very binary outcome: the code compiled yes/no, the tests passed yes/no, etc.

But I'm not sure other domains (medicine? law?) will be as forgiving as programming, in that they probably don't have the same strict binary outcome, particularly one you can keep attempting over & over while hill climbing to success.

As a final disclaimer, this imbalance doesn't mean their generalization is not useful! It's very useful because LLMs are so fast & broadly trained--it really is like cheating. But it's why, personally, I feel like I have to keep following them around & iterating/re-specializing their output to not suck.
