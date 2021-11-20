---
date: "2016-06-24T00:00:00Z"
categories:
  - Architecture
title: Stuck on a Dead Framework
---


I've been thinking about/discussing frameworks recently with some coworkers.

The topic came up because after being comfortably isolated from a lot of the front-end/JavaScript ecosystem for the last ~5 years (by quietly staying productive on a [GWT](http://www.gwtproject.org/) + [Tessell](http://tessell.org/) codebase), I'm getting more exposure to other codebases and frameworks.

Obviously talking about frameworks, and especially JavaScript frameworks, is nothing new these days.

But I still wanted to type up my thoughts, with the rationalization that I'm not talking about anything JavaScript-specific, and instead am thinking through the pros/cons of framework choice for any long-term codebase, whether front-end or back-end, e.g. even your ORMs, J2EEs, etc.

Note that, for the context of this post, my experience is mostly with medium-sized applications: e.g. a team size of ~5-10 people, working on basically the same project/product (granted with ever evolving features) over a ~5+ year lifetime, meaning that the overall codebase will probably hit the low ~100k LOC.

The Framework Life Cycle
------------------------

I think the first step in thinking objectively about frameworks is to realize that they will all eventually be old, crufty, and dead.

Assuming a framework starts out life well (e.g. is well designed and adopted), it will go through a predictable life cycle of Hype, Adoption, Maturation, Stagnation, Disillusionment. (I won't spend any time describing each stage/transition, because that's not the focus of the article, and I basically just made it up off the top of my head, but anecdotally it seems like an accurate model.)

Given this, it should not be a surprise when a current framework hits the Stagnation or Disillusionment stage, nor should it be a surprise when a new one hits the Hype or Adoption stages.

This is going to happen. There will always be new frameworks, and always be aging frameworks. So we should just plan for it.

Granted, life for your codebase is (hopefully) just fine during the Adoption and Maturation stages of your chosen framework. You write your application, the framework makes you more productive, everything is good.

However, what becomes very frustrating (and likely what is more common in the JavaScript ecosystem vs. older/non-JS ecosystems), is when the framework life cycle moves *more quickly than your codebase's life cycle*.

You are now stuck with an application written on top of a dead framework. (Granted, maybe not "dead dead", but I'm using the word "dead" as an illustration, and basically mean "dead" as in "new hires hear what your stack is and wrinkle their nose".)

What to do Now?
---------------

There are many pros/cons/topics on frameworks, but this is what I'd like to focus on: the risk/what happens when you're on a dead framework.

When faced with this scenario, I think there are the three possible reactions developers might have:

1. Avoid frameworks: "Forget frameworks, I'm not falling for that again."
2. Just rewrite: "Ah well, let's just rewrite on top of the next framework."
3. Continue on: "Our codebase is fine, let's carry on."

I'll touch on each one.

### Reaction 1: Avoid Frameworks All Together

Personally, I think this reaction is fairly naive; IMO if you don't use a framework, there are three potential outcomes:

1. Your codebase is so small that it doesn't matter (which is great, don't bother)
2. Your codebase becomes tangled and hard to understand
3. Your codebase basically has a custom framework in it anyway

The 3rd option I think is especially cute: I'll read an article that says "bah, I don't need a framework, I just do this!"...and then proceeds to outline the beginnings of a framework.

So, it's great if you don't need a framework, but I don't think that's a realistic option for most large software projects.

You use one, you build one, or you end up with a mess. (Granted, a framework does not mean you *won't* still end up with a mess, it just slightly changes the odds in your favor.)

### Reaction 2: Rewrite On the Next Framework

So, you've got a codebase where productivity is dropping, and your framework is past its prime, so obviously it's the framework's fault, and a rewrite is in order.

There are several risks here:

1. It is expensive.

   Granted, if done well, you can do these sort of things in a phased approach, so you spread the risk and cost over time. But it still involves touching a lot of functionality that was considered "done and paid for" by the organization.

2. You loose credibility with your product owners/customers.

   A "move to a new framework" rewrite defacto affects velocity, and your product owners are not going to appreciate that, especially if you have a fairly new codebase in the first place.

   (Interestingly, [SVPG](http://www.svpg.com/) posits an interesting idea: developers should be given 20% of their time to do ongoing technical maintenance. E.g. on a team of 5, this would be 1 person. Full time. The trade off for being given this 20% is that the application should never need a from-scratch rewrite. I find this a very interesting proposal, but haven't had the opportunity to try it out.)

3. There is no guarantee that your next codebase will be any better.

   It is easy to think a rewrite will fix things. When you start the rewrite, you're back in a small codebase. Everything is new and fresh. Things are easy to reason about, easy to change. Surely this new codebase will be amazing forever.

   But inevitably the new codebase gets more features, pretty soon all the features of your old codebase, and now it's just as large, and just as complex, as the previous codebase.

   How do you really know the "just moving to the new framework" is going to fix this problem? "Using framework X/Y/Z" does not automatically mean "my 10k, 20k, 50k LOC codebase is pleasant to work in".

If you find yourself on a dead framework, *and* the productivity/quality of your codebase is dramatically low, a rewrite might actually be the right idea. However, I think the goal of a well-designed application should be the next reaction: "eh, no big deal".

### Reaction 3: Continue On

Ideally, your framework becoming passe should be a non-event.

This is because: a) the framework you initially choose had good architectural choices, and b) since then you've structured your codebase well enough that your productivity remains high, regardless of the release/blog post velocity of your underlying framework.

My primary indicator of productivity is: how fast is your TDD cycle? Can a developer easily write unit tests (that are easy to read, easy to write, and test the right things) and quickly see a green/red cycle?

If so, a lot of other things usually take care of themselves. And I think you can go a long way delivering useful functionality (quickly and productively) on a "dead" stack, if you have quality and are able to keep quality as you go.

Granted, the TDD cycle is not the sole requirement, but I think it's a pretty good indicator.

Of course there are other indicators: have you had quality from day one? Tests from day one? Is refactoring easy? Are developers happy with their workflow? If so, you're hopefully in good shape.

Otherwise it's extremely hard to recover quality, short of a herculean effort that trends close to a rewrite anyway.

Basically: Is Your Codebase Productive?
---------------------------------------

Perhaps this is obvious, but I think the core question is pretty simple: are you still productive?

I've been on teams that, 5 years into the project, are using "old" technologies (because any technology around when the project started is defacto old by that point), and are still productive.

I've also been on teams (awhile ago) that were using brand new technologies, their codebase hadn't even shipped 1.0, and they still weren't productive. They already needed a rewrite.

If you have a productive codebase, of course the answer is easy: keep doing what you're doing. If you don't have a productive codebase, unfortunately I don't really have a great answer. Is it the framework's fault? Maybe, maybe not. Will a rewrite help? Maybe, maybe not.

It depends on your situation, and what the core productivity issues are (because there are probably several). In theory I should have something intelligent to say about this, but I don't at this point.

Which is such an inconclusive ending that I'm tempted to not even publish this post, but at this point I need to call it done and move on.



