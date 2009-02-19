---
layout: post
title: Old School Bell Trick
---

<h2>{{ page.title }}</h2>

I'm running test cases from the console a lot lately. Besides missing Eclipse, my productivity has dropped as I'll task switch to something else while the tests run, and I typically only notice the tests have completed after my other supposedly-parallel task hits an interrupt.

To help with this, I'm using an old `bell` script I had laying around. I came across it awhile ago, and it is pretty simple, but I thought it might be worth rehashing the trick for others finding themselves on the command line lately.

It looks like:

    #!/bin/sh
    echo ^G

Where `^G` is not two literal characters `^` and `G`, but a single [control character][1] `BEL`. How you enter `BEL` depends on your editor--in `vim`, you do `Ctrl-V Ctrl-G` in insert mode.

If you `chmod u+x bell` and then just run `bell` from the command line, you should hear a "ding" system bell.

Now when running tests, I do:

    grails test-app ; bell

Switch away, and then I can come back immediately when I hear the "ding". The pre-emptive task switch makes me feel more productive anyway.

[1]: http://www.bo.infn.it/alice/alice-doc/mll-doc/linux/vi-ex/node15.html

