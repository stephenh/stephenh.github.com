---
date: "2009-04-29T00:00:00Z"
categories:
  - Java
title: The IBM JDK is Awesome
---

The IBM JDK is Awesome
======================

Insofar as its [J9](http://en.wikipedia.org/wiki/IBM_J9) JRE supports adding methods to classes at runtime. For me, this is a real boon for productivity.

(Edit: To clarify, I'm talking about editing source code while debugging and having changes applied by "hot swapping" classes in the running JVM without having to restart. Not the Ruby-style meta-programming of modifying classes at runtime.)

I don't understand why Sun has not fixed this in their JREs, see bug [4910812](http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4910812), to bring Java development that much closer to the Smalltalk "always-running" ideal I've heard Smalltalkers wax poetic about.

If you haven't voted for 4910812, please go do so. It has only 379 votes, which seems surprisingly low for the number of developers whose productivity would be positively effected by it being implemented. I remember seeing a "vote 4910812" meme go around awhile ago, but it must not have caught on.

Compared to the IBM JDK, I generally prefer the Sun JDK because it:

* Seams less finicky (which is very subjective, I know)

* Ships with the source code for its Java class library (which IBM's JDK does not)--not that I read Java class library source code all day, but I flinch every time the "unattached source" view pops up in Eclipse

* Is faster than the J9 JRE in the one micro benchmark I ran--while recording stats for bindgen, I was confused about why it was suddenly so slow, but it turned out I had switched my workspace preferences to the IBM JDK. Switching back to the Sun JDK restored the performance numbers to their previous values.

But I can deal with these in my development environment to get the awesomeness of the J9 JRE adding methods without restarting.

I've tried other JDKs, like BEA/Oracle's JRockit, Apache's Harmony, but none of them do hot method adding like IBM's J9. I was surprised because I've always heard good things about JRockit, and Harmony has some sort of access to J9, but neither have pulled it off yet.

I added small entry about the IBM JDK to Joist's [Eclipse Tips](http://joist.ws/eclipseTips.html) page if you're interested in how to get it/set it up, though it is pretty easy.

One of these days I'll play with [ZeroTurnaround](http://www.zeroturnaround.com/), but having the JRE support it natively just seems cleaner.


