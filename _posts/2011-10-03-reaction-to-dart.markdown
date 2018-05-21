---
layout: post
title: A GWT Developer's Reaction to Dart
section: GWT
---

{{page.title}}
==============

The scheduled [Dart keynote](http://gotocon.com/aarhus-2011/presentation/Opening%20Keynote:%20Dart,%20a%20new%20programming%20language%20for%20structured%20web%20programming) announcement made the rounds a week ago or so. If you didn't catch it, Google wants to replace JavaScript, with a dual static/dynamic language named Dart.

[This post](http://markmail.org/message/uro3jtoitlmq6x7t) has more details, but basically Google wants to combine its two primary tool chains, [Closure](http://code.google.com/closure/) (JavaScript-based) and [GWT](http://code.google.com/webtoolkit/) (Java-based) into a single project. This makes sense, as both tools have (AFAIK) separate teams within Google supporting them, and both share the same goal of making it easier for developer's to build large, complex, browser-based applications.

While I'm not yet a front-end developer extraordinaire, GWT is my tool of choice for rich-client browser applications, and this means it's been effectively deprecated.

Which, after my initial reaction ("What?! GWT rulez!11!!"), I realized, this is actually pretty damn cool. This post is my brief explanation of why.

Typing and Tools
----------------

To explain, here are the four primary reasons why I like GWT in the first place:

1. I'm a [static typing bigot](http://draconianoverlord.com/2010/11/24/why-im-a-static-typing-bigot.html).
2. I'm addicted to Eclipse and not ashamed of it (although [vi bindings](http://www.viplugin.com/viplugin/) FTW).
3. I like GWT's components-based approach to widgets/UI.
4. I like GWT's integrated "toolkit" approach of doing most things you'll need (minification, spriting, i18n, browser tweaks, etc.) out of the box.

Now, if you cast each of these reasons to apply to Dart:

1. Static typing? Eh, optional, but, okay, good enough. Check.
2. Eclipse? With static types, JDT-level Eclipse integration should be doable; Google has an Eclipse plugin team, so hopefully they'll have this sooner rather than later. Check.
3. Components? UI components aren't, AFAIK, Dart-/language-specific, so I assume GWT's Dart-based successor will follow a similar approach. Check.
4. Toolkit? Same thing as 3. Check.

They all hold up. Dart is still a language I would prefer using over JavaScript, which is primarily why I'm in GWT anyway. *Plus* Dart will be browser-based.

A Better DevMode
----------------

Also, stepping back, I realize that GWT, at some level, is a huge hack. Not because it trans-compiles Java to JavaScript (CoffeeScript does the same sort of thing), but because of its implementation of Developer Mode. (Developer Mode is where you run your webapp locally and can debug it in Eclipse.)

To do this, GWT performs some browser/extension magic to force your browser to talk back and forth with a running JVM (where your code actually runs as regular Java code, so Eclipse can see/debug it), often times in a very chatty manner.  

Surprisingly, this normally works quite well. However, it also means you are paying an RPC cost for every cross browser/JVM call (anytime your Java code touches the DOM and vice versa), and that can add up to a less-than-fast developer experience.

If only GWT could run your statically-typed code directly in the browser...

...which is exactly what Dart will do. Nice!

A Better GWT
------------

So, I'm optimistic: **I see Dart as a way of getting an even better GWT**.

Obviously, I'm speculating a lot since the keynote hasn't happened yet, but, in a bit of naive projecting, I would assume the GWT users/developers within Google feel the same way I do. If you can provide a GWT-like experience, with less hacks and cruft, that sounds like a good thing to me.

### Disclaimers

That being said, a few thoughts:

* Just because it's from Google doesn't mean the language is going to rock; see Go. I'd be really surprised if this is the case with Dart, if only because the memo suggests a non-trivial amount of people are working on the project.

  That being said, [scala-gwt](http://scalagwt.github.com/) has made some great progress, so perhaps a `scala-dart` project could be started if the syntax is less-than-ideal.

* **Even if the other browsers don't adopt Dart, I don't care.** If I can use Dart+GWT-next-gen to develop webapps in Chrome with a kick-ass developer experience, and fall back on old-school Developer Mode and JavaScript trans-compiling for the others, I'd be perfectly happy with that choice.

* I'm really surprised the Dart VM will be for front-end servers as well; I assumed the JVM was king here and they'd stay with it. I'm unlikely to give up the JVM on the server-side, given the various libraries and APIs, all JVM-based, it uses to do its thing.

  Which, while in theory the "same language on both client/server" sounded great, in practice I've rarely had a significant amount of code that could reused across each. Other than trivial validation, most code makes a surprising amount of assumptions based on the environment it's in.

So, I'm looking forward to the Dart keynote. It'll be interesting to see what it looks like, what the current progress is, and if/when real working prototypes will be available. As a GWT developer, it will also be interesting to see if any announcements are made about GWT next-gen, either in the keynote itself or by the GWT team afterwards.

Given the amount of GWT code Google itself has internally, and the amount of GWT code in other companies, I'm not worried about the GWT ecosystem dying on Oct 11th. Instead, depending on the GWT next-gen migration path/timeline, it might be a pretty happening place (well, as an introvert, I have a very loose definition of "happening").

