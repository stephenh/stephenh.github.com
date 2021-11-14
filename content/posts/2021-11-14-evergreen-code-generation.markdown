---
date: "2021-11-14T00:00:00Z"
section: Architecture
title: Evergreen Code Generation
---

I am a big fan of code generation when "done well" (...which I've already written about [~10 years ago](/2010/07/15/code-generation-is-not-evil.html), eesh).

One attribute I touched on in that post was "active code generation", which lately I've taken to calling "evergreen code generation".

Similar to "evergreen browsers" that are always continually updated, the idea of evergreen code generation is that it's code generation that you continually run throughout the life of a project. I.e. in contrast to scaffolding code generation, which does a one-time project initialization, or one-time feature initialization, after which you can't run it again without overwriting your existing work.

Tactically, I've seen a few ways of achieving this:

1. Keep the output totally separate
2. Use inheritance
3. Use touch-once files
4. Use same-file patching


