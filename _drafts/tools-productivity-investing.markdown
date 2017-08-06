---
layout: post
title: Tools, Productivity, and Investing in Yourself
---

{{page.title}}
==============

I was recently putting together a [list](/pages/tools.html) of tools that I like and use, and what started as an introduction on that page about the importance of tools kept growing and turned into this longer post. So, here we go.

Basically, I think tools are an important aspect of productivity, but also that the continuous selection, adoption, and practice of tools is part of a larger trait of self-teaching and self-improvement.

First- vs. Second-Order Effects
-------------------------------

Obviously with tools, there is the first-order effect/rationale of "immediate time saved" that enables a programmer to move more quickly when they leverage a tool.

E.g. the raw "time saved by typing X keystrokes instead of Y keystrokes" by using emacs/vi bindings, or "time saved by using `ripgrep` instead of hunting/pecking around"; 10 seconds instead of 60 seconds.

These initial time-saved values seem, compared to the span of an 8-hour work day or a 3-month project, to be incredibly small. E.g. 5 seconds here vs. 60 seconds there. Big deal.

But I assert there are several second-order productivity gains, beyond the initial "only a few seconds saved", which is:

1. being empowered by feeling you can make non-trivial changes quickly, and
2. staying in your state of flow while doing so.

In terms of feeling empowered, I assert that having the confidence in your tools and your own productivity means you'll often "go the extra mile" to produce higher-quality output, because you're not scared of it being a time sink that you'll get stuck in.

Without this feeling of confidence, you'll often not even attempt these "extra-effort" improvements, and instead settle for something that works but could have been better.

Note that this hesitation is likely rooted in reality, e.g. you're right to be scared, because if making changes is awkward for you, it's more likely to interrupt your flow, and seriously reduce your short-term output.

Flow/OODA Loop
--------------

Flow is a widely-discussed concept. For me, an interesting definition of flow is how long (or how many cycles) you can stay in the also-oft-quoted [OODA loop](https://en.wikipedia.org/wiki/OODA_loop) (orient, observe, decide, act).

E.g., to me, the "best" programmers can quickly cycle through an OODA loop of:

* Orient themself to the codebase/requirement/etc.,
* Observe a small, progressive change to make,
* Decide to do it, and
* Act on that change.

I use the term "best" in quotes, because there are obviously other factors in overall programmer effectiveness, e.g. what strategic-/design-level decisions you make.

But my personal observation when comparing high-output vs. low-output programmers, at least in terms of most visible attributes, is the difference in speed of their OODA loop:

* High-output programmers make changes quickly, they move around in the editor quickly, they decide what change to make quickly; it's like they're playing a game that they're intimately familiar with and are spinning the cycle quickly. In contrast,
* Low-output programmers, for lack of a better term, "move slower"; they take longer to decide what change to make next, they take longer to make those changes, they take longer to determine the root cause of a test failure, etc.

However, searching for a more useful articulation than "move slower", and more on topic for tools/productivity, I think high-output programmers have more "operations" ingrained in their mind/muscle memory that do not kick them out of the OODA loop. E.g.:

* Does renaming a class across a codekick kick you out of flow/OODA?
* Does moving 20 lines of a method to another file kick you out of flow/OODA?
* Does doing a git merge kick you out of flow/OODA?
* Does using your shell to scan log output kick you out of flow/OODA?
* Does reading the business requirements kick you out of flow/OODA?
* Does reasoning about your language's concurrency model kick you out of flow/OODA?
* Does remembering your system's overall architecture kick you out of flow/OODA?

Obviously I'm being pedantic, but the theory is that the more "ingrained operations" (via good tool selection, constant practice with those tools, and then just pushing yourself to be faster) you can add to your OODA loop's toolbox, the faster, "higher-output" you'll be, as you'll be able to stay in flow longer.

(Large disclaimer, high-output is not the sole metric for overall programmer effectiveness; I have seen several times where high-volume but low-quality output has been a net negative; but I'm ignoring that for now.)

Is OODA Speed Innate?
---------------------

Given this observation that "more/faster OODA loops is better", or worded more simply as "move fast", a natural question to ask is "why do some programmers move faster/slower than others?"

And, to me, I think it can be easy to become judgmental and attribute this speed to some innate level of intelligence.

Which, earlier in my career, I did.

But, as I've matured and learned more, I've decided that, if anything, that is just too depressing of a conclusion: that productivity is eternally cast as some sort of fixed/unchangeable personal attribute.

To me, it's both more compassionate and pragmatic to purposefully avoid/ignore that conclusion, and instead to look at "OODA speed" in a more tactical, teachable manner.

Which means, instead of casting "OODA speed" or "high-output" vs. "low-output" as innate productivity or intelligence, it's more like a muscle that starts small in everyone, and is continually grown by some, or atrophied by others.

Suzuki Theory/Math Example
--------------------------

This small-muscle idea is a very popular theory these days (e.g. as described in the books Mindset, Grit, etc.), but my first exposure to it was through Suzuki educational theory, where they teach ~3-4 year-old kids to play tiny violins.

The assertion of Suzuki is that anyone can do anything, with the right environment and the right practice.

So, when you observe individuals that have *currently-visible* excellence (say a violin virtuoso), their excellence is frequently miss-attributed as an innate talent/skill, instead of being recognized as the natural by-product of the *currently-invisible* years of continual small, compounded improvements.

As an example (I'm ~80% sure this came from Suzuki's Ability Development from Age Zero book), take a teenager who is 15 and great at math. Are they just innately great at math? Maybe.

But maybe at age 5, they found math to be interesting, so they spent 10 minutes doing their math problems instead of 5 minutes like the rest of the kids. Or maybe their parents enjoyed math, so they spent 5 extra minutes on it together. Or maybe a particular teacher/teaching style happened to resonate with them individually, and they spent that extra few minutes.

So, on that initial day, they spent a few extra minutes on it.

Then, due to the same semi-random combination of interest/culture/coincidence, they did it again on the next day, then the next, and the next.

By the time they are 6-7 years old, the low-level math operations, addition/subtraction/etc., come quickly to them, so math is even more enjoyable, and now they are spending 20 minutes on it a day, instead of 5 minutes. Or, maybe they spend the same amount of time on it, but due to the low-level operations being ingrained in their quick OODA loop, a much higher proportion of their time is spent learning new material.

Repeat these small investments over 5-10 years, and yes, the *currently-visible* math skills will look like innate talent vs. the math skills of someone who, for lack of interest or environment or different priorities, has spent dramatically less time learning math over years.

(As a disclaimer, I'm willing to believe that in any field, there really are savant-style geniuses, but for my purposes that is so extremely rare that I don't think it's worth spending much time on it.)

Do you Invest in Yourself?
--------------------------

Coming back to programming, the origination of a "high OODA speed" in individuals, for me, is not innate ability, but that the "best" programmers are continually investing in themselves.

When you pick up vim, do you use only the basic `h/j/k/l` movements, and that's it, for 10 years? Or do you invest the entire 1st day doing tutorials and learning more the complex movements like `dw`, `d}`, `2df.`, etc.? And then a few months later, take a half day to learn vim macros? And then every year or so, take another hour or two to explore the latest vim techniques and plugins?

When you use git, do you struggle for months/years with "well git rebase does magical things but I know these three incantations that someone told me to do", or do you spend your first few weeks/months of git (here and there) reading the "how git really works" tutorials and blog posts, and start to understand the DAG, and how commit hashes work, and where refs are stored in `.git/`, and eventually what the rebase operation is fundamentally doing?

When you debug a production issue, do you do the minimal amount to get it fixed, and then move on? Or do you reproduce it first in a unit test? Do you try to dig into what is really going on, and why the fix works?

It is ironic, but the "best" programmers, from my observation, take the cliched approach of "go slower to go faster". They spend the effort to get better at their editor, at their language, at their tools.

So while the "low-output" programmer is optimizing for "getting back on task *right now*", and the "high-output" programmer is distracted by digging deeper into the problem, which in the short-term seems less productive, in reality over the long-term these continual small investments add up like compound interest, and, to me, eventually surface as the mythical "10x" productivity difference.

The Takeaway?
-------------

Okay, so that's educational theory, what's the actual takeaway?

The takeaway is that I would implore young or struggling programmers to *invest in yourself*.

Take the time to really understand your tools. Take the extra few hours to really learn your language. Or your test suite. Or your editor.

**And don't feel guilty about "taking company time to learn".**

Make the judgement call that it's in the company's best interests for you to learn, as this ROI will quickly pay off, for both you and them.

Yes, I have an unreasonable infatuation with programming, so I've spent many nights and weekends reading and learning over the years. But I've also spent *many more* hours of work time investing in myself (e.g. taking an extra 30 minutes to research this or that).

Don't let "I'll learn on the weekend" be an excuse. Take the time to learn it now. (Obviously this can be taken to an abusive extreme, so use good judgement.)

Eventually, after you've gone slower with yourself to invest in learning, make it a game to push yourself to go faster.

Push yourself to see how quickly you can do micro-operations. Purposefully redo a complex text operation two or three times, each time trying to use a better vim key stroke or macro. Work on getting your OODA loop as small and tight and quick as possible.

Invest In Knowledge As Well
---------------------------

I'm getting long here, but wanted to note: I've focused this article on tools, but the same "continual small investments" applies to knowledge as well.

To me, you should always feel free to "be selfish" and:

* Take 30 more minutes of a colleague's time to have them really explain their code.
* Take 45 more minutes of the product manager's time to really understand their requirements.
* Take an hour to whiteboard how your system's architecture really works.

In my opinion, these knowledge investments basically always have a positive ROI, even *for all parties involved.*

E.g. even if it looks like you're "wasting your colleague's time" by asking an annoying question, the net productivity gain to the organization will be higher, because now instead of you being stuck for 4 hours, you were unstuck after an hour with a 10 minute "interruption" investment from your colleague. So 10 minutes saved you 3 hours, which is huge to the organization.

Or, even for your interrupted colleague themself, their investment should mean that, as your small improvements compound over time, the next week, next month, next year, you'll be that much more capable and be a net gain to their own work, e.g. their commits, code reviews, design docs, etc.

Basically: be selfish in learning, but selfless in sharing.




