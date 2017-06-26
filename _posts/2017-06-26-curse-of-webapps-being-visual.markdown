---
title: The Curse of Webapps Being Visual for TDD
layout: post
---

{{page.title}}
==============

Web applications have an interesting aspect that make them somewhat unique among software systems: they are visual.

(Granted, this generalizes to all UI software, e.g. mobile applications, desktop applications, etc., but for simplicity I'm focusing on web applications.)

On one hand, I think the visual aspect has several benefits, e.g. I think web applications are particularly great for new/aspiring programmers, because having the immediate visual feedback of what you've done can be rewarding and motivating.

And even for seasoned programmers, there can be a lot of satisfaction is seeing, visually, the output of your work. (Granted, many non-UI programmers are quite happy about their own non-visual work, which is just fine.)

Developing Only Visually
------------------------

That said, there is a large downside to this visual-ness, in that it's extremely easy for developers to adopt a workflow that is primarily, or even solely, visually driven. E.g. something like:

* Change the template file
* Manually click reload, "hm, what does it look like?"
* Manually click button A, see what happens, "hm, that's wrong..."
* Update the model business logic
* Manually click reload, manually click button A again, see what happens, "hm, almost..."
* Change the controller event handling
* Manually click reload, manually click button A *again*, "ah okay, now it works"

The siren call while building a web application is to adopt this "manually keep poking at things" workflow. Because it's so easy, the browser is right there, you can see what's happening right in front of you.

But this visual aspect, which is a benefit in other ways, becomes a liability, as now our workflow has produced working code, working templates...and no tests.

While I attempt to not be dogmatic in prescribing TDD, for me it's hard to deny that the tests I add after-the-fact are almost always a fraction of what I would have added writing them as I go.

This is because, after the intellectual accomplishment of "getting it to work", it's hard to keep the discipline to add back test cases for truly every boundary case that you conquered while iterating.

Developing Sans Visual
----------------------

Given this, my challenge to web application programmers is: **develop as much code as you possibly can without looking at the result in the browser**.

Basically, treat "how does the output look on the screen" as orthogonal to "what is the behavior of my code".

And for the latter, "what is the behavior of my code", you should be driving that primarily, or even solely, by writing unit tests, with potentially extended amounts of time not in the browser.

You can do this one of two ways, one is visual-first:

1. Develop the look and feel first, by arranging all the elements on the screen, *but writing no business logic* (no models, no controllers, no event handling)
2. Then close your browser, pull up your unit test suite, and iterate on hooking everything up, but by only knowing it works by having passing tests, *do not check in the browser*

Or you could do visual-last:

1. Sketch out a skeletal structure in your templates, of just bare-bones input boxes, lists, etc; let everything be purposefully ugly, but at least have the input/output elements your code needs to drive
2. Close your browser, use unit tests to drive hooking everything together
3. Come back to your browser and do final layout

Granted, the choice of visual-first or visual-last does not have strict, as you could ebb and flow back and forth between the two. But, at least while developing the habit, I think it's useful to think of them as as distinct as possible.

(Tangentially, I think a visual-first approach is also a great way to integrate design-by-code into your team's/org's workflow, by having designers produce static mockups that developers then animate with behavior. See [staffing a front-end team](/2016/07/22/staffing-a-front-end-team.html) for more thoughts on that.)

There are two constraints to a drive-UI-by-tests approach:

1. The ability to unit-test your views, controllers, templates, and AJAX calls.
2. Learning to trust your tests.

Ability to Unit-Test Views
--------------------------

For the first constraint, it should be easy to unit test your application's view code. This includes template rendering and AJAX calls, not just pure-JavaScript code like models.

Essentially you want to be able to drive pretend browser sessions, in a BDD format like:

* Given my view is instantiated with data X
* When the user clicks on DOM element A
* Then we send request Y from the server
* And when response Z comes back
* Then DOM element B now has CSS attribute D

This looks a lot like a browser test (e.g. Selenium or webdriver.io), but the key is for this to be a unit test, using either a fake DOM or a headless browser, as the priority is not 100% browser fidelity, the priority is speed of execution (while still covering your template rendering).

I won't delve into details, as what this looks like depends on your framework, and most (all?) JavaScript frameworks these days provide this for you.

The key is that it should be stupidly easy to make these tests; easy to read, easy to write, as this is where we want 80% of a developer's time to be spent, driving unit tests that cover the controller/views/templates, as they are the guts of most web applications.

Learn to Trust Your Tests
-------------------------

Once you have a setup like above, the next trick is simply to convince yourself to trust it.

This can take time, as all the developers I've seen come into this sort of sans-visual environment/workflow, without having worked in one similar to it before, don't initially know what to do.

It's weird to not visually see elements hide and appear. It's weird to just apply a CSS style and, as long as the assert passes, assume "great, it looks perfect, on to the next unit test". 

You have to break yourself of needing to see the behavior of your application visually, and trust that if the unit tests pass, that means the templates of rendered what you expect, the DOM attributes are what you expect, the events are wired together as you expect. It will work (meaning your code works; remember, divorce code-works from style-works). **You don't have to see it to believe it.**

In my experience, after a few weeks, developers that are new to this idiom adjust, and then have a major uptick in productivity. They're freed from the monotony of reiterating "click button A, hm wrong, reload, click button A, hm still wrong", and can now stay focused in code and unit tests for an extended period of time.

Which, after awhile, of course you need to come back and visually inspect things in the browser, either because you're doing visual-last and need to complete the majority of the styling, or because you're just doing a sanity check that the happy path still looks okay.

But either way, your goal should be, once you flip back to the browser and click around for a final check up, **all of your application logic should magically just work**, the first time, because you've worked out all the kinks by driving each scenario with a non-visual unit test.

For me, it's incredibly gratifying when this happens. Especially when working in a visual-first/design-by-code environment, it can mean that, after copy/pasting the mockup's HTML/CSS over into the application's codebase, and driving the view/controller/etc. implementation solely by unit tests, the very first time I see the feature in a browser, all of it already works. That is fun.

Challenge
---------

So, that is my challenge. Try to develop your web application with as little visual input as possible.

Obviously this is an 80/20 rule, and some use cases, like particularly tricky/browser-specific rendering behavior, require staying in browser.

But if you can pull off staying out of the browser as much as possible, I think you'll be more productive, and your unit test suite much more comprehensive.



