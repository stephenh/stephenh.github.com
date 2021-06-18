---
layout: post
title: React Memoization
---

{{page.title}}
==============

This is not a tutorial about what memoization is, or how it works, but just some observations...

For one, React is finally well enough along in it's adoption curve that it's cool to "hate/not like React" now.

I definitely don't hate React, but it's nice to talk concretely through pros/cons, i.e. about hooks and things, now that everyone (myself included) has enough experience with them to talk in specifics.

Personally, I still like React, with the biggest caveat being that memoization is the biggest pain point I see engineers struggle with.

Specifically:

1. When should I use or not use memoization (i.e. over-use or under-use), and
2. The boilerplate involved when doing so (`useMemo` and `React.memo` are not terrible, but still...)

And I think this stems from, in terms of causes:

1. React components are not auto-memo'd by default

   (I think this is technically a fine decision, b/c 80% of the time you don't want/need to memo, but it is technically the decision that makes the other 20% of the time more awkward, so is worth highlighting.)

2. Even if components were memo'd by default, memoization is almost always based on shallow/identity equality, so it's super-easy to break without knowing it, and

3. The are basically no conventions (or even better type system enforcement) for which components/which props should be memo'd "or bad things happen". Which makes it incredibly opaque, as a user of a component, if you're doing the right thing.

Currently, I don't have any answers to these observations, I'm just articulating what I see as the pain points.


