---
date: "2015-08-09T00:00:00Z"
categories:
  - Productivity
title: MoreUnit Supports Custom Languages
---


For awhile now, I've been a fan of the [MoreUnit](http://moreunit.sourceforge.net/) Eclipse plugin.

MoreUnit has a few features, but the primary one that I use religiously is auto-jump between a `Foo` file and its `FooTest` file, which by default MoreUnit maps to `Control-J`.

This sounds minor, but it's amazing how often I jump between these two files. And, granted, Eclipse does have forward/backward history, but often I've been off in some other file before getting back to `Foo` that I'm testing, so `FooTest` is not necessarily my immediately-previous location.

`Control-J` means I can get there immediately, and in exactly the same cursor location as before (unlike `Control-Shift-T` which moves the cursor to the type declaration).

Admittedly, this sounds like the sort of thing IntelliJ likely has built-in by default, and also tweaked for every language/framework they support. But, for better or worse, I currently use Eclipse.

So, MoreUnit/`Control-J` is great.

Unfortunately, MoreUnit was built to be Java-only. Given I also write a lot of Scala, I really missed `Control-J` in Scala projects, to the point where I even cloned the MoreUnit source, but got kind of lost trying to add it.

Hence, today my pleasant discovery that they've added configurable support for custom languages. In really a pretty brilliant/configurable way, per this screen shot:

<a href="/images/screenshot-moreunit.png" border="0">
  <img src="/images/screenshot-moreunit.png" width="700" border="0">
</a>

You can basically give it a pattern of "source path to expected test path", e.g. for me a really simple `src/main/* -> src/test/*`, and magically it can jump back/forth between `Foo.scala` and `FooTest.scala`.

Amazing!

(...turns out they've been working on/released this feature [since ~2012](http://moreunit.blogspot.com/2012/10/some-news-about-current-work.html) so apparently I've just been ignorant. I wish I'd know back then, but at least I know now!)

(Looks like there is a MoreUnit [port to IntelliJ](https://github.com/MoreUnit/org.moreunit.intellij.plugin), which mentions IntelliJ does have a "Jump to Test" built-in, but the MoreUnit port supports more languages/non-standard naming conventions.)






