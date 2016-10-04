---
title: Staffing a Front-End Team
layout: post
---

{{page.title}} <br/><small>(with Back-End Programmers)</small>
==============


It's pretty common/standard these days to categorize programmers as "front-end programmer" vs. "back-end programmer", and then split up teams around those roles.

There are a lot of good reasons for that, but at some point I don't think the line is as strict as it needs to be, and based on some of my experiences managing a team writing a medium-ish webapp over a few years, I thought I'd write up my musings.

(As an up-front disclaimer, obviously there are a lot of full-stack programmers as well, but I think the trend for specialization is more apparent in larger organizations, teams, and codebases, and this basically-enterprise environment is where most of my experience has been, and so that is what I'm musing about.)

First, I can see where the front-end/back-end divide came from, in that historically (e.g. for Web 1.0 webapps):

* The front-end codebases were 80% UI/UX work (making HTML/CSS look nice) and maybe 20% small JavaScript enhancements
* The back-end codebases still had the majority of the business logic/validation/etc.

These two skill sets are quite different, e.g. having a backend-end programmer spend 80% of their day doing HTML/CSS was not going to work, so having split roles made sense.

However, given webapps are basically required to be Web 2.0 these days (due to user UX expectations), front-end codebases are becoming just as large, and just as important (in terms of satisfying users' UX expectations), as the old-school back-end codebases, such that:

1. The front-end work is now 80% "just another codebase" programming and 20% UI/UX work (e.g. HTML/CSS)
2. The back-end work is basically the same, although maybe all just APIs

I say front-end codebases are now "just another codebase", because they are large enough that:

* Architecture now matters a lot more
* Testing now matters a lot more
* Refactoring now matters a lot more
* Etc.

Basically, all of the skills that are very traditional "generalist programmer" skills now matter on the front-end just as much as they do on the back-end.

Given this reality, I think the common approach (again in larger environments) has been to stay with the front-end/back-end divide, but then up-level the expected skill set of front-end programmers to include "also good at generalist/in-the-large programming". E.g. we still have front-end programmers, and they are still basically the same people they were before, but now they also grok traditional software engineering practices like testing, refactoring, etc., etc.

Which is great, I think this is a very good thing, for these front-end engineers that can straddle both "make the UI/UX look great" and "make the codebase look great".

The only wrinkle is that they are comparatively fairly rare (or at least they are in my environment).

So, what I've had success with is basically taking traditionally back-end developers (which is frankly myself as well) and putting them on the front-end.

Part of this works very well: if front-end work is now, as I assert, ~80% "just another codebase", the back-end developer might have to learn some new frameworks or languages, but otherwise they should settle into their familiar "okay, make test, make a class, write the feature, refactor the code" workflow.

What does not work well is, at least in my experience is saying: "by the way, back-end programmer, please make the UI look good by writing HTML/CSS".

This is potentially a double-standard, in that we ask front-end programmers to pick up new "generalist programmer" skill sets, but I'm asserting it's okay for back-end programmers to not have to pick up new HTML/CSS skills. My rationalization is that I think a certain part of UI/HTML/CSS layout is based on a sense of visual intuition that is easier to explain as being either innate or personality-based such that the stereotypical "I like everything in black and white" back-end programmer legitimately will never be quite that good at.

That said, I think there is an easy solution to this: have someone else do it.

I think this works, because I think a modern webapp's UX has basically three distinct phases:

1. High-level UX/interaction design
2. Low-level HTML/CSS design/layout
3. Adding dynamic behavior/application code

However your team is organized, I think these things are happening, it just depends on who does what. Traditionally, I think the primary options have been:

* One full-stack programmer doing all three (most common in smaller codebases) 
* A UX designer does 1) (typically in Photoshop or similar tool) and then a front-end programmer does 2) and 3) (very common in larger projects)

If you have the people and project where this setup works for you, I think that's great, I don't think there is anything wrong with those approaches.

However, if you share my experience of "we need more front-end programmers", and you also buy my assertion that "front-end work is now 80% programming", then I think there are two other options:

* A UX designer does both 1) and 2), so designers write HTML/CSS
* A UX designer does 1), someone else does 2), and the front-end programmer only does 3) (so a new role is created solely for laying out HTML/CSS)

The first alternative, "designers write HMTL/CSS", actually worked really well for us (at Bizo, where our CTO had the idea of working this way).

We did it by creating a fork of Bootstrap (which has nice CSS, beginner-friendly documentation, etc.), and told our designer to make all of his mockups in static HTML. As in, "if you want to make a CRUD page for New Feature A, copy/paste the `FeatureB.html` to `NewFeatureA.html` and just change it as needed".

Once he was done, we copied the Bootstrap-generated CSS file into the real webapp project, and then the front-end programmer (who was a repurposed back-end programmer), would just copy the structure of the static bootstrap HTML into the webapp's templating language.

There were several nice benefits to this "designers write HTML/CSS" approach:

1. Obviously the front-end programmer can now focus solely on dynamic behavior, and has to do zero HTML/CSS fiddling.

   This should increase their productivity (and in theory the team's overall throughput), because removing the HTML/CSS busywork lets them focus on the primary bottleneck, which is the application code itself.

   Also, by removing this HTML/CSS skill set from the front-end programmer role, we now have a much wider pool of people who we can ask to do this work, which again should increase our throughput.

2. The designer now gets *exactly* the output what they want.

   In any "designer makes a Photoshop mockup, programmer makes the HTML/CSS" workflow I've ever seen, the programmer's output does not 100%, pixel-for-pixel, match the Photoshop (or Envision or what not) output. Invariably there are little "well, this line is off by a bit, but it's really hard to get the CSS right" inconsistencies that the programmer calls "good enough", and makes the designer cringe.

   With this approach, whatever HTML/CSS was in the designer's static mockup will be exactly the HTML/CSS in the application's output, so they'll look exactly the same.

3. The application's UX inherently becomes more consistent, because now the designer is no longer using a free-form tool like Photoshop, where "every page can be a unique snowflake of putting each pixel wherever I want" (I am admittedly over-stating the "unique snowflake", because I know designers do take consistency seriously.)

   Instead, they are working directly in a structured CSS framework, where grids already exist, color constants already exist, and they immediately see the trade offs of "changing the grid for this page, changes the grid for all pages", or "if I reuse the existing form/table CSS, this new CRUD mockup layouts itself out basically automatically/with no new CSS code".

   To me, this "limiting the solution space" is actually a good thing, because it guides the application towards simplicity and consistency.

   That said, a UX person countered this point that, from their perspective, having to limit their designs by the constraints of HTML/CSS/the CSS framework is potentially sacrificing truly novel/best-in-class UX designs from emerging. Which I can see that point, but the engineer in me is fine making that trade off.

For me, this approach resulted in, to date, the best webapp I've been involved with: it looked amazing (no programmers picking colors or not getting layout 100% perfect) + had a great codebase (programmers were free to focus solely on architecture/testing/etc.).

If at all possible, this is the setup I want to emulate when working on webapps in the future.

That said, the primary con of this "designers write HTML/CSS" approach is that not all designers actually want to write HMTL/CSS. Which, to be fair, similar to accepting that traditionally back-end programmer can't pick out colors or translate mockups, of course not every single designer wants to pop into Notepad, Visual Studio Code, or Vim and crank out CSS rules.

If you're in this situation, then I would suggest trying the final variation, which is to have three roles: UX designer, HTML/CSS programmer, and front-end, application code-only programmer.

This option is ironic for me to pitch, because the basic premise of my post is reducing differentiation between roles (front-end vs. back-end programmers), not introducing new roles. Nor, admittedly, have I actually gotten to try this approach out.

But the rationale is basically that, while HTML/CSS is a separate skill from either pure UX design or pure programming, it is not actually the rarest skill of the three (in terms of cost/training required to do it), so should actually be the easiest to flexibly staff. In particular, I think writing HTML/CSS is an excellent way for tech-savvy non-engineers to bootstrap themselves into a programming career (or even bootstrap into a UX career by reporting/living in the UX org).

As a disclaimer, I know this sounds a lot like "outsource cutting up Photoshop mockups into HTML to a firm that gives you back incredibly bad/ugly HTML". The differences are that: 1) I think this should definitely not be an outsourced role, and 2) the HTML/CSS code should be crafted just like any other programmer-produced artifact, e.g. the static mockup should be version controlled, code reviewed by peers, refactored for consistency/simplicity as needed, etc.

So, that is my basic premise: if you're too large or specialized for all team members to be full-stack, does-everything designers + front-end + back-end programmers, that using static HTML/CSS mockups to be the artifact traded between UX design and application programmers can be very effective. Both as a workflow in general, and in particular if you have back-end programmers that could then be effectively-full-stack programmers.









