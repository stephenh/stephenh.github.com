---
layout: post
title: First Principles
---

:speech_balloon: So, this is the best way I can think of to comment in-line. Just generally, I think that these are all important ideas. I do question a bit whether they are "first principles", which suggest something fundamental that guides more specific advice and best practices. For example, as you point out yourself, "Always choose future pleasure" is a higher-level view of a lot of the other points in this list. I would actually argue that almost everything on this list basically boils down to "invest in the long term", although that's perhaps a bit too vague to be useful.

{{page.title}}
==============

This is my collection of first principles from which to reason about software engineering decisions.

Note that my experience is predominantly from successful-startup/enterprise environments, so that is the context for which most of these are intended, e.g. a common thread is that you're on a project/codebase that will be around for the long term.

I also make no claim that these are original; I'm just collecting them.

:speech_balloon: Thanks for the collection! It's nice to have something that I can use to kick of discussions with both you and with other people.

Principle of least surprise
---------------------------

You should reduce the amount of surprises future-maintainers (which is future-you) will face.

This means if you typically have a convention like `getFoo()`, don't start using `get_foo()`, because that is surprising. It will cause future-maintainer, or future-you, to stop and wonder "huh, I wonder why that is that way", and now future-you is distracted from their original task.

While formatting/naming conventions are an obvious/simple example, this extends beyond just the coding-in-the-small, to coding-in-the-large and architecture-in-the-large.

E.g. for coding in the large, you might consider "should I add this functionality to this class or a new one?" Or "should I add this functionality to this project or a new one?" If the answer is "a stranger would find it surprising that this class has this functionality", then you should put it somewhere else.

E.g. for architecture, you might consider "where should I store this state"? Maybe you could use database A or B. Maybe database A is the easiest, but it'd be really surprising, because most similar state like this is stored in database B. So prefer database B.

So, concrete actions:

* When writing code, think "would future-me find this surprising?" If so, don't do it, or add a comment why it has to be this way.
* When reviewing code, think "did this code surprise me?" If so, comment and ask the author to either change it, or add an explanatory comment.
* When reviewing design docs, same thing

(See [Principle Of Least Astonishment](http://wiki.c2.com/?PrincipleOfLeastAstonishment).)

A codebase should look like it was written by one person
--------------------------------------------------------

Obviously codebases are not written by one person; they are written by teams of 5-10 people, with team members coming and going over the years.

However, they should *look*, as much as possible, like they were written by one person.

It is hard to articulate how nice it is to work in a codebase like this. If you haven't, it can seem like not a big deal, e.g. why is this important? However, after you have worked in a codebase like this, you realize how nice life can be: you can easily find things, because they're all in their expected place. You can easily read code from other team members, because you all use the same convention/idioms/etc. You get to focus on the real business problems and logic.

To achieve this, you basically pick conventions and follow them. Advocate for them in code reviews. Adapt them as needed. If a convention is not working, that's fine, change it, but go change all of the old convention over to the new.

:speech_balloon: The focus on readability is the point, but I'm a bit cautious about phrasing the specific advice as "you basically pick conventions and follow them". In particular, I would recommend being very explicit that this is a plural "you" representing the team that owns the codebase, not the singular developer "you". It's really easy to end up with a bad code review culture if the route to adopting code conventions is for individuals to propose and advocate for them on reviews.

Concrete actions:

* If you find yourself doing something different than existing convention, don't.
* If you find yourself still hating that convention, lobby others to change the convention across the codebase

Code should look like the current requirements have always existed
------------------------------------------------------------------

We know that requirements will always change, and there is a lot of focus on how to deal with that on the software process side of things, Agile/etc.

However, how to deal with requirement changes in a codebase is also important.

One great rule of thumb is that, if you've written code (whether a method, a class, or project) that assumed Requirement A, if you now have to serve Requirement B (which has replaced A), you want the resulting code to look, as much as possible, like A was never a requirement in the first place.

E.g. when reading code, a future maintainer shouldn't have to be burdened with "oh, I can tell the code was originally setup to do A, but then switched to B".

Following this principle can take more time, to more cleanly move the code over to Requirement B, instead of just hacking it until it's good enough. But the payoff is pretty immediate, because soon Requirement B is going to be Requirement C, or Requirement X is going to be Requirement Y, and the code will quickly become a morass.

Note, that one big complication is when you're working in an environment that uses feature flags and A/B testing to roll out features, because by definition your code has to support two versions of a Requirement (or worse, more than two) at a time.

This is an unfortunate con of an otherwise good practice (feature flags/ramps), but this principle still applies, just once the feature flag/ramp is complete, you can come back and completely excise/clean up the old version of the code.

(Kudos to Mark Dietz for this principle.)

:speech_balloon: This strikes me as weaker than the previous point. For example, "don't abstract prematurely" is probably advice on the same level as a number of items on this list, but I wouldn't remove an abstraction if the number of uses later drops back down to one. I think that there's a reasonable argument that keeping an abstraction that has historically supported multiple real world use cases should have a lower bar to introducing an abstraction that does not yet have more than one concrete reason for existing.

Design and code for a 5-year codebase
-------------------------------------

Day to day, everything seems urgent. Product wants this feature now. Support needs this bug fixed now. Your partner team needs your API shipped now.

All of which is true.

However, if you get sucked in continually serving these short-term interests, you will end up *under-serving* these interests in the long-term. (Due to accumulated technical debt.)

Your job as an engineer, or engineering manager, is to protect the future. Yes, PM wants 1 feature now. But over the next 5 years, they're going to want 1,000 features. What is more important is being able to competently deliver all of those 1,000 features, not just the 1 we're fixated on now.

(Again, disclaimer that my context is successful-, post-Ramen-noodle startups and enterprises. If you have only `N <= 4` weeks of VC money left, you live in a different context.)

When you start a new codebase, the most important thing is not getting Feature A shipped. It's ensuring the architecture, development environment, TDD cycle, deployment steps, are setup so that, over the next 5 years, Feature A will be easy, Feature B will be easy, and Feature Z will be easy.

All codebases look great when they're new and ~2,000 LOC. It takes discipline to have a mature codebase that is 50,000 LOC, 100,000 LOC, still look good, and be a productive, pleasant experience to development in.

:speech_balloon: Hmm, I would formulate this a bit differently and phrase it as "Design and code like the code base will live for another five years." I think that it's an antipattern to reduce quality investments just because the system is nearing its projected EOL. In my experience, it's worth keeping that investment level high because (if nothing else) you preserve the *option* of extending the lifetime of the code base, which may happen regardless.

Deadlines are an anti-pattern
-----------------------------

For about 5+ years, I worked in a culture where deadlines were very rare (we had maybe 2 the entire time I was there).

At first, I thought of this as a luxurious, engineer-specific perk, that should be savored, but is otherwise somewhat selfish of engineers to lobby for.

However, despite having no deadlines, the execution at this company was very good. Because our code quality was good. And our engineer retention was very good.

When you acquiesce to deadlines, "because the business needs them", my opinion is that you are actually *hurting* the long-term interests of the business itself.

Once you have a deadline, you have no slack. Engineers can't take another day or two, or week or two, to get a feature right, to clean things up as they go, and create a good system. Instead, they take shortcuts.

On the first project, it's not a big deal. Your a little late (because you're always late), but it's okay.

On the second project, you're a little more late, because you're always late, but now you also had to work around the technical debt created in the 1st project. But you don't have slack to clean it up, so you keep going.

On the third project, the cycle continues. You're constantly falling behind.

The best option, in my experience, is for the organization to just accept deadlines don't work. That doesn't mean projects should take forever; practice Agile or MVP or what not.

:speech_balloon: Hmm...it seems like the benefits of this principle come from (1) trusting that engineers will choose to make long term investments in the codebase and (2) providing enough autonomy that they can make those choices. If enough space is set aside for this, I don't see a problem with deadlines. In particular, Agile is all about making sprint commitments and hitting your definition of done by the end of the sprint. If those count as deadlines, we had plenty of them at the company where deadlines were rare. (Aside: can we not mention that company by name?) I will agree, however, that deadlines must originate from the people closest to the implementation, not be imposed on them.

Always choose future pleasure
-----------------------------

A higher-level articulation of several of these principles is: always choose future pleasure.

This is a fairly "Protestant", eat-your-vegetables, delayed-gratification approach to software development.

I don't have any new rationale that was not in earlier principles.

Just that software development can be both very fun, and very, very frustrating.

In my experience, if you don't practice delayed-gratification, it becomes frustrating very quickly. You get codebases that are not fun to development in. Features take a long time. Things break a lot. Developers are afraid to change things.

If you slow down, and focus on making *your* future pleasant, while that initially sounds very selfish, you, by making your future job easier, are actually providing the most business value, the most features, the best ROI for the organization.

:speech_balloon: I like this as a true first principle in the foundational sense of the word. I think that we often phrased this as "optimize for maintenance" at the-company-that-shall-not-be-named.

Software development does not scale
-----------------------------------

Alex Boisvert originally articulated this to me, and there are good write ups elsewhere, e.g. see [software has diseconomies of scale](http://allankelly.blogspot.com/2015/10/software-has-diseconomies-of-scale-not.html).

My articulation is that, as an engineering manager or architect, you need to structure your systems such that no single team or repository will grow to be more than 10 people, or more than 50,000 LOC.

Once you hit these thresholds, more than 10 people, or more than 50,000 LOC, your agility significantly decreases.

Note, this does not necessarily mean productivity on a large/team *has* to be low (although it often is). I've seen ~100,000 LOC codebases where everyone was productive, because the codebase had been well cared for over it's entire lifetime, as you can leverage a lot of the shared infrastructure.

That said, while large codebases *can* be productive, anytime you have a 100,000 LOC codebase (which is actually on the small side compared to 500k or 1m LOC codebases), even if it's very clean, it's defacto very, very expensive to change. If you need to change technology stacks, or fundamentally refactor your approach, it becomes basically impossible, and you enter "this is going to be a 1-2 year rewrite" territory.

If instead you model your system as a series of 20,000 LOC modules, with nice APIs/abstractions, can you ideally evolve your modules independently, and instead of one big rewrite every X years, you can add/remove/evolve the independent modules.

On the team organization side, I think it makes a lot of sense to follow an approach like Spotify's squads (see the image [here](https://labs.spotify.com/2014/03/27/spotify-engineering-culture-part-1/), where you setup multiple, sibling teams working on feature teams, and leveraging shared infrastructure that are separate teams and repositories.

:speech_balloon: Hmm, I feel like there is a lot of assumed context here when you talk about teams and repositories. For example, Google [famously has a single repository for all of its code](http://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext), but they are able to run agile teams within that, and I don't think that it's because the overall quality of the codebase is significantly different than at other companies. I think that the most interesting part of this section is your advice to model the system as independent modules; the underlying principle here is that developers need to be empowered to optimize locally. Diffuse ownership and large teams, along with deadlines, is another way that developers end up being disempowered.

Avoid rewrites, support incremental change
------------------------------------------

Flush out.

:speech_balloon: 100% yes, even if you have no particular reasons articulated yet. :) Incidentally, I'm not sure if "flush out" is a typo for "flesh out" or not, but I enjoy the phrasing as a directive to make a brain dump.

Comments should explain why, not what
-------------------------------------

Comments in code (e.g. javadocs, etc.) are often maligned (and often rightly so), because "code should be self-documenting", "comments are always out of date", etc.

This is unfortunately very true, however, I assert these cons (comments are repetitive and/or out-of-date) primarily apply to comments that describe *what* the code does.

E.g. if you write `getFoo()` and add a comment that says "return the foo", you're describing *what* the method does, and yes that is redundant and not useful information.

However, if the *why* of `getFoo` is surprising, then a comment describing this rationale is very useful to future-maintainers and future-you, and not repetitive (because code itself does not explain why), and much less likely to become out of date (as reasons why do not change as often as the what).

E.g. "`getFoo` has to do X because if it did Y, then Z bad thing happens".

Concrete actions:

* Anytime you find yourself forced to violate the principle of least surprise, that's a good indication you should leave an explanatory comment.
* If you see "what" comments that are rundant, remove them/ask the author to remove them

Static languages are better for large scale development
-------------------------------------------------------

I'm currently fairly convinced that static types are demonstratively better for large-scale development. Where "large" is teams larger than 5, and especially teams larger than 5 that are collaborating with other teams larger than 5.

See [Why I'm a Static Typing Bigot](http://www.draconianoverlord.com/2010/11/24/why-im-a-static-typing-bigot.html) for more.

The speed of your TDD cycle is the primary driver of productivity
-----------------------------------------------------------------

Software development is a constant exercise of:

* "Try this, did it work?"
* "Yes, next thing."
* "No, tweak, try again."
* "If I make the code look like this, is that cleaner?"

The faster a developer can go through this loop, the more productive they will be.

As a rule of thumb, I think 5 seconds is the max time it should take for a developer to get feedback during their primary, day-to-day workflow. (E.g. they should spend 90% of their time in a tight TDD unit test cycle, and then maybe 10% of their time running slower integration/browser tests.)

:speech_balloon: I will emphasize that compiler errors are a form of getting feedback quickly, which is also the third item on your linked blog post in that section.

Your entire tool chain (IDE, build system, test framework, application framework) needs to be optimized for this.

For example, if the application framework takes *even a minute* to start, then you either need to:

1. Choose a different application framework, or
2. Change your use of your application framework, e.g. remove/conditionalize any expensive startup/initialization logic, or
3. Ensure most day-to-day development is decoupled from the application framework
  * E.g. structure your primary business logic (and unit tests) so that it can run by itself, without even booting the application framework in the first place.
  * This is ideal, but is usually hard to retrofit if you didn't have it initially

As another example, if on a sufficiently large codebase, your chosen language's incremental compiler causes a noticeable interrupt to developers' flow, that is a significant con that you need to weight against the other pros of the language.

Yet another example, when working on web applications, it's very common for the production Javascript to require lots of optimization/minification, etc. This is just fine, but this should expensive minification process should never be part of a developer's regularly, daily flow/TDD cycle. It's just too expensive and time consuming.

:speech_balloon: I like the write-build-verify loop as a KPI for developer productivity. I don't think that I've explicitly thought about it in those terms, so thanks for writing this section!

The less layers in your TDD cycle, the faster you will go
---------------------------------------------------------

During production, systems of course have to touch many layers:

* The browser calls the web front-end
* The web-frontend makes N REST/RPC calls
* The REST back-end makes N storage calls

However, during the daily development workflow, running tests that touch each layer is very expensive; each layer ideally needs to be setup in a clean state, reset in between each test class/method, etc.

So, as you're building your system, or building/choosing frameworks, you want to consider how the majority of your tests can use as few of these layers as possible, e.g.:

* When writing front-end code (whether JS or mobile), can you run the majority of your tests without a browser? Without a mobile device or emulator? Can you use in-memory stubs of UX controls that are "good enough"? (This is what [Tessell](http://www.tessell.org) does.)
* When writing your database layer (e.g. REST controller/etc), can you run the majority of your tests without the database? Can you use either an in-memory database, or a "basically-database" in-memory abstraction? (This is hard, and is the [holy grail of database testing](/2015/11/29/holy-grail-of-database-testing.html) IMO.)

The wrinkle here is that an ill-designed abstraction layer may make your tests less useful; e.g. if the transactional validation that your database does (foreign key constraints, etc.) is an important aspect of what you want to test, and your mock/pretend database abstraction does not enable that, then paying the cost of using the real database for every test might be a valid trade off.

Abstractions are also expensive to create and maintain, so the ROI of creating one will likely not pay off in the short-term. But if you're in a 5 year codebase, and your abstraction allows you to keep the TDD cycle below the 5 second rule of thumb, even if it takes you a quarter+ to initially setup.then that is very likely to be a ROI win.

:speech_balloon: This seems like basically just an elaboration of the previous point.

Repositories are best owned by teams
------------------------------------

Full-stack/cross-functional teams
---------------------------------

Avoid serialized development
----------------------------

In complicated/enterprise environments, it's very common for a project to require output from multiple teams.

Invariably, Team A's work will require some amount of output from Team B.

:speech_balloon: I think that the important thing here is to minimize cross-team dependencies, not serialized development. I would actually argue that on a personal level, most developers would prefer serializing their work instead of context-switching between multiple threads.

Avoid thrashing
---------------

Selfishly acquire knowledge, generously share it
------------------------------------------------

One of the fundamental activities in software development is communication: communicating what the requirements are, communicating what this bug is, communicating how things actually work.

This last one is especially important; there is a big difference between "kinda/sorta" knowing how something works (like a framework or API or database system) and really knowing (to a reasonable level of abstraction, e.g. not down to the assembly code) how something works.

If you have a crystal clear understanding in your head, of the requirements, or the system, or your build tool, or your framework, you become demonstrably more effective in your job and more valuable to the organization.

So, you should actively ask clarifying questions. Try to build a mental model of things, and ask questions that build this model. Ask "how does this work?", "why does this work?".

Saying "I don't understand" is not a bad thing, because the alternative is continuing with a fuzzy understanding that limits your effectiveness.

:speech_balloon: Related to your below "read the code" point, investing time in building a strong understanding of your stack is also a form of selfishly acquiring knowledge that should be embraced.

Interruptions are okay
----------------------

Per the last principle of acquiring knowledge, if you have to interrupt a colleague, e.g. to ask a clarifying question or get you unstuck while investigating a bug, I personally feel you should not be embarrassed/shy about breaking their flow.

My rationalization (because I do this all the time) is that, yes, you interrupt your colleague, but after that, instead of the organization having only one person being effective (your colleague), they now have two (both of you).

Granted, it will take your colleague 10 minutes to get back into flow, but if it saved you 2 hours of banging your head against a wall, that is net benefit to the organization.

(Of course/disclaimer, there is a limit where this does become annoying, and some people are more bothered by interruptions than others, so use good judgement. But I think the "annoyance" threshold is much higher than most people thinking it is.)

(As a corollary, if you're in a position of leadership, either technical or management, you should cultivate an attitude of welcoming interruptions, because at that point a large portion your job is to make others more effective.)

:speech_balloon: I think of this as advice to nudge the typical team into a more productive state. In particular, what this should encourage is developers to unblock themselves more quickly by asking for help. Telling your sales team or your support team that interrupting developers is okay is a fast way to kill productivity. Perhaps the underlying principle here is that "talent is a priority" (as said by another-not-yet-named-company) because investing in people is one of the best long-term strategies that can be adopted.

Read the source code
--------------------

For engineers, I think a good habit to develop is reading source code, especially of systems/libraries that you're using as dependencies.

A lot of my productivity when build tool X doesn't work, or framework Y is doing something dumb, is due to being able to open up their source code, set debug points, and start poking around at really understanding what is wrong.

Maybe 80% of the time, you'll figure out what you're doing wrong (and will have significantly strengthened your mental model of how that system works), and 20% of the time, you'll have found a bug in their code, and can file a bug report (or even better a patch).

Granted, you don't need to do on this on every little issue, e.g. of course google/Stack Overflow first, but the ability to do this when/as needed is something worth spending time on, and developing.



