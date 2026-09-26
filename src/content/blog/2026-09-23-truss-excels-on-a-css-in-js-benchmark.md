---
title: Truss Excels on a CSS-in-JS Benchmark
description: "We ran some benchmarks on our niche CSS-in-JS library and it did really well"
date: 2026-09-23T00:00:00Z
tags: ["React"]
draft: true
---

## What is Truss

[Truss](https://github.com/homebound-team/truss) is our niche CSS-in-JS library that **I do not expect anyone else to use** 😅, and only exists because:

1. We started a large React SPA in ~2020 before Tailwind won, and at the time preferred Tachyons syntax (shorter atomic class names)
2. The original Truss v1 used Emotion for very robust style combination across component library/application boundaries that Tailwind could not easily handle at the time
3. We sat out the Next.js wave of hype & kept our boring React SPA architecture where Emotion just kept working. 💪
4. When StyleX came out, Truss v2 cribbed its architectural approach, and is now build-time CSS like all the other cool kids 🎉

...and AI is smart enough to write React UIs in Truss as well as Tailwind 😅, so our productivity is still up. 🚀

## Benchmark Results

Anyway, on Reddit I recently saw a [CSS-in-JS benchmark](https://github.com/gajus/css-in-js-arena) go by, written by one of the authors of Bamboo CSS, which is a Panda-like, build-time CSS-in-JS framework (if I've got that right).

I naively wondered "how would Truss do on this?" 😅 ...turns out quite well!

Our fork is [here](https://github.com/stephenh/css-in-js-arena) for you to click through the details, but the two key tables are:

![Truss benchmark results compared with Bamboo, StyleX, and Panda](/images/truss-benchmark-initial.png)

We got a lot of medals! And swept the most important rows for CSS size:

![CSS size benchmark results for Truss, Bamboo, StyleX, and Panda](/images/truss-benchmark-css-size.png)

Honestly I did not expect this result, because Truss has always prioritized DX for maintaining large, complicated applications & underlying component libraries, more so than "the smallest possible output".

Such that _even if Truss had lost by ~10-100%_ on any of these axes/tests, I would likely have asserted the results were too small to matter, and just keep using Truss anyway. 🙈

So it's a convenient surprise that we actually do pretty well. :-)

## Why Did We Win?

The explanation for why we win, particularly against S-tier optimized libraries like StyleX, is very simple: **our class names are shorter than everyone else's**.

I.e. while StyleX hashes its atomic class names to `.x1u7kmwd` because "that is the correct thing to do at Facebook scale" (or something like that 😅), Truss leans into our Tachyons abbreviations like `Css.df.mt2.$` that _already have to be unique_ and so just outputs class names like `df mt2`.

And that's it -- nothing actually that magical. 🤷

**AND ALSO TOTALLY WRONG!** 🤦

Our names are shorter than Bamboo's and Panda's, which average ~16 characters because they encode the property & value directly into the name.

But StyleX's hashed names average ~7 characters, and Truss's names average ~9. So after our initial "cutely short" `mt2` class names, the rest of our semi-human-readable class names end up _longer_ overall.

So the real reason we win? Our even longer class names actually _compress shorter_ because, being semi-human-readable, they have less entropy. 🤯

I.e. StyleX's hashed names are essentially "too random", and don't compress as well as Truss's semi-human-readable abbreviations that repeat a lot of the same patterns & prefixes.

We confirmed this by renaming Truss's class names, in its existing/otherwise as-is benchmark output file, to match StyleX's random 8-character hashes, re-compressing, and the result was nearly identical compressed output sizes.

I will admit I had no idea this "use `mt2` for class names" would positively affect compression size when starting Truss v2--it just seemed like a neat idea, and honestly I was doing it for better DX (seeing `mt2` in Chrome DevTools) and the fact we got better compression as a free bonus, I did not even realize until writing up this blog post. 😅

## CSS Specificity Tangent

I originally went down an "ALSO WRONG!" rabbit trail about how StyleX vs. Truss output sizes were different because of their different handling/encoding of CSS specificity rules. But that was also a nothingburger.

Truss purposefully uses/steals StyleX's specificity approach nearly verbatim: we categorize every CSS property into StyleX's same CSS shorthand vs. longhand tiers (i.e. an atomic class name setting `margin-top` should override a class name setting `margin`, which the browser won't necessarily do by default).

That said, we use the assigned priority differently--StyleX encodes the priority into the selector itself (either via a `@layer` or the repeated `:not(#\#)` hack), while for Truss we (maybe naively) lean into total control of output order, and just sort the stylesheet by the priority order, so the last definition wins.

Initially I thought this difference in "selector encoding" vs. "output ordering" mattered, and that it was what nudged Truss ahead of StyleX in terms of lower output size.

But even StyleX's `:not(#\#)` hack (which might be repeated 1-7x per rule, depending on the property's tier, effectively acting as a `@layer` polyfill), compresses _very well_. Specifically, there were 1,440 copies of `:not(#\#)` in StyleX's original benchmark output, but dropping them all by enabling the `useCSSLayers` flag saved a grand total of **70 bytes**.

I.e. as a mental model takeway, the same 10-character string repeated 1,000s of times in a file ends up, post-compression, being essentially free.

## What about Tailwind?

Just for kicks, I also added Tailwind to this same benchmark, in [this branch](https://github.com/stephenh/css-in-js-arena/pull/2), and we lose a few medals:

![Benchmark results comparing Truss, Tailwind, Bamboo, StyleX, and Panda](/images/truss-benchmark-tw-wins.png)

But we still win all the output size metrics, where Tailwind is one of the laggards:

![CSS size results comparing Truss and Tailwind with Bamboo, StyleX, and Panda](/images/truss-benchark-tw-size.png)

Honestly I haven't taken the time to ask the LLM "why is Tailwind a laggard", when in theory it'd use ~relatively similar "lots of repeated patterns" names like Truss, and so should compress really well. It's easy enough to "just ask the LLM", but then very hard to trust/audit that the answer is accurate -- i.e. my earlier CSS specificity tangent was directly from me trusting an overly-confident LLM on its first few assertions.

The medals we lost were to build-time/dev-time metrics, where the Tailwind compiler is ~10-30% faster than Truss, but on small enough numbers that 🤷 I think it's a wash.

Disclaimer, I did try & benchmark hack our build times to beat Tailwind, and we got closer 🏃, but couldn't actually pull ahead, at least with the current Babel/JS pipeline. Maybe next hack day! 😅
