---
layout: post
title: DHH vs. Fowler
---

{{page.title}}
==============

Just a quick note on a topic going around recently; David Heinemeier Hansson first asserted [Dependency injection is not a virtue](http://david.heinemeierhansson.com/2012/dependency-injection-is-not-a-virtue.html), calling into question a practice that is in some circles sacrosanct.

Marcel Weiher responded that, no, [Dependency Injection is a Virtue](http://blog.metaobject.com/2013/01/dependency-injection-is-virtue.html). And HN commenter smoyer [commented](http://news.ycombinator.com/item?id=5020525) "I'll choose MF (Martin Fowler) over DHH anytime both have an opinion".

So, the discussion has devolved to "DI sucks! Nu-huh! Uh-huh!"

What I believe is missing in the conversation is context. From my perspective, DHH/Rails and Fowler address two very separate types of systems.

DHH and Rails are all about pragmatic choices for fairly simple, maybe a little complex webapps built by 1-5-ish programmers (I'm sure there are large Rails projects, but I think they're a minority).

The whole point of Rails is that it makes choices for you, guided by the assumption you're making "just yet another webapp". One of these choices, IMO, is playing a little fast and loose with sacred practices like decoupling (which is fine, *all decoupling has a cost*, which most people don't realize).

DHH understands Rail's (admittedly very large) niche:

* "There’s nothing wrong or shameful with nailing a single use case, like VB did for Windows desktop or PHP for web scripts. It’s beautiful!" ([on twitter](https://twitter.com/dhh/status/284952366317461504))
* "Rails is omakase" ([blog post](http://david.heinemeierhansson.com/2012/rails-is-omakase.html))
* "This nonsense (using transaction scripts) is what happens when you actually start believing that “Rails should be a detail” in your Rails app" ([on twitter](https://twitter.com/dhh/status/282965246547750912))

DHH's opinions, and Rails's approach here, are perfectly fine--they're directly responsible for the huge productivity wins that comes from using Rails for your "just yet another webapp". If your app fits that sweet spot, it's great.

Fowler, on the other hand, is more old-school/enterprise, where applications are not "just a webapp" (but probably have a webapp in them), and are built by teams an order of magnitude larger (10-20 programmers) than most Rails projects.

Fowler's realm is where decoupling, dependency injection, etc., are held sacred, and more rightly so (even if I do think [DI frameworks are too complex](http://draconianoverlord.com/2011/03/17/frameworkless-di.html), I appreciate the problem of global state). This is where having global `Time` variables starts to suck, because there are so many a person can't keep them in their head.

(And I do not think it's a language issue; Java can and is used wrong, to build systems with overly complex abstractions that cost more than they are worth, but it can have a singleton `Time.now` that defers to a stub-able implementation without DI frameworks or reams of XML.)

So, I don't find it very surprising that both camps have different tools and tastes.

It seems like DHH gets pissed off when people try to apply Fowler-/enterprise-patterns to Rails, which is fine, and I understand why--but by the same token, I think he should understand why people get pissed off at him for trashing (without context, i.e. he portrays them as fundamentally flawed) the patterns they've found to work well in their own contexts. 

