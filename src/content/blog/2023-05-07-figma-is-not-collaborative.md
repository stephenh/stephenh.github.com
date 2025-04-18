---
title: Figma Is Not Actually Collaborative
description: ""
date: 2023-05-07T00:00:00Z
tags: ["UX"]
---


This post, [Give it the Craigslist Test](https://ericaheinz.com/notes/give-it-the-craigslist-test/), went by HackerNews and I thought it was a great read: succinct and to the point.

Besides the author's two reasons for avoiding high-fidelity mocks in discovery (basically they distract from the outcome being delivered), I wanted to add my own: high-fidelity mocks (aka Figma) are not "deeply collaborative".

Even in modern tools like Figma, which have amazing multiplayer capabilities, I assert that high-fidelity mocks are inherently not "deeply collaborative", because they lock requirements ideation in the hands of the UX designer, who is typically the only team member with both the edit rights and the skill set of Figma.

As a huge disclaimer, designers I've worked with are very open to collaboration, by brainstorming in Zooms and discussing alternatives back/worth in Figma/Slack comment threads.

But this just isn't the same as "deeply collaborative" alternatives like physical whiteboards or low-fidelity mocks where anyone on the team (PM, eng, or even end users) can pick up a marker and ideate:

- What should the flow through the app be?
- What are the most important fields for this page?
- What's the best way to visualize this data?

### But that's the designer's job

Granted, usually the push-back on "PMs/engs making mocks" is that it's "letting them do the designer's job", e.g. rephrased as "would engineering like it if a designer started committing code?". My thoughts here are:

- Pedantically, yes, if a designer or PM or even end user committed code that passed PR review, I would love that, but more so

- **Discovery-stage mocks** are such a fundamental artifact of "the requirements" (often the _only_ documentation of the requirements), that I don't see non-UX ideation of mocks as "doing the designer's job", but really just "brainstorming the requirements", which I think is a responsibility that is shared by all team members (with the PM making the final call).

- And, per my own disclaimer about "designer-written code must pass PR review", I would definitely want "UX review" of low-fidelity mocks that have been brainstormed during discovery, or even just a 2nd pass that replaces the low-fidelity ideations with high-fidelity mocks to drive implementation.

  (Depending on the UX sophistication of your frontend engineers, you may be able to go straight from low-fidelity mocks to great-looking implementations, without a high-fidelity mock in between, but I think that capability is rare (I cannot do it), and so high-fidelity mocks are still useful to ensure the end-product still looks and functions amazing.)

### But Figma is just as fast

One other push-back I've heard is that "as a designer, I create Figmas just as quickly as I'd make low-fidelity mocks, so why not just use Figma, and get the bonus of high-fidelity from day one?".

I'm sure this statement is true, but I think my points would be:

- See "The Craigslist Test" assertions that high-fidelity is a non-feature during discovery, but
- A professional designer, _you_ can produce Figmas quickly, but no one else can. :-)

### ...so Balsamiq?

Unfortunately my biggest disclaimer is that, due to the ubiquity of Figma in the industry, I've not actually used low-fidelity tools (...or a whiteboard...) in years.

It would be interesting to use the latest tools, and pressure-test my assertions in this post on a real project.
