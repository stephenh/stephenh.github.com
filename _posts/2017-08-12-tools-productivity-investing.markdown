---
layout: post
title: Tools, Productivity, and Investing in Yourself
---

{{page.title}}
==============

I was recently putting together a [list](/pages/tools.html) of tools that I like and use, and what started as an introduction on that page about the importance of tools kept growing and turned into this longer post. So, here we go.

Basically, I think tools are an important aspect of productivity, but also that the continuous selection, adoption, and practice of tools is part of a larger trait of self-teaching and self-improvement.

(And, as an up-front disclaimer, I don't think any of this is particularly new/ground-breaking, e.g. a lot of the educational theory is pretty mainstream these days, this is just my musings/articulation.)

First- vs. Second-Order Productivity Effects
--------------------------------------------

Obviously with tools, there is the first-order effect/rationale of "immediate time saved" that enables a programmer to move more quickly when they leverage a tool.

E.g. the raw "time saved by typing X keystrokes instead of Y keystrokes" by using emacs/vi bindings, or "time saved by using `ripgrep` instead of hunting/pecking around in random files"; 10 seconds instead of 60 seconds.

These initial time-saved values seem, compared to the span of an 8-hour work day or a 3-month project, to be incredibly small. E.g. 5 seconds here vs. 60 seconds there. Big deal.

But I assert there are several second-order productivity gains, beyond the initial "only a few seconds saved", which are:

1. being empowered by feeling you can make non-trivial changes quickly,
2. good tools can relieve drudgery, and
3. staying in your state of flow.

Feeling Empowered To Do More
----------------------------

I assert one of the second-order productivity effects from being skilled with tools is that the increased confidence you have in yourself and your own productivity means you'll often "go the extra mile" to produce higher-quality output.

E.g. you'll go ahead and break the large `doSomethingTricky()` method into a few smaller `trickyButNowReadble()` methods. Or do some renames that touch a lot of code, but update it to consistently use the new terminology that the team/business is now using.

If you don't feel confident in your own tools, skills, and productivity, you'll often not even attempt these "extra-effort" improvements, because you're scared of it being a time sink that you'll get stuck in.

Instead, you settle for something that works but could have been better.

Note that this hesitation is likely rooted in reality, because your intuition is correct: if making changes is awkward for you, it's more likely to interrupt your flow and seriously reduce your short-term output.

But it doesn't have to be that way.

Good Tools (and Skills) Can Relieve Drudgery
--------------------------------------------

Somewhat related to feeling empowered due to your own productivity, is good tools and skills just making the more tedious aspects of your job more fun.

The first example I remember of this, I swear comes from Donald Knuth, but Google is failing to confirm my recollection.

The story I remember was about Knuth's grandma, who was a stereotypical old German housewife. He relates that every day, his Grandma would clean the kitchen, and the dining room table, and wipe off the crumbs and polish it to a shine. Every day, the same tedious task, wipe off the crumbs, clean the table, wipe off the crumbs, clean the table.

But what made the story unique, and hence Knuth telling it, was that his grandma's dining room table was one of the old-world, hand-made, solid-wood works of art. So, when she cleaned it, she was not thinking "blah, cleaning this table sucks", but "I enjoy this table looking nice, so I look forward to cleaning it".

(I'm really reaching for the exact phrasing he used to tell the story, and someone in the comments please correct me if I've miss-attributed this story.)

But, basically, if you have nice things, and you keep those things nice, it can turn tasks that are otherwise boring and tedious into a craft that you take pride in.

As another non-programming example, I have historically hated lawn work. But, owning a house, even with judicious outsourcing, semi-regular lawn work is just my lot in life now. However, I've found that if I look for good tools, e.g. a garden hose I like, or quick-connect couplings (fancy!), or what not, I can basically trick myself into researching "fine, what's the best way to do this", and then when the task comes up, replace my previous loathing for the overall task with appreciation for the tools I've selected and (hopefully) how well they are working.

Finally, relating this back to programming, for me this is how editing code works. I get an almost unnatural joy from refactoring code, even tedious refactorings like "change X files from style Y to style Z" or "change X methods from having 2 parameters to 3 parameters", because: a) I make it a game to see how quickly I can do it, by leveraging my various tools/skills/etc., and b) I savor and enjoy the end result.

Just like Knuth's grandma's gratification of "ah, this is a nice table", my reaction is "ah, this is a nice codebase." (Or at least nicer than it was before.)

If you have good tools, and you've practiced using them to the level that you genuinely enjoy using them, previously tedious tasks, for me, actually become fun.

Staying in Flow/OODA Loop
-------------------------

The third/last second-order productivity effect is staying in flow.

Flow is a widely-discussed concept, both academically and in practice, so I'll assume everyone is generally knowledgable about it.

That said, for me, an interesting definition of flow that I recently heard is: how long you can stay (or how many uninterrupted cycles you can complete) in the also-oft-quoted [OODA loop](https://en.wikipedia.org/wiki/OODA_loop) (orient, observe, decide, act).

E.g., to me, the "best" programmers can quickly cycle through an OODA loop of:

* Orient themself to the codebase/requirement/etc.,
* Observe a small, progressive change to make,
* Decide to do it, and
* Act on that change.

I use the term "best" in quotes, because there are obviously other factors in overall programmer effectiveness, e.g. what strategic-/design-level decisions you make.

But my personal observation when comparing high-output vs. low-output programmers, at least in terms of visible attributes, is the difference in the speed of their OODA loop:

* Most "high-output" programmers make changes quickly, they move around in the editor quickly, they decide what change to make quickly; it's like they're playing a game that they're intimately familiar with and are spinning the cycle quickly. In contrast,
* Most "low-output" programmers, for lack of a better term, "move slower"; they take longer to decide what change to make next, they take longer to make those changes, they take longer to determine the root cause of a test failure, etc.

So, continuing into more armchair musing, I believe faster execution comes from executing many small, back-to-back, uninterrupted OODA loops of ~30-60 seconds each, instead of one long 10-minute OODA loop.

E.g. even for the same task, e.g. "work on this ticket", breaking it down into many small "loop!, loop!, loop!" cycles ("write this ~10-line test", "clean up this method", "what is the simplest state to pass in to this method"), instead of just one long "llllooooopppp."

Tying this back to tools, and practice with those tools, I think "high-output" programmers have more "operations" ingrained into their mind/muscle memory that do not kick them out of (or significantly delay) their current OODA loop, so that, besides just the 30-second vs. 5-minute win for the current loop, the second-order win is being able to immediately choose and start executing their next OODA loop.

For example, here are some concrete tasks that, in theory, can become "ingrained" operations:

* Does renaming a class across the codebase kick you out of flow/OODA?
* Does moving 20 lines of a method to another file kick you out of flow/OODA?
* Does doing a git merge kick you out of flow/OODA?
* Does using your shell to scan log output kick you out of flow/OODA?

Note that the above reasons are tool-focused, how quickly can you leverage your tools, but then there are also cognitive aspects/"operations" within the OODA loop:

* Does reading the business requirements kick you out of flow/OODA?
* Does reasoning about your language's concurrency model kick you out of flow/OODA?
* Does remembering your system's overall architecture kick you out of flow/OODA?

Obviously I'm being pedantic, but the theory is that the more "ingrained operations" (via good tool selection, constant practice with those tools, and then just pushing yourself to be faster) you can add to your OODA loop's toolbox, the faster, "higher-output" you'll be, as you'll be able to stay in flow longer.

(Large disclaimer, high-output is of course not the sole metric for overall programmer effectiveness; I have definitely seen examples of high-volume but low-quality output, and that is not the goal.)

Is OODA Speed Innate?
---------------------

Given this observation that "more/smaller/faster OODA loops is better", or worded more simply as "move fast", a natural question to ask is "why do some programmers move faster/slower than others?"

And, to me, I think it can be easy to become judgmental and attribute this speed to some innate level of intelligence.

Which, earlier in my career, I did.

But, as I've matured and learned more, I've decided that, if anything, that is just too depressing of a conclusion: that productivity is eternally cast as some sort of fixed/unchangeable personal attribute.

To me, it's both more compassionate and more pragmatic to purposefully avoid/ignore that conclusion, and instead to look at "OODA speed" in a more tactical, teachable manner.

Which means, instead of casting "OODA speed" or "high-output" vs. "low-output" as innate productivity or intelligence, it's more like a muscle that starts small in everyone, and is continually grown by some, or atrophied by others.

Suzuki Theory/Math Example
--------------------------

This small-muscle idea is a very popular theory these days (e.g. as described in the books [Mindset](https://www.amazon.com/dp/B000FCKPHG), [Grit](https://www.amazon.com/dp/B010MH9V3W), [Peak](https://www.amazon.com/dp/B011H56MKS), etc.), but my first exposure to it was through Suzuki educational theory, where they teach ~3-4 year-old kids to play tiny violins.

The assertion of Suzuki is that anyone can do anything, with the right environment and the right practice.

So, when you observe individuals that have *currently-visible* excellence (say a violin virtuoso), their excellence is frequently miss-attributed as an innate talent/skill, instead of being recognized as the natural by-product of the *currently-invisible* years of continual small, compounded improvements.

As an example (I'm ~80% sure this came from Suzuki's [Ability Development from Age Zero](https://www.amazon.com/dp/B004HHOH1A) book, but it could have come from any of Mindset/Grit/etc.), take a teenager who is 15 and great at math. Are they just innately great at math? Maybe.

But maybe at age 5, they found math to be interesting, so they spent 10 minutes doing their math problems instead of 5 minutes like the rest of the kids. Or maybe their parents enjoyed math, so they spent 5 extra minutes on it together. Or maybe a particular teacher/teaching style happened to resonate with them individually, and they spent that extra few minutes. (Or maybe, like my son, they found a gamified version of math, e.g. [Prodigy](https://prodigygame.com/), that they played constantly.)

So, on that initial day, they spent a few extra minutes on it.

Then, due to the same semi-random combination of interest/culture/coincidence, they did it again on the next day, then the next, and the next.

By the time they are 6-7 years old, the low-level math operations, addition/subtraction/etc., come quickly to them, so now math is even more enjoyable, and now they are spending 10 or 20 minutes on it a day, instead of 5 minutes.

Or, maybe they spend the same amount of time on it, but because the low-level operations are ingrained in their quick OODA loop, they spend a much higher proportion of their time learning new material. And this forms a feedback loop, where they start ingraining even more, higher-level operations.

Repeat these small investments over 5-10 years, and yes, the *currently-visible* math skills will look like innate talent vs. the math skills of someone who, for lack of interest or environment or different priorities, has spent dramatically less time learning math over years.

(As a disclaimer, I'm willing to believe that in any field, there really are savant-style geniuses, but for my purposes that is so extremely rare that I don't think it's worth spending much time on it.)

Replace "math" with "programming", or really whatever your chosen field is, and, to me, that's my current best explanation for "high output" vs. "low output" programmers.

Do you Invest in Yourself?
--------------------------

So, coming back to programming, the origination of a "high OODA speed" in individuals, for me, is not innate ability, but that the "best" programmers are continually investing in themselves.

This post was initially about tools, and the assertion "tools make you faster"; but tools don't magically/immediately make you better. They are often very difficult to use initially, especially powerful ones.

E.g. when you pick up vim, do you use only the basic `h/j/k/l` movements, and that's it, for 10 years? Or do you invest the entire 1st day doing tutorials and learning more the complex movements like `dw`, `d}`, `2df.`, etc.? And then a few months later, take a half day to learn vim macros? And then every year or so, take another hour or two to explore the latest vim techniques and plugins?

When you use git, do you struggle for months/years with "well git rebase does magical things but I know these three incantations that someone told me to do", or do you spend your first few weeks/months of git (here and there) reading the "how git really works" tutorials and blog posts, and start to understand the DAG, and how commit hashes work, and where refs are stored in `.git/`, and eventually what the rebase operation is fundamentally doing?

When you debug a production issue, do you do the minimal amount to get it fixed, and then move on? Or do you reproduce it first in a unit test? Do you try to dig into what is really going on, and why the fix works?

It is ironic, but the "best" programmers, from my observation, have the stubbornness to work through these initial learning curves (of tools or business requirements or system architecture), and take the cliched approach of "go slower to go faster". They spend the effort to get better at their editor, at their language, at their tools.

So where the "low-output" programmer, when they feel frustrated (with new tools, or new requirements, etc.), optimizes for "getting back on task *right now*", in contrast the "high-output" programmer, when similarly frustrated, doubles down on the frustration and digs deeper into the problem, basically allowing themselves to get "distracted" from the initial task at hand.

Which in the short-term seems less productive, but over the long-term these continual small investments add up like compound interest, and, to me, eventually surface as the proverbial "10x" productivity difference.

The Takeaway?
-------------

Okay, so that's educational theory, what's the actual takeaway?

The takeaway is that I would implore young or struggling programmers to *invest in yourself*.

Take the time to really understand your tools. Take the extra few hours to really learn your language. Or your project's framework. Or your editor.

**And don't feel guilty about "taking company time to learn".**

Make the judgement call that it's in the company's best interests for you to learn, as this ROI will quickly pay off, for both you and them.

Yes, I have an unreasonable infatuation with programming, so I've spent many nights and weekends reading and learning over the years. But I've also spent *many more* hours of work time investing in myself (e.g. taking an extra 30 minutes to research this or that).

Don't let "I'll learn on the weekend" be an excuse. Take the time to learn it now, on the job.

Instead of fixing the bug in 30 minutes, spend 2 hours to really understand what happened. Instead of rushing a feature because your product manager says "now now now!", push back that you need to deliver a quality solution.

Obviously this can be taken to an abusive extreme, so use good judgement.

Eventually, after you've gone slower with yourself to invest in learning, make it a game to push yourself to go faster.

Push yourself to see how quickly you can do micro-operations. Purposefully redo a complex text operation two or three times, each time trying to use a better vim key stroke or macro. Work on getting your OODA loop as small and tight and quick as possible.

In time, this will form a feedback loop, as you should be executing so quickly, that no one will notice when you keep "sneaking in" learning time.

Invest In Knowledge As Well
---------------------------

I'm getting long here, but wanted to note: I've focused this article on tools, but the same "continual small investments" applies to knowledge as well.

To me, you should always feel free to "be selfish" and:

* Take 30 more minutes of a colleague's time to have them really explain their code.
* Take 45 more minutes of the product manager's time to really understand their requirements.
* Take an hour to whiteboard how your system's architecture really works.

In my opinion, these knowledge investments basically always have a positive ROI, even *for all parties involved.*

E.g. even if it looks like you're "wasting your colleague's time" by asking an annoying question, the net productivity gain to the organization will be higher, because now instead of you being stuck for 4 hours, you were unstuck after an hour with a 30 minute "interruption" investment from your colleague. So 30 minutes saved you 3 hours, which is huge to the organization.

And even for your interrupted colleague, who "lost" 30 real minutes + another hour to get back into their own flow, their investment in you should mean that, as your small improvements compound over time, the next week, next month, next year, you'll be that much more capable and be a net gain to their own work, by being able to bring value to their commits, their code reviews, their design docs, etc.

Basically: be selfish in learning, but selfless in sharing.




