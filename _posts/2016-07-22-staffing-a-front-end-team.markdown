---
title: Staffing a Front-End Team
layout: post
---

{{page.title}}
==============


It's pretty common/standard these days to categorize programmers as "front-end programmer" vs. "back-end programmer", and then split up teams around those roles.

There are a lot of good reasons for that, but at some point I don't think the line is as strict as it needs to be, and based my experience managing a team writing a medium-sized webapp over a few years, I thought I'd write up my musings.

(As an up-front disclaimer, my experience is primarily in established-startup/basically-enterprise environments. This means larger teams and larger codebases, where role specialization is common. As such, my comments apply primarily to that environment, and not necessarily a smaller startup/bootstrap/agency environment where it's easier (or required) for people to wear many hats.)

Historical Context
------------------

First, I can see where the front-end/back-end divide came from, in that historically (e.g. for Web 1.0 webapps):

* The front-end codebases were 80% UI/UX work (making HTML/CSS look nice) and maybe 20% small JavaScript enhancements
* The back-end codebases still had the majority of the business logic/validation/etc. Basically all of the code. 90%+ of the code lived in the back-end tier.

These two skill sets ("make a great looking UI" vs. "make a great looking codebase") are quite different, e.g. having a backend-end programmer spend 80% of their day doing HTML/CSS was not going to work, so having split roles made sense.

Webapps Are Now Real Code
-------------------------

However, given webapps are basically required to be Web 2.0 these days (due to user UX expectations), front-end codebases are becoming just as large, and just as important (in terms of satisfying users' UX expectations), as the old-school back-end codebases, such that:

1. The front-end work is now 80% "just another codebase" programming and 20% UI/UX work (e.g. HTML/CSS)
2. The back-end work is basically the same, although maybe all just APIs

I say front-end codebases are now "just another codebase", because they are large enough that:

* Architecture now matters
* Testing now matters
* Refactoring now matters
* Etc.

Basically, all of the skills that are very traditional "generalist programmer" skills now matter on the front-end just as much as they do on the back-end.

Given this reality, I think the common approach (again in larger environments) has been to stay with the front-end/back-end divide, but then up-level the expected skill set of front-end programmers to include "also good at generalist/in-the-large programming".

E.g. we still have front-end programmers, and they are still basically the same people they were before, but now they also grok traditional software engineering practices like testing, refactoring, etc., etc.

Which is great, I think this is a very good thing, for these front-end engineers that can straddle both "make the UI/UX look great" and "make the codebase look great".

The only wrinkle is that they are comparatively rare.

Leverage Backend Talent
-----------------------

So, what I've had success with is taking traditionally back-end developers (which includes myself) and putting them on the front-end.

Part of this works very well: if front-end work is now, as I assert, ~80% "just another codebase", the back-end developer might have to learn some new frameworks or languages, but otherwise they should settle into their familiar "okay, make test, make a class, write the feature, refactor the code" workflow. And "make sure this codebase can be 50,000 LOC and not suck."

What does not work well is, at least in my experience is saying: "by the way, back-end programmer, while you're writing the JavaScript, please also make the UI look good by writing the HTML/CSS".

This is potentially a double-standard, in that we just asked front-end programmers to pick up new "generalist programmer" skill sets (because webapps are now real code), but I'm asserting it's okay for back-end programmers to not have to pick up new HTML/CSS skills. My rationalization is that I think a certain part of UI/HTML/CSS layout is based on a sense of visual intuition that is easier to explain as being either innate or personality-based such that the stereotypical "I like everything in black and white" back-end programmer legitimately will never be quite that good at.

That said, I think there are several ways to avoid this.

High-Level Workflow
-------------------

I think a modern web application's UX has basically three distinct phases:

1. High-level UX/interaction design
2. Low-level HTML/CSS design/layout
3. Adding dynamic behavior/application code

However your team is organized, these steps are happening, it just depends on who does what.

Traditionally, I think the primary options for executing this workflow have been:

* "One guru": a single person all three steps.

  This is typically the most hip, "unicorn" role, where one person who is both a full-stack programmer + designer does all three steps.

  There is definitely a benefit to this approach: a single person can iterate very quickly across all domains, and produce tight, well-integrated work.

  Unfortunately it's not realistic to hire a large team of people like this. And, musing, I think the large corporate environments that need "a well-staffed team" typically stiffle the creativity and agility that the these people crave.

* "UX design-only + dual-role programmer": A UX designer does Step 1 (typically in Photoshop or similar tool) and then a front-end programmer does both Step 2 and Step 3.

  This is very common, and is basically the de facto way of scaling a cross-functional web application team. However, it also has the cons touched on earlier in this article.

If you have the people where either of these work for you, I think that's great, I don't think there is anything wrong with those approaches.

However, if you share my experience of "we need more front-end programmers", and you also buy my assertion that "front-end work is now 80% programming", then I think there are two other options:

* "UX dual-role + code-only programmer": A UX designer does both Step 1 and Step 2, so delivers actual HTML/CSS to the programmer.

  The programmer just fills in the spots of application logic around the existing HTML/CSS, and doesn't spend any time futzing with layout.

* "Split all three roles": A UX designer does Step 1, "someone else" does Step 2, and the front-end programmer only does Step 3.

  In this approach, we create a "new" (see disclaimer later) role to sit between the UX designer and the programmer.

Designers Write HTML/CSS
------------------------

The first alternative, "UX dual-role", where designers write HMTL/CSS, is what I have the most experience with. It worked extremely well for us (at Bizo, where our CTO had the idea of working this way).

We did it by creating a fork of Bootstrap (which has nice CSS to start from, beginner-friendly documentation, etc.), and told our designer to make all of his mockups in static HTML.

As in, "if you want to make a CRUD page for New Feature B, copy/paste the `FeatureA.html` to `FeatureB.html` and just change it as needed".

He would then check in his HTML into our fork-of-Bootstrap git repo, and we would code review his HTML/CSS just like any other programming artifact. (This also really helped our designer quickly ramp up on HTML/CSS, which granted expedited learning is one of the benefits of code reviews.)

Once he was done, we periodically copied the Bootstrap-generated CSS file into the real webapp project, and then the "front-end programmer" (who was a repurposed back-end programmer), would just copy the structure of the static bootstrap HTML into the webapp's templating language.

There were several nice benefits to this approach:

1. Obviously the front-end programmer can now focus solely on dynamic behavior, and has to do zero HTML/CSS fiddling.

   This should increase their productivity (and in theory the team's overall throughput), because removing the HTML/CSS busywork lets them focus on the primary bottleneck, which is the application code itself.

2. By removing this HTML/CSS skill set from the front-end programmer role, we now have a much wider pool of people who we can ask to do this work, which again should increase our throughput.

3. The designer now gets *exactly* the output what they want.

   In any "designer makes a Photoshop mockup, programmer makes the HTML/CSS" workflow I've ever seen, the programmer's output does not 100%, pixel-for-pixel, match the Photoshop (or Envision or what not) output.

   Invariably there are little "well, this line is off by a bit, but meh it's really hard to get the CSS right" inconsistencies that the programmer calls "good enough", and makes the designer cringe.

   With this approach, whatever HTML/CSS was in the designer's static mockup will be exactly the HTML/CSS in the application's output, so they'll look exactly the same.

4. The application's UX inherently becomes more consistent, because now the designer is no longer using a free-form tool like Photoshop, where "every page can be a unique snowflake of putting each pixel wherever I want."

   (I am admittedly over-stating the "unique snowflake", because I know designers take consistency seriously.)

   Instead, they are working directly in a structured CSS framework, where grids already exist, color constants already exist, and they immediately see the trade offs of "changing the grid for this page, changes the grid for all pages", or "if I reuse the existing form/table CSS, this new CRUD mockup layouts itself out basically automatically/with no new CSS code".

   To me, this "limiting the solution space" is actually a good thing, because it guides the application towards simplicity and consistency. And "fighting the implementation constraints" will happen at some point, so we might as well move that sooner in the workflow pipeline (instead of waiting for the programmer to get involved), because the designer will be the most informed to make the trade-off decisions inherent in actually creating the working artifact.

For me, this approach resulted in, to date, the best webapp I've been involved with: it looked amazing (no programmers picking colors or not getting layout 100% perfect) + had a great codebase (programmers were free to focus solely on architecture/testing/etc.).

That said, that are several cons to this approach:

* Not all designers want to write HMTL/CSS.

  This is very fair; similar to accepting that "traditional back-end programmers can't pick out colors or translate mockups", of course not every designer wants to pop into Notepad, Visual Studio Code, or Vim and crank out CSS rules.

* By working directly in HTML/CSS, designers risk limiting their designs by the constraints of HTML/CSS/the CSS framework, potentially sacrificing truly novel/best-in-class UX designs from emerging.

  This con was articulated by a UX person that I know, and I suppose I agree in theory.

  That said, the designer I know who did write HTML/CSS, started his designs very free-form, on pen and paper, which in theory would not have any implementation constraints. And only when he had something sketched out, would he jump over to HTML/CSS for a high-fidelity mockup.

* This approach (and admittedly this whole post) is very web-centric, and it's not clear how this would extend to "designers write XCode layouts" for mobile and other platforms/mediums. Maybe it does/maybe it does not, I just don't have the experience to say.

Nonetheless, if at all possible, this is the setup I want to emulate when working on webapps in the future.

Split All Three Roles
---------------------

If for some reason you can't use the "UX dual-role/designers write HTML/CSS" approach, then I suggest trying the final variation, which is to have three distinct roles: UX designer, HTML/CSS programmer, and front-end code-only programmer.

This option is ironic for me to pitch, because the basic premise of my post is reducing differentiation between roles ("front-end" vs. "back-end" programmers), not introducing new roles.

Nor have I actually used this approach.

But the rationale is basically that, while HTML/CSS is a separate skill from either pure UX design or pure programming, it is not actually the rarest skill of the three (in terms of cost/training required to do it), so should actually be the easiest to flexibly staff.

In particular, I think writing HTML/CSS is an excellent way for tech-savvy non-engineers to bootstrap themselves into a programming career (or even bootstrap into a UX career by reporting/living in the UX org) by starting out doing HTML/CSS-only, and then picking up JavaScript as their gateway language.

As a disclaimer, I know this sounds a lot like "outsource cutting up Photoshop mockups into HTML to a firm that gives you back incredibly bad/ugly HTML". The differences are that:

1. This definitely should not be an outsourced role, and
2. The HTML/CSS code should be crafted just like any other programmer-produced artifact, e.g. the static mockup should be version controlled, code reviewed by peers, refactored for consistency/simplicity as needed, etc.

Conclusion
----------

So, wrapping up, my basic premise is: if you're too large or specialized for all team members to be  "dual-role/good at both UX + programming" programmers, then using static HTML/CSS mockups as the artifact traded between UX design and code-only front-end programmers can be very effective.

And while I think is an effective workflow even if you're just starting out, it's also particularly effective if you have already have strong back-end programmers on staff that could then become (and ideally enjoy being) effectively-full-stack programmers.

