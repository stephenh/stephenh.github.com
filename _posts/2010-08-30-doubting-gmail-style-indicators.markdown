---
layout: post
title: Doubting GMail-style Loading Indicators
---

Doubting GMail-style Loading Indicators
=======================================

While building [Bizo][bizo]'s [Bizads][bizads] application, I occasionally looked to other AJAX applications for UI styles and patterns to reuse. I am not a UI/UX expert, so searching out best practice seemed like a pragmatic approach.

One pattern that seemed like a sure thing was the GMail-style orange "Loading..." box that pops in/out at the top of the page in GMail while you're switching labels. It also shows up in Google Reader when switching feeds.

For Bizads, it ended up looking like:

<img src="/images/screenshot-loggingIn.png" style="border: 1px solid black; margin-left: auto; margin-right: auto; width: 600px; display: block;"/>

I was originally attracted to it for a few reasons:

1. It gives the user a single "the app is doing stuff" place to look

2. It gives the dev a single "the app is doing stuff" place to implement.

So I implemented the global indicator in Bizads, asserting to myself that "oh, yes, this is for the user's benefit--GMail does it, they'll know the convention".

However, I think in reality what attracted me most to the pattern was really the second reason--it made life easier for me as a developer.

With the global indicator, I no longer had to code boilerplate loading/spinning indicator logic for every button in the app. Which, given I was brand new to AJAX development, I'd been doing in kind of an ad hoc way.

Better yet, using [gwt-dispatch][gwtdispatch]-style RPC commands, and [Tessell][tessell]'s [DispatchXxx][dispatch] events, I had one centralized class that, by listening to the event bus, could automatically handle "command went out, show indicator" and then "response came back, hide indicator". One place, done.

It was really nice as it let me be lazy and stop thinking about indicators all the time.

That being said, I think it was the wrong choice. In retrospect, I have three complaints about a global indicator:

1. It jars the user's focus away from where they are expecting the action to occur.

   In GMail, you click "Inbox", your eyes jump to that section of the page in anticipation--having loading elsewhere on the screen is not what you expected.

2. The global indicator is hard to get right--a naive implementation will show/hide it as soon as RPC/AJAX calls go out/come back. This results in a harsh flashing that, besides distracting the user, risks that most non-tech-savvy users will not even see it.

3. The global indicator pattern breaks down as soon as you have multiple activities happening at the same time.

   If you let the user have some sort of multi-document/multi-view in your application, you could legitimately have multiple outstanding AJAX calls. To have these both queue up in the global indicator seems confusing and would potentially become bulky.

All of these problems, I think, can be solved by keeping the loading indicator in context.

If a button press led to the action, the indicator should go by that button. If a table is loading its rows, the indicator should be in the table table (which is what the GWT 2.1 `CellTable` does).

This might be more work for the developer, but I think it would end up being pretty simple once higher levels of abstraction are applied. E.g. the button widget should be a composite that automatically knows how to show/hide its indicator while work is being done.

I have not flushed these abstractions out yet, so I can't be sure how elegant they will end up being. But so far I'm optimistic.

[bizo]: http://www.bizo.com
[bizads]: http://bizads.bizo.com
[tessell]: http://www.tessell.org
[dispatch]: http://github.com/stephenh/tessell/tree/master/user/src/main/java/org/tessell/dispatch/client/events/
[gwtdispatch]: http://code.google.com/p/gwt-dispatch/

