---
date: "2018-07-15T00:00:00Z"
section: Productivity
title: Mono vs. Project Repos? Hurray, software sucks
---

{{page.title}}
==============

Mono repos are trending upwards in popularity, so of course I must comment.

Although, really, anymore blogging is just a way to organize my thoughts, so I'm not really going to try and hard-sell on one or the other, and instead just try to articulate how I think about it.

My primary reaction to mono vs. project repos is unfortunately mostly pessimistic: "it doesn't really matter, they both suck".

E.g. I'll skip the usual "what is a mono repo" intro and jump straight to the takeaways:

* Do you want to pin versions? Use a per-project repo.

  Pinning versions is where you say "my project `foo` depends on `bar` version 1.2, and I want to keep using `bar` version 1.2 until I say otherwise".

  This is how the far majority of software code sharing has worked: Java's maven/gradle/etc., Perl's CPAN (even older), Javascript's npm, Rust's Cargo, Go's vgo once they finally came around, copying `bar-1.2.zip` off the floppy disk that came in the mail, etc.)

* Do you want forced upgrades? Use a mono-repo.

  Forced upgrades is where you say "my project `foo` depends on `bar` (no version), and you get the latest version of `bar`, always."

  This model is the relative newcomer, but used by admittedly sophisticated places like Google, Facebook, Twitter, et al.

Easy enough. The problem is:

* 80% of the time, you will want forced upgrades (great! everyone is on latest).
* 20% of the time, you will want pinned versions (shoot! too hard to get everyone on latest).

Unfortunately, unlike most 80/20 rules, **the last 20% is deal-breaker annoying when you don't/can't have it**.

The differences can also be broken down on breaking vs. non-breaking changes:

* In a mono repo, **breaking changes are caught synchronously and so impossible** (you have to fix+test everywhere)
* In a mono repo, non-breaking changes are easy and automatic
* In a per-project repo, **breaking changes are caught asynchronously and so doable**
* In a per-project repo, non-breaking changes are hard and generally not automatic (you have to version bump+test everywhere, at least sans version ranges/semver)

So, mono repo generally optimizes for non-breaking changes (which is good IMO) while per-project repo "optimizes" for permitting breaking changes.

### Software in the Small

Note that, for software-in-the-small, I don't think the distinction between the two models really matters.

E.g. if you have less than ~5 engineers or less than ~20k LOC or less than 5 major projects, you can do whatever you want:

* In a per-project repo, you don't have very many repos to version bump and async fix breaking changes. Life is easy.
* In a mono repo, you don't have very many places to sync fix on breaking changes. Life is easy.

So, that's great, have fun.

### Software in the Large

It's primarily for software-in-the-large that these trade-offs are more distinct (because you'll have many more pins to bump, and many more breaking changes to fix).

And, for me, the reality is that both actually suck for software-in-the-large.

Software-in-the-large is just fundamentally hard, because no one has elegantly solved dependency management in-the-large.

(Short of purist "never make breaking changes" approaches (looking at you, Rich Hickey) which are admiral but unrealistic, especially for internal company changes. (I'm more bullish about something like Maven central enforcing must-be-binary compatible filter on upgrades; how many net years of developer hours would that have saved the Java ecosystem?))

DLL hell. Classpath hell. npm hell. Every non-trivially sized language/community has it.

And, of course, every new community that comes along thinking *they* have cracked the code: Maven, Gradle, npm, Cargo, yarn, etc. "We won't have DLL hell, look at how great our new dependency tool is."

And, sure, when the community is new and small, and all the codebases are new and sub-20k LOC, their solutions are great, and everyone thinks "we really are different".

Then five years go by, and their solutions are still great, they're fine solutions; but now the community is 10x, 100x larger, the codebases are 10x, 100x larger, and, guess what, the same fundamental tension comes back: dependency management at-scale is fundamentally unsolved.

### Tangentially: if you have versions, you're not a mono repo

Pedantically, I think the term mono repo is being over-used quite a bit lately.

Admittedly, I'm a stickler for terminology, but for me it is because terminology relates to Domain Driven Design's Unified Language--if we (as a business or an industry or what not) can establish the same terms for the same concepts, we can move our discussion up a level of abstraction.

So, to me "mono repo" very specifically means **no version numbers, ever**.

All dependencies must be declared as relative paths within the entirely-self-contained mono repo. When `foo` depends on `bar`, it's via a path like `../bar` or `//root/bar/`. Just like Google, Bazel, Pants, etc., etc. Those are mono repos.

However, somehow the front-end community has latched onto "mono repo" as the latest cool term, and is using it, in my opinion, for things that are not actually mono repos.

For example, yarn workspaces are great, but they are not mono repos, they are multi-project builds: sharing code locally between tightly-related projects without constantly ticking versions.

Multi-project builds are very useful. Maven had parent/child projects for years (not saying it invented it, but it supported it as a first-class project setup), Gradle followed suit and eventually also got [composite builds](https://docs.gradle.org/current/userguide/composite_builds.html) for combining completely arbitrary (albiet gradle-based) projects. It's a very useful workflow.

But having a multi-project build **does not mean "React uses mono repos"**, as the [Lerna readme](https://github.com/lerna/lerna) insinuates.

I'm sure Lerna is a great tool, but if you have a `package.json`, consume `package.json`s, publish `package.json`s, you're not a mono repo.

(Note that, of the projects Lerna mentions "use mono repos", React, Angular, etc., are all very vanilla multi-project builds...however, I will give Babel credit for pushing multi-project builds to near-mono repo status, with [~100-some projects](https://github.com/babel/babel/tree/master/packages). Which is impressive, but still not a mono repo.)

(Also, to finish the "get off my lawn" section, [meta](https://github.com/mateodelnorte/meta) is cute (from the ["have both!"](https://medium.com/@patrickleet/mono-repo-or-multi-repo-why-choose-one-when-you-can-have-both-e9c77bd0c668) blog post that went around), but IMO has **nothing to do with mono repositories**, as it **doesn't touch versioning at all**. Being able to run `git branch` across `N` repos is basically a hacky [CVS](http://www.nongnu.org/cvs/)-style approach to wanna-be mono repos, but still not the point, and if anything this marque example is a questionable workflow (cross-service branches) that you shouldn't be doing anyway.)

### My Take: Mono Repos if You Can Do It (But You Probably Can't)

Anyway, terminology pedanticism aside, I think from a 1st principles standpoint, mono repos are the best, because **they force/front-load immediate payment of technical debt**: you fix tech debt on every mono repo change for your entire downstream repo, vs. deferring it behind version bumps.

I'm a sucker for this sort of draconian "eat your vegetables" discipline.

However you must be very realistic that:

1. You have the internal tooling chops and budget to write bespoke tooling for it.

   Currently the far majority of Maven, npm, cargo, vgo, pip et al. assume versioned software; yes, we do finally have Bazel/Pants/etc. as open source build systems, but they are still new/different, and also still have to integrate with the repo-based tools like the npms, Mavens, etc., even if your internal repo is a mono repo.

   If you want to go mono repo, you have to be extremely sure you have the organizational dedication to maintaining your own best-of-breed tooling.

   Facebook has this, Google has this. LinkedIn tried a mono repo and gave up. I don't think most orgs have it.

2. You have the app developer chops, discipline, and budget to write amazing tests.

   You'll always need amazing tests, but having a mono repo (which means forced upgrades for all downstream consumers) with subpar tests is probably **the worst possible outcome**.

   The reason is that, without the ability to pin, you are forced to take on the entire mono repo's technical testing debt on **every single commit**. You have no capability to defer technical debt until later. Which sounds great. How clean!

   Until you have a deadline, and the execs really want this out. Or until you've had your change rolled back 4 out of 5 times due to a flaky downstream test. Or you're a new engineer and have no idea what the downstream projects even do.

   So, in that way, per-project repos (and pinned versioning) is basically an "out" that hedges against "we probably won't have perfect technical debt".

   To me, the same rule of thumb applies: are you Facebook or Google? Okay, you probably have the chops and budget to have amazing tests across the company. Most orgs do not.

So, it is kind of depressing, but that is my current conclusion.

### Open source software must be fundamentally versioned

Just for clarity, I think it's worth articulating: open source software, or any publicly shared software, will **always be a versioned model** of software distribution.

Why? Because mono repos necessitate touching all downstream projects to immediately fix breaking changes.

This is impossible with an open source project, because:

1. The number of downstream consumers is huge, so projects like React et al, would have a massive burden if they had to fix all consumers of their software.
2. Even if open source/public projects tried to do this, they have no visibility/access into all of their client's private source code.

So, as long as we're consuming open source software (that is allowed to make breaking changes), we're going to be: a) pushing to central repos, and b) pulling from central repos, as a means of decoupling "pushing out new public changes" (them) from "pulling in new internal changes" (us), which mono repos mash together as they assume an internal/corporate environment.

Which means build tools (npm, etc.) will likely always bias towards version-based consumption, given that modern projects get a non-trivial (10x or more?) number of their dependencies from external vs. internal sources.

Which, again per the "tooling chops" point above, I think **should bias most non-Google, non-Facebook companies towards continuing to live with the admitted cons of version-based, per-project repos/software dependencies**, as it most matches the way their off-the-shelf tooling and non-internal dependencies function.


