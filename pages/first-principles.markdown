---
layout: post
title: First Principles
---

* 1P: majority of cycle is unit tests
* 1P: majority of cycle is local
* 1P: write docs like you write code
* Tests with random input are dumb

{{page.title}}
==============

This is my collection of first principles from which to reason about software engineering decisions.

Note that my experience is predominantly from successful-startup/enterprise environments, so that is the context for which most of these are intended, e.g. a common thread is that you're on a project/codebase that will be around for the long term.

I also make no claim that these are original; I'm just collecting them.

Several people have pointed out I have a few true "first principles" here, but many of them more lessons/rules of thumbs/etc. That is a good point, and I should do more reflection to separate and organize these better, e.g. also separate them into process- vs. code-oriented rules, but this is what I have for now.

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

To achieve this, you (as in the team) basically pick conventions and follow them. Advocate for them in code reviews. Adapt them as needed. If a convention is not working, that's fine, change it (by discussing and agreeing to it at the team-level), but go change all of the old convention over to the new.

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

Design and code for a 5-year codebase
-------------------------------------

Day to day, everything seems urgent. Product wants this feature now. Support needs this bug fixed now. Your partner team needs your API shipped now.

All of which is true.

However, if you get sucked in continually serving these short-term interests, you will end up *under-serving* these interests in the long-term. (Due to accumulated technical debt.)

Your job as an engineer, or engineering manager, is to protect the future. Yes, PM wants 1 feature now. But over the next 5 years, they're going to want 1,000 features. What is more important is being able to competently deliver all of those 1,000 features, not just the 1 we're fixated on now.

(Again, disclaimer that my context is successful-, post-Ramen-noodle startups and enterprises. If you have only `N <= 4` weeks of VC money left, you live in a different context.)

When you start a new codebase, the most important thing is not getting Feature A shipped. It's ensuring the architecture, development environment, TDD cycle, deployment steps, are setup so that, over the next 5 years, Feature A will be easy, Feature B will be easy, and Feature Z will be easy.

All codebases look great when they're new and ~2,000 LOC. It takes discipline to have a mature codebase that is 50,000 LOC, 100,000 LOC, still look good, and be a productive, pleasant experience to development in.

Deadlines are an anti-pattern
-----------------------------

For about 5+ years, I worked in a culture (Bizo, a startup that was bought by LinkedIn) where deadlines were very rare (we had maybe 2 the entire time I was there).

At first, I thought of this as a luxurious, engineer-specific perk, that should be savored, but is otherwise somewhat selfish of engineers to lobby for.

However, despite having no deadlines, the execution at Bizo was very good. Because our code quality was good. And our engineer retention was very good.

When you acquiesce to deadlines, "because the business needs them", my opinion is that you are actually *hurting* the long-term interests of the business itself.

Once you have a deadline, you have no slack. Engineers can't take another day or two, or week or two, to get a feature right, to clean things up as they go, and create a good system. Instead, they take shortcuts.

On the first project, it's not a big deal. Your a little late (because you're always late), but it's okay.

On the second project, you're a little more late, because you're always late, but now you also had to work around the technical debt created in the 1st project. But you don't have slack to clean it up, so you keep going.

On the third project, the cycle continues. You're constantly falling behind.

The best option, in my experience, is for the organization to just accept deadlines don't work.

Note that this doesn't mean projects should take forever; you should still practice Agile or MVP or what not.

Engineers should cultivate a sense of urgency, of GSD, that is their side of the "no deadline" bargain: you don't have to meet a made up deadline, but in return you need to work quickly and efficiently to get the business needs done as quickly as possible (while balancing short- vs. long-term needs/quality/etc.).

Always choose future pleasure
-----------------------------

A higher-level articulation of several of these principles is: always choose future pleasure.

This is a fairly "Protestant", eat-your-vegetables, delayed-gratification approach to software development.

I don't have any new rationale that was not in earlier principles.

Just that software development can be both very fun, and very, very frustrating.

In my experience, if you don't practice delayed-gratification, it becomes frustrating very quickly. You get codebases that are not fun to development in. Features take a long time. Things break a lot. Developers are afraid to change things.

If you slow down, and focus on making *your* future pleasant, while that initially sounds very selfish, you, by making your future job easier, are actually providing the most business value, the most features, the best ROI for the organization.

Software development does not scale
-----------------------------------

Alex Boisvert originally articulated this to me, and there are good write ups elsewhere, e.g. see [software has diseconomies of scale](http://allankelly.blogspot.com/2015/10/software-has-diseconomies-of-scale-not.html).

My articulation is that, as an engineering manager or architect, you need to structure your systems such that no single team or repository will grow to be more than 10 people, or more than 50,000 LOC.

Once you hit these thresholds, more than 10 people, or more than 50,000 LOC, your agility significantly decreases.

Note, this does not necessarily mean productivity on a large/team *has* to be low (although it often is). I've seen ~100,000 LOC codebases where everyone was productive, because the codebase had been well cared for over it's entire lifetime, as you can leverage a lot of the shared infrastructure.

That said, while large codebases *can* be productive, anytime you have a 100,000 LOC codebase (which is actually on the small side compared to 500k or 1m LOC codebases), even if it's very clean, it's defacto very, very expensive to change. If you need to change technology stacks, or fundamentally refactor your approach, it becomes basically impossible, and you enter "this is going to be a 1-2 year rewrite" territory.

If instead you model your system as a series of 20,000 LOC modules, with nice APIs/abstractions, can you ideally evolve your modules independently, and instead of one big rewrite every X years, you can add/remove/evolve the independent modules.

On the team organization side, I think it makes a lot of sense to follow an approach like Spotify's squads (see the image [here](https://labs.spotify.com/2014/03/27/spotify-engineering-culture-part-1/), where you setup multiple, sibling teams working on feature teams, and leveraging shared infrastructure that are separate teams and repositories.

Avoid rewrites, support incremental change
------------------------------------------

Flush out.

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

Your entire tool chain (IDE, build system, test framework, application framework) needs to be optimized for this.

For example, if the application framework takes *even a minute* to start, then you either need to:

1. Choose a different application framework, or
2. Change your use of your application framework, e.g. remove/conditionalize any expensive startup/initialization logic, or
3. Ensure most day-to-day development is decoupled from the application framework
  * E.g. structure your primary business logic (and unit tests) so that it can run by itself, without even booting the application framework in the first place.
  * This is ideal, but is usually hard to retrofit if you didn't have it initially

As another example, if on a sufficiently large codebase, your chosen language's incremental compiler causes a noticeable interrupt to developers' flow, that is a significant con that you need to weight against the other pros of the language.

Yet another example, when working on web applications, it's very common for the production Javascript to require lots of optimization/minification, etc. This is just fine, but this expensive minification process should never be part of a developer's regular, daily flow/TDD cycle. It's just too expensive and time consuming.

(Finally, while not technically part of the TDD cycle, the compilation errors provided by statically-typed languages are, for me, another form of fast feedback; see the blog post linked in the previous section for more details.)

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

Repositories are best owned by teams
------------------------------------

Flush out.

Full-stack/cross-functional teams
---------------------------------

Flush out.

Avoid serialized development
----------------------------

In complicated/enterprise environments, it's common for a project to require output/artifacts from multiple teams.

The primary way to handle this should be to avoid it all together, e.g. see the previous point on cross-functional teams.

That said, if/when you cannot avoid this, then you should strive to start all teams working on their respective artifacts at the same time.

Specifically, the anti-pattern to avoid is:

* Backend team A delivers their artifact, takes ~a quarter
* Middleware team B consumes A's output, produces their own, takes ~a quarter
* Front-end team C consumes B's output, produces the final product, takes ~a quarter

Besides the obvious problem of this now taking 3 quarters, it actually takes *more* than 3 quarters, due to the ramping and switching costs teams will incur from their disjoint timelines.

E.g. in Q2, team B will start, begin reading the requirements, and invariably start to question why team A solved things the way they did (some of this questioning will be valid, given team B's different insight into the problem; some of it won't), and kick off a round of meetings with both teams A and B where everything is re-discussed and re-decided. Then repeat when team C comes on board.

Or e.g. in Q3, team C will invariably find work that teams A and B needs to fix, either user scenarios that were missed, or outright bugs. However, those teams have likely moved on to the next thing, and now have to context switch back.

In addition to higher ramping/switching costs, because team C starts last (effectively two quarters into the project), their engineers are placed in a disadvantaged scenario: they were not around when the founding decisions were made, so have little context for the "why" things exist the way they do; they are unlikely to feel any ownership because all of these founding decisions have been made, and changing them is very expensive. This lowers their overall motivation, effectiveness, and career growth.

Finally, when team C starts work, they will inevitably face schedule pressure, because any scope increases/missed estimates in the teams head of them, and just general fact that the project is already "mostly done", means they are now what is "holding up" the project being completed, so if they could just hurry up a bit, that'd be great.

To avoid this, team C should start work immediately when the other teams start.

A typical protest for this is that team's A and B will not have any artifacts ready for team C to consume. Which is true. However, in my experience, it's best for team C to basically stub/fake output the expected artifacts and continue anyway.

This does risk team C doing some re-work, as their faked artifacts will not exactly match the real artifacts when they become available; however, the upshot is that C's faked artifacts will provide excellent feedback and documentation as to what they expected from team's A and B.

(An interesting wrinkle in this scenario is when team C is the organization's bottleneck, and, in theory of constraints terms, you want to subordinate the other teams' work to it, e.g. for the B and C output to be as-perfect, as-good-as-possible (reject defects early), when it hits the bottleneck. I'm not sure what to say here.)

Avoid thrashing
---------------

Flush out.

Selfishly acquire knowledge, generously share it
------------------------------------------------

One of the fundamental activities in software development is communication: communicating what the requirements are, communicating what this bug is, communicating how things actually work.

This last one is especially important; there is a big difference between "kinda/sorta" knowing how something works (like a framework or API or database system) and really knowing (to a reasonable level of abstraction, e.g. not down to the assembly code) how something works.

If you have a crystal clear understanding in your head, of the requirements, or the system, or your build tool, or your framework, you become demonstrably more effective in your job and more valuable to the organization.

So, you should actively ask clarifying questions. Try to build a mental model of things, and ask questions that build this model. Ask "how does this work?", "why does this work?".

Saying "I don't understand" is not a bad thing, because the alternative is continuing with a fuzzy understanding that limits your effectiveness.

(Intra-team) Interruptions are okay
-----------------------------------

Per the last principle of acquiring knowledge, if you have to interrupt a colleague, e.g. to ask a clarifying question or get you unstuck while investigating a bug, I personally feel you should not be embarrassed/shy about breaking their flow.

My rationalization (because I do this all the time) is that, yes, you interrupt your colleague, but after that, instead of the organization having only one person being effective (your colleague), they now have two (both of you).

Granted, it will take your colleague 10 minutes to get back into flow, but if it saved you 2 hours of banging your head against a wall, that is net benefit to the organization.

And ideally, while talking to your colleague, you've not just become unblocked, but you've also built up your mental model enough that, for this particular issue anyway, you can be more self-sufficient going forward.

(Of course/disclaimer, there is a limit where this does become annoying, and some people are more bothered by interruptions than others, so use good judgement. But I think the "annoyance" threshold is much higher than most people thinking it is.)

(Also, I'm specifically thinking of intra-team communication here, e.g. one engineer talking to another engineer; interruptions like fielding questions for sales and support teams is not what I'm advocating for.)

(As a corollary, if you're in a position of leadership, either technical or management, you should cultivate an attitude of welcoming interruptions from your team members, because at that point a large portion your job is to make others more effective.)

Read the source code
--------------------

For engineers, I think a good habit to develop is reading source code, especially of systems/libraries that you're using as dependencies.

A lot of my productivity when build tool X doesn't work, or framework Y is doing something dumb, is due to being able to open up their source code, set debug points, and start poking around at really understanding what is wrong.

Maybe 80% of the time, you'll figure out what you're doing wrong (and will have significantly strengthened your mental model of how that system works), and 20% of the time, you'll have found a bug in their code, and can file a bug report (or even better a patch).

Granted, you don't need to do on this on every little issue, e.g. of course google/Stack Overflow first, but the ability to do this when/as needed is something worth spending time on, and developing.

Prefer Simplicity
-----------------

When considering technical decisions (architectures, frameworks, class designs), have a strong preference for the simplest approach.

For example, the anti-thesis (IMO) of simplicity was mid-2000s era J2EE, where the J2EE container magically handled N layers of complexity, including fun things like distributed two-phase commits, and the developer was promised "it will just work". This was fine, and enticing, until it doesn't "just work", or you need to color outside the lines, and then it becomes very hard to understand.

Complexity can be a siren call, especially for bright engineers that are looking for super-generic, fun/challenging abstractions, and who, by virtue of being really smart and the primary author, really can hold the complex approach in their head.

However, the codebase, team, and business will be best served by focusing your intelligence into finding the simplest approach possible, because that is usually the quickest to implement, the easiest to reason about while debugging, and the easiest to change as needed.

Granted, you will ocassionally have to, out of necessity, choose a complex approach, but if most your other choices were for the simple approach, then ideally a little complexity here and there will be tractable.

Common Pattern: Durable Async Changes
-------------------------------------

Mark Dietz: Another blog post I've never gotten around to writing is patterns your code base should have a standard way of supporting, one of which is “durably do something asynchronously after an online change”.

The essential thrust of the post is that you need an answer when someone asks a question like “how do I stop a campaign from serving when the campaign is paused?” and the answer for the basic case (low QPS, reasonable latency) should be as easy and well understood as adding a new REST endpoint:

* here's where you put your code
* here's how long it take before your code runs
* here's the default retry semantics and how to change it
* exceptions after retries are done are automatically logged and alerted on

Common Pattern: Sync Changes
----------------------------

Similar to the last point, but synchronous, in-transaction.

Common Pattern: Add a New Entity
--------------------------------

* How many files do you have to touch?
* How easy is the datastore modification?
* How many endpoints do you have to touch?
* How many new DTOs/services/interfaces/protos/schemas do you need?

Common Pattern: Write Patterns vs. Read Patterns
------------------------------------------------

Similar to reacting to async changes, on any source-of-truth write:

* Transform the data into `N` easy to read/denormalized forms
* How is that data pushed out to readers?
* How is cache invalidation handled?
* How is rebootstrapping handled?
* How is schema evolution handled?

Typed Logic / Generic Plumbing
------------------------------

Code that programmers *must* write (business rules, UI layers, analytics jobs, etc.) I want to be 100% typed.

Code that programmers don't *have* to write, I to be super-generic, e.g. so generic they don't have to write it.

E.g. a code smell is "I made an new employee entity, now I have to touch the `EmployeeEndpoint`, `EmployeeService`, `EmployeeFactory`, etc." all to handle dumb/boilerplate "data in/out" problems.

Typed architectures are prone to this anti-pattern, although ironically given they have types/schemas, they should be very amenable to judicious generic programming.

E.g. contrast the "update all the pipes for `Employee`" to something like your SQL connection: when I add a new SQL table, do I have to change my JDBC driver? Or reboot my database? No, SQL is a generic pipe.

I think you want as many generic pipes as possible, so that you can scale from 5 entities to 50 to 500 entities.



