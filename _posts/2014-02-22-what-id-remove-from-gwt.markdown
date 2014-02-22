---
layout: draft
title: What I Would Remove from GWT--Basically Everything
---

{{page.title}}
==============

At the 2013 GWT.Create conference, one the audience questions to the steering committee members was "What would you remove from GWT?"

I bungled my answer, hemming and hawing, and eventually saying "...um, Request Factory?". Which was a terrible answer.

Of course, the next day I realized what I should have said: generators.

But now, a few months later, I'll go further: I would remove basically everything.

What I'd Remove
---------------

Here's a list of things I don't think need to be in GWT:

1. Generators (yes, I mean no more `GWT.create`)
  * Reason: Whole-program meta-programming is interesting, but hard, and it's a big reason why optimizing the compiler is so hard.
  * E.g. per John Stalcup's latest work, when doing modular compilation, any *upstream* modules that contain `GWT.create` must have that re-evaled when the whole program compile is done. Then when you hit refresh, you have to do it again (or intelligently track which upstream modules need recompiled based on what changed). It's a mess, and not at all how jars/javac work, where upstream output (.class files) is frozen at the time of compile (...modulo bytecode post-processing/classloader hacks, both of which also slow down a build).
  * Pro: Ideally much faster, simpler compiler.
  * Con: People would have to do meta-programming the old fashioned way (like a pre-compile build step, or annotation processors). To me, this is a fine trade off. And sometimes even preferable, e.g. as then your IDE also sees the output, which is what [Tessell](http://www.tessell.org) does. Basically every other non-GWT Java codebase out there gets by without compile-time meta-programming (granted, they have reflection).
  * Disclaimer: I am admittedly a huge fan of compile-time meta-programming, so it is hard for me to say this. Although, even then, I think `GWT.create` has been abused in becoming "how you implement *anything* in GWT", which actually makes some workflows (basically anything with unit tests) more difficult. All that said, if the GWT team can pull off incredibly fast compiles with generators (which they hopefully will), I'll be all the happier to be proven wrong.
2. Permutations
  * Reason: Browser inconsistencies are not the huge nightmare they once were; doing runtime detection for most things is likely good enough.
  * Pro: Faster compiles (basically forcing collapse-all-properties), not just in terms of less `.js` files to create, but not running binding logic during the compile (e.g. even across upstream/precompile modules).
  * Pro: Simpler compiler.
  * Disclaimer: I am not an expert in mobile, WebGL, canvas, or frankly quite a lot of things, so perhaps deferred binding still really matters. That said, AFAIK, no other JS framework/platform out there has build-time permutations like GWT does, and they seem to be doing just fine both performance- and adoption-wise (i.e. it is nice we can list this has a "pro" bullet point in the GWT column, but it doesn't seem to be actually winning any converts in and of itself).
3. Dev Mode
  * Reason: We all know it's dead anyway. Might as well remove it (post-2.7/post-3.0) and simplify the codebase.
  * Con: We would all have to use Super Dev Mode.
  * Pro: We would all be *very* motivated to help out with Super Dev Mode.
4. Basically all of gwt-user
  * Widgets--I personally like widgets, but the usage pattern has really changed over the years (from GWT apps being all Swing-style XxxPanels and widgets to, for us, 80% UiBinder/HTML templates + 20% widgets), and now they could be a library.
  * UiBinder--I really like UiBinder. Of any templating language I've used, it's my favorite. But it could be a library (granted, the IDE support is nice).
  * GWT-RPC--also really nice, but I could live without it...
  * Activities/RequestFactory/etc.--all fine, but can be libraries.
  * ClientBundle--it's really awesome, but could be a library.

So What Actually Stays Then?
----------------------------

That was a long list. So, what would I keep in GWT?

1. The compiler (Java to JS transpiling, linkers, code splitting, etc.)
2. The `java.*` emulation
3. DOM APIs (either the existing ones, or new `JSInterface` ones)

That's it.

The goal would be, by stripping all the cruft away, the GWT team could be solely a compiler team, and all GWT would be about is turning Java code into JS files as fast as possible.

Then we might have a developer experience that doesn't make everyone cringe.

Then we might be sexy again.

What Would I Add to GWT?
------------------------

Ironically, given the list of my "would remove" list, I would actually add one thing to GWT's purview: [sdgb](https://github.com/sdbg/sdbg).

This is the next-gen "debugging in Eclipse" project, and the guys behind it (both James and Ivan, and the DART team they forked it from) are amazing.

I've heard some assertions that the GWT team doesn't want to get back into the IDE business. I can respect that, insofar as I don't wake up each morning and think "oh boy I really want to write an Eclipse plugin today".

But one of GWT's core principles has always been good tooling. Granted, historically it got debugging for free by running in the JVM. But that's not the life we live now.

And, realistically, I think a debugger is one of these few "hard problems" that shouldn't just be left to a non-core library/implementation, and instead should be supported as an official part of the GWT project. (I look forward to James and Ivan proving me wrong though.)

Granted, "Remove Everything" Means Forking GWT
----------------------------------------------

Please note I am not lobbying for this, but obviously this drastic of a change ("remove everything") would basically mean an entirely new/forked version of GWT. Maybe `gwt-user` would live on as some external library, to provide at least some sort of upgrade path, but even then it wouldn't be seamless.

However, just musing, but even if the "fork" was just internal (not a new project, but some new "GWT 10.0" version), it's hard to see how that would happen given the current staffing/funding of GWT work being primarily Google driven.

As I imagine the rationale/mandate of the GWT team is largely that they support all of the existing GWT projects inside of Google (AdWords, etc.), which, given some drastic fork, most of those projects (the ones paying the bills) would likely not make the upgrade and so get no direct benefit.

Tangent on the Constraints of their Build System
------------------------------------------------

Even Googlers working on a "fork-in-progress" version would be an issue, as Google's amazingly sexy "everything builds trunk" build infrastructure puts huge constraints on GWT in terms of backwards compatibility.

Normally, I have no complaints about their build model, and would actually really enjoy it. I think for maintenance/point releases, it makes all sorts of sense to immediately build all downstream projects. All **10,000** downstream projects in the case of GWT inside of Google.

But for major version bumps, that is a huge set of hand cuffs. As there is basically no way to make breaking changes (which, per conventions like [Semantic Versioning](http://semver.org/), are usually allowed on major version bumps, e.g. 2.x to 3.x).

Realistically, there are surely more than 10,000 external/non-Google GWT projects that are using GWT. Everything from small, agile webapps for startups (like [Bizo](http://www.bizo.com)) to stodgy, stale, 500k LOC line of business applications in banks, insurance companies, etc.

The difference is that non-Google 500k LOC business applications pin themselves to an specific version of GWT (e.g. 2.5) and it is *their* responsibility to decide when they upgrade, or even *whether* they upgrade, and to invest their *own* resources.

Inside of Google, it's exactly the opposite. The 500k LOC business applications (*cough* AdWords *cough*) is not pinned to a specific GWT version, so every single commit to GWT must satisfy every single legacy GWT application within Google's auspices. Even ones that are basically dead/not under active development (AFAIU).

On one hand, I want to say that's just not fair (that, even for major version bumps, GWT must always build all Google apps, whereas it would be fine to break external/pinned apps). But on the other than, well, Google is the one paying the full-time committers.

Although, in terms of all non-trivial GWT work being Google financed, I assert that Google's constraints (very little breaking changes) is also part of what stymies external contributions.

As a hobbyist, it's very discouraging to want to do A, B, or C, but have to slog through "well, some Google app might not like that" (case in point: [supporting final fields](https://code.google.com/p/google-web-toolkit/issues/detail?id=1054) cannot "just work" like it should have from day 1, but needs to be opt-in just in case some ancient Google app is storing sensitive info in a private field).

This makes designs harder, and testing harder, and commits harder.

Which, if your a paid developer, that's fine, that's your job.

But when your a hobbyist, it often means it just doesn't happen.

Of course, breaking APIs on every release will not win anyone any friends. And I will readily admit that I overly favor "break now for a better future", which, applied too frequently, would not be appreciated for a mainstream/widely-used project.

But it needs to happen at some point, e.g. around major release cycles. And not just "oh, sorry, that method went away". But "we are *really* doing things different now, because it's the right thing to do for the next 2-5 years of new applications".

Right now, GWT just can't do this. That's the handcuffs of being a still-basically-Google project. That's the handcuffs of AdWords paying the bills.

To make any of my above drastic changes (no generators/etc.), Google would have to fork GWT internally--have both "current GWT" and "next-gen GWT" living in their unified repository. Then applications could move, one by one, over from one to the other.

Of course, huge applications like AdWords would likely never convert. Just like the 500k LOC line of business application sitting in some bank somewhere. My assertion is that's fine, leave them on GWT 2.5 (or GWT 2.4 or GWT 1.8 or Java 1.4).

But, realistically, how could Google justify paying the GWT team's salaries to work on a next-gen/forked version of GWT, that AdWords could never realistically use, when supporting AdWords is the whole point?

(Granted, I know there are 9,999 other GWT projects in Google, but I think that's the big one.)

Granted, It's Not Just Google
-----------------------------

To be fair to Google, the other vendors on the steering committee (Sencha, Vaadin, etc.), to do place somewhat similar constraints on GWT.

If anything, they place even tighter restrictions on, say, aging off older browsers, as their clients cannot move to new browsers as fast as, well, basically every consumer on the planet who touches a Google service. (Sarcasm aside, I do understand their position.)

That said, I think the Sencha/Vaadin constraints are slightly different, as:

1. They/their clients can still pin to GWT versions when needed, and
2. They don't support a significant/meaningful amount of GWT dev work anyway.

Project Lifecycles Just Don't Work This Way
-------------------------------------------

Realistically, I probably just need to accept that GWT has hit a maturity point where disruptive innovation is just not going to happen.

And this is probably fine. It's not a bad thing, it just means GWT is what it is, and it's current users want it to remain what it is today.

I suppose I am knowingly yearning for future users, new users who are looking for bleeding edge productivity, who might share my personal opinion that Java is actually a great language to write otherwise client-side JS applications in. (Let's avoid tangents on Scala and DART for now.)

Users that don't have huge 100k codebases that stymie any change. Users who are willing to change some imports around, or rewrite their templates, or change their entire code generation workflow, to get the latest, fastest developer experience.

I like to think these users exist. I am one of them anyway.

All That Said, GWT is Probably Fine
-----------------------------------

I started out this post just wanting to clarify my bungled answer from `GWT.create` to a rather innocent audience question.

But I ended up rambling on for awhile about what would be very drastic changes to the project.

Please note that I'm not actively lobbying for any of these drastic refactorings to actually happen; I'm just musing about what would make the GWT compiler simpler/faster, if it were to go through a "big rewrite" sort of refactoring.

If anything, my implicit assertion here (that GWT *needs* to drop these features to be fast) is likely wrong. The GWT team has a history of engineering feats (Java emulation in JS, in-process/out-of-process hosted modes, etc.) that suggest that'll also pull this off just fine, and, in due time, we'll have an amazing developer experience.

So, perhaps I should have perpetually left this in the draft folder, but I'm trying to clear that out. So, posted. Take with a grain of salt.

