---
layout: post
title: Brief DI Skeptic
---

{{page.title}}
==============

I saw this go by on Twitter the other day:

"Someone needs to know how my collaborators get wired up, but it doesn't need to be me. Now you're ready for Dependency Injection." ([link](https://twitter.com/dws/status/25391735782993510://twitter.com/dws/status/253917357829935105))

This is a very succinct description for why I'm a DI-skeptic: I actually do care about how my collaborators get wired up.

Perhaps I'm naive, or haven't worked in a system large enough, or complicated enough, or whatever, but so far my opinion and experience has been any that overhead or tedium that comes from manual wiring (which is little if done correctly, IMO) is a wash compared to fighting a framework to get it to do the same thing for you.

This is especially true of legacy DI containers, e.g. Spring.

Perhaps Guice is magically better, but I am still skeptical.

[Dagger](https://github.com/square/dagger) has potential though. The biggest reason I think so is that code generation makes the magic visible. And statically verified at build-time. Then both myself and the compiler can see what is happening and trust it.



