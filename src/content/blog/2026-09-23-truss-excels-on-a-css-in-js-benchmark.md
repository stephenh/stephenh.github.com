---
title: Truss Excels on a CSS-in-JS Benchmark
description: "We ran some benchmarks on our niche CSS-in-JS library and it did really well"
date: 2026-09-23T00:00:00Z
tags: ["React"]
draft: true
---

## What is Truss

[Truss](https://github.com/homebound-team/truss) is our niche CSS-in-JS library that **I do not expect anyone else to use** 😅, and only exists because:

1. We started a large React SPA in ~2020 before Tailwinds won, and at the time preferred Tachyons syntax (shorter atomic class names)
2. The original Truss v1 used Emotion for very robust style combination across component library/application boundaries that Tailwinds could not easily handle at the time
3. We sat out the Next.js wave of hype & kept our boring React SPA architecture where Emotion just kept working. 💪
4. When StyleX came out, Truss v2 cribbed its architectural approach, and is now build-time CSS like all the other cool kids 🎉

...and AI is smart enough to write React UIs in Truss as well as Tailwinds 😅, so our productivity is still up. 🚀

## Benchmark Results

Anyway, on Reddit I recently saw a [CSS-in-JS benchmark](https://github.com/gajus/css-in-js-arena) go by, written by one of the authors of Bamboo CSS, which is a Panda-but-build-time style CSS-in-JS framework (if I've got that right).

I naively wondered "how would Truss do on this?" 😅 ...turns out quite well!

Our fork is [here](https://github.com/stephenh/css-in-js-arena) for you to click through the details, but the two key tables are:

![Truss benchmark results compared with Bamboo, StyleX, and Panda](/images/truss-benchmark-initial.png)

We got a lot of medals! And swept the most important rows for CSS size:

![CSS size benchmark results for Truss, Bamboo, StyleX, and Panda](/images/truss-benchmark-css-size.png)

Honestly I did not expect this result, because Truss has always prioritized developer DX for maintaining large, complicated applications & underlying component libraries, more so than "the smallest possible output".

Such that _even if Truss had lost by ~10-100%_ on any of these axis/tests, I would likely have asserted the results were too small to matter, and just keep using Truss anyway. 🙈

So it's a convenient surprise that we actually do pretty well. :-)

## Why Did We Win?

The explanation for why we win, particularly against S-tier optimized libraries like StyleX, is very simple: **our class names are shorter than everyone else's**.

I.e. while StyleX hashes its atomic class names to `.css-123123` because "that is the correct thing to do at Facebook scale" (or something like that 😅), Truss leans into our Tachyons abbreviations like `Css.df.mt2.$` that _already have to be unique_ and so just outputs class names like `df mt2`.

And that's it -- nothing actually that magical. 🤷

**AND ALSO TOTALLY WRONG!**

Overall StyleX's hashed class names are actually _shorter_ than Truss, b/c after Truss's "cutely short" `mt2` class names, the rest of our semi-human-readable class names end up _having a longer average overall_.

So the _real reason we win_: our even longer class names actually _compress shorter_ because, being semi-human-readable, they have less entropy. 🤯

I.e. StyleX's hashed names are essentially "too random", and just don't compress as well as our semi-human-readable abbreviations that repeat a lot of the same patterns & prefixes.

I will admit I had no idea this "use `mt2` for output class names" would positively affect compression size when starting Truss v2--it just seemed like a neat idea. 😅

## CSS Specificity Tangent

I originally went down an "ALSO WRONG!" rabbit trail about how StyleX vs. Truss output sizes were different because of their different handling/encoding of CSS specificity rules. And that was also a nothingburger.

Truss purposefully uses/steals StyleX's priority approach nearly verbatim, and the only difference is that we (maybe naively) lean into total control of output order (so can let last definition win), & don't use either of StyleX's `:not` or `@layer` approaches.

Initially I thought this mattered, and nudged Truss ahead of StyleX, but both StyleX's `:not` specificity nudge (even when repeated ~2-4x on every rule, basically emulating `@layer`s) and `@layout` themselves compress _very well_ and so don't really matter

I.e. `:not`s would add ~25% of raw CSS overhead to StyleX output (which is why it initially seemed very material to me), but it would disappear in the brotli compression (because it was just the same string repeated ~1000s of times as a rule suffix, so actually cheap).

## What about Tailwinds?

Just for kicks, I also added Tailwinds to this same benchmark, in [this branch](https://github.com/stephenh/css-in-js-arena/pull/2), and we lose a few medals:

![Benchmark results comparing Truss, Tailwind, Bamboo, StyleX, and Panda](/images/truss-benchmark-tw-wins.png)

But we still win all the output size metrics, where Tailwinds is one of the laggards:

![CSS size results comparing Truss and Tailwind with Bamboo, StyleX, and Panda](/images/truss-benchark-tw-size.png)

Honestly I haven't taken the time to ask the LLM "why is Tailwinds a laggard", when in theory it'd use ~relatively similar "lots of repeated patterns" names like Truss, and so should compress really well, primarily b/c it's easy to "just ask the LLM", but very hard to then trust/audit that it was accurate (i.e. my earlier CSS specificity tangent was directly from me trusting an overly-confident LLM on its first few assertions).

The medals we lost were to build-time/dev-time metrics, where the Tailwinds compiler is ~10-30% faster than Truss, but on small enough numbers that 🤷 I think it's a wash.

Disclaimer, I did try & benchmark hack our build times to beat Tailwinds, and we got closer 🏃, but couldn't actually pull ahead, at least with the current Babel/JS pipeline. Maybe next hack day! 😅


