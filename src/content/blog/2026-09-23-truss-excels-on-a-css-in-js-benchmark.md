---
title: Truss Excels on a CSS-in-JS Benchmark
description: "We ran some benchmarks on our niche CSS-in-JS library and it did really well"
date: 2026-09-23T00:00:00Z
tags: ["React"]
draft: true
---

## What is Truss

[Truss](https://github.com/homebound-team/truss) is our niche CSS-in-JS library that **I do not expect anyone else to use** 😅, and only exists because:

1. We started several large apps in ~2020 before Tailwinds won, and at the time preferred Tachyons syntax
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

I.e. while StyleX hashes its atomic class names to `.css-123123` because "that is the correct thing to do at Facebook scale", Truss leans into our Tachyons abbreviations like `Css.df.mt2.$` that _already have to be unique_ and so just outputs class names like `df mt2`.

And that's it -- nothing actually that magical. 🤷

**AND TOTALLY WRONG!**

Overall StyleX's hashed class names are actually _shorter_ than Truss, b/c after Truss's "cutely short `mt2`" class names, the rest of our still-human-readable class names end up averaging higher overall.

Instead, we are smaller because of a more nuanced reason: different CSS specificity solutions.

### Specificity What?

Atomic's CSS "every unique class name defines a singular style rule" seems safe: if an element's `class` attribute has 20 class names, each class contributes its own style rule (one sets `margin`, another `color`, another `padding`, etc), and that's it.

But sometimes the classes actually define properties that "overlap", or define the same(ish) CSS property like `margin`, and we have to decide "which `margin` value wins"?

Initially it seems like a bug for a programmer to put "two margins" in a single `class` attribute, and expect rationale behavior, but there are two scenarios where it happens often:

- CSS shorthands (`margin`) vs. longhands (`margin-top`), and
- media queries.

The first case is longhands, i.e. given this example:

```html
<style>
.a { margin: 2px }
.b { margin-top: 4px }
</style>
<div class="a b" />
```

The author's intent is for the "longhand" `margin-top: 4px` to win over the "shorthand" `margin: 2px`.

But given the `div class` has _both_ class names, how does the browser know to apply `margin-top: 2px` implied by `a` or `margin-top: 4px` set explicitly by `b`?

The other example is media queries, i.e. in this example:

```html
<style>
.c { color: black }
@media screen and (max-width: 900px) {
  .d { color: blue }
}
</style>
<div class="c d" />
```

Here we want `c` to win, except on mobile, then `d` should win, without having to change the `class` attribute via JavaScript.

### CSS Specificity

So how does the browser decide which `margin-top` or which `color` wins in these examples?

CSS uses its specificity algorithm, which uses three number triplets like `(x, y, z)` where:

- `x` is the number of `#id` selectors in the rule,
- `y` is the number of classes, attributes, and pseudo-classes
- `z` are type selectors like `div` and `a`

Example selector rules mapped to their triplet:

```css
div                 /* (0,0,1) - one type selector */
.accent             /* (0,1,0) - one class */
.accent:hover       /* (0,2,0) - one class + one psuedo */
.accent.accent      /* (0,2,0) - two classes */
#sidebar            /* (1,0,0) - one id selector */
```

If two rules tie, then **source order (last definition) wins**.

This source order ends up being important.

### Longhands

So, going back to our longhand example, if we "want `b` to win", how can we make it higher specificity?

Basically we look for ways to "increase its score" ideally in a way that _doesn't materially change the selector_.

StyleX does this by using a `:not(#\#)`, where the 1st `#` is "an ID selector" (highest priority slot), and `\#` means "a dummy id", such that `:not(a dummy id)` becomes a noop that increases the score.

So, for longhands, 

```css
.a:not(#\#)                            { margin: 0; }          /* (1,1,0) */
.b:not(#\#):not(#\#)                   { margin-inline: auto; }/* (2,1,0) */
.c:not(#\#):not(#\#):not(#\#):not(#\#) { margin-bottom: 14px; }/* (4,1,0) */
```

### Media Queries


## What about Tailwinds?

Just for kicks, I also added Tailwinds to this same benchmark, in [this branch](https://github.com/stephenh/css-in-js-arena/pull/2), and we lose a few medals:

![Benchmark results comparing Truss, Tailwind, Bamboo, StyleX, and Panda](/images/truss-benchmark-tw-wins.png)

But we still win all the output size metrics, where Tailwinds is one of the laggards:

![CSS size results comparing Truss and Tailwind with Bamboo, StyleX, and Panda](/images/truss-benchark-tw-size.png)

The medals we lost were to build-time/dev-time metrics, where the Tailwinds compiler is ~10-30% faster than Truss, but on small enough numbers that 🤷 I think it's a wash.

Disclaimer, I did try & benchmark hack our build times to beat Tailwinds, and we got closer 🏃, but couldn't actually pull ahead, at least with the current Babel/JS pipeline. Maybe next hack day! 😅



