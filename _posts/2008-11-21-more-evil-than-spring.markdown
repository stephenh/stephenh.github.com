---
layout: post
title: More Evil Than Spring
---

As if Spring does not give us enough interfaces:

<a href="http://www.qi4j.org/">http://www.qi4j.org</a>

And one of its core principles: "Classes are dead, long live interfaces".

Not this again.

Perhaps the author can, as I would hope Spring's authors can as well, build supremely elegant systems with their tools.

But for the rest of us, it means yet more codebases with tens and tens of interfaces, all of them having only 1 implementation, all in the name of future flexibility/injection/proxy/something magic.

You never know when our `Employee` class is going to need to mixin some `Claim` functionality, so we better just support it now. After we go 1.0 and are in production, we will only be allowed to re-organize mixins, not, you know, just change the model and code as appropriate.

Rather than throwing a bunch of interfaces around up front, I propose we wait until the reuse/proxy/whatever scenario actually happens, and then we'll deal with it. And when it doesn't 90% of the time, we all win.

That being said, qi4j looks technically spiffy. And I'm sure the author makes very judicious use of interfaces. I just don't look forward to working on any qi4j codebase that isn't written by him.

