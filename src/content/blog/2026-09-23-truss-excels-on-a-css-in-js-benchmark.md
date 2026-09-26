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

**AND ALSO TOTALLY WRONG!**

Our names _are_ dramatically shorter than Bamboo's and Panda's, which average ~16 characters because they encode the property & value directly into the name.

But StyleX's hashes average ~7 characters, and ours average ~9. So after our "cutely short" `mt2` class names, the rest of our semi-human-readable class names end up _having a longer average overall_ than StyleX's.

So the _real reason we win_: our even longer class names actually _compress shorter_ because, being semi-human-readable, they have less entropy. 🤯

I.e. StyleX's hashed names are essentially "too random", and just don't compress as well as our semi-human-readable abbreviations that repeat a lot of the same patterns & prefixes.

The way to confirm this is to take the entropy away: rename every class in both stylesheets to the _same_ scheme, and re-compress. Once both engines use random 8-character hashes, our 21% lead (1,355 bytes brotli) collapses to ~1.5% (96 bytes). So ~90% of our compressed win is the class names, and basically none of it is the CSS itself.

Which is admittedly humbling, because on _raw_, uncompressed bytes StyleX emits slightly _less_ stylesheet than we do (~22.1kb of rules vs. our ~23.9kb). We don't win by emitting less CSS; we win because our CSS compresses better.

I will admit I had no idea this "use `mt2` for output class names" would positively affect compression size when starting Truss v2--it just seemed like a neat idea. 😅

## CSS Specificity Tangent

I originally went down an "ALSO WRONG!" rabbit trail about how StyleX vs. Truss output sizes were different because of their different handling/encoding of CSS specificity rules. And that was also a nothingburger.

Truss purposefully uses/steals StyleX's priority approach nearly verbatim: we classify every property against the same CSS shorthand graph, and land on the same tiers (shorthand-of-shorthands, shorthand-of-longhands, logical longhand, physical longhand), so that e.g. `margin-top` reliably beats `margin`.

The only real difference is _where each of us puts that priority number_. StyleX encodes it into the selector; we (maybe naively) lean into total control of output order, and just sort the stylesheet by it, so the last definition wins.

Although we're not entirely free of specificity hacks either -- we do double the class name (i.e. `.sm_g0.sm_g0`) on media query rules, specifically so that specificity _stops_ deciding, and our sort order can.

Initially I thought this mattered, and nudged Truss ahead of StyleX. But StyleX's `:not(#\#)` nudge (repeated 1-7x per rule, depending on the property's tier) is literally its `@layer` polyfill, and both it and real `@layer`s compress _very well_, so neither really matters.

I.e. the `:not`s add ~25% of raw CSS overhead to StyleX's output (9,960 bytes, which is why it initially seemed very material to me), but nearly all of it disappears under brotli: flipping StyleX's `useCSSLayers` flag on removes all 1,440 copies, and saves a grand total of **70 bytes**. It was just the same 10-character string repeated 1,440 times as a rule suffix, so it was already essentially free.

## What about Tailwind?

Just for kicks, I also added Tailwind to this same benchmark, in [this branch](https://github.com/stephenh/css-in-js-arena/pull/2), and we lose a few medals:

![Benchmark results comparing Truss, Tailwind, Bamboo, StyleX, and Panda](/images/truss-benchmark-tw-wins.png)

But we still win all the output size metrics, where Tailwind is one of the laggards:

![CSS size results comparing Truss and Tailwind with Bamboo, StyleX, and Panda](/images/truss-benchark-tw-size.png)

Honestly I haven't taken the time to ask the LLM "why is Tailwind a laggard", when in theory it'd use ~relatively similar "lots of repeated patterns" names like Truss, and so should compress really well. It's easy enough to "just ask the LLM", but then very hard to trust/audit that the answer is accurate -- i.e. my earlier CSS specificity tangent was directly from me trusting an overly-confident LLM on its first few assertions.

The medals we lost were to build-time/dev-time metrics, where the Tailwind compiler is ~10-30% faster than Truss, but on small enough numbers that 🤷 I think it's a wash.

Disclaimer, I did try & benchmark hack our build times to beat Tailwind, and we got closer 🏃, but couldn't actually pull ahead, at least with the current Babel/JS pipeline. Maybe next hack day! 😅
