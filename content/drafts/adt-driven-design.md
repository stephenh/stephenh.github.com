---
date: "2017-08-18T00:00:00Z"
draft: true
title: ADT Driven Design
---

As a working software engineer, we have many "lots in life"--changing requirements, constantly evolving technical choices, many of which are challenges that make the job fun and unique on a day-to-day basis.

But, for me, one of the "lots in life" that is not necessarily fun is the constant tension between UX and eng, particularly hand-offs that constantly re-hash "are these designs using our component system?".

It seems like this should be an obvious question with a black & white answer: the design 100% uses the component library build blocking, or no it does not.

Of course, engineers love black & white questions, and we frequently find the answer is "no"--designs are bespoke, using a slightly different layout, or a slightly different filter, or a slightly different table, or a slightly different component.

After going through this enough times, I'm generally coming to the conclusion that designers legitimately *think* their designs "use the component library", and the true bad actors are **UX design tools** that fundamentally are too flexible and still allows/encourages designers to create bespoke designs.

Of course, today that tool is Figma, which leads to my assertion that "Figma is the new Photoshop".

For engineers, this should invoke cringe, because Photoshop was infamous for letting designers "put pixels whereever they want", and then ask/expect engineers to do pixel-perfect matching, despite their meticulously hand-placed pixels being a fundamentally different medium that browsers/HTML/rendering engines.

In theory, Figma was supposed to break from "the Photoshop" era by embracing "CSS-ish" layout, i.e. designers do not literally paint pixels, instead they work in Figma's psuedo-CSS hierarchy of boxes, that is "close-ish" to what engineers will be asked to build.

This is an improvement! And it works well for "creating a one-off mock in Figma" and translating it to "a one-off page in React/HTML/CSS".

But this is not what engineers are asked to do!

What engineers are asked to do is *repetitively* assemble the pages out of *re-usable* building blocks of component libraries, with two goals in mind:

1. To move faster during implementation, and
2. To achieve visual consistency across the app

And so while engineers are fundamentally in "assemble components" mode, designers are still in "create boxes one-by-one" mode.

Granted, Figma has component support, but only as a "globed on top" way of "copy/pasting around boxes", as little boats of "reusable components" in the huge sea of "still one-off boxes" that is a complete page-level layout. The escape hatch to "just use custom boxes" is always there, a siren call, asking for the designers to "go rogue", and just make this tiny little change.

## The Vision

What today's software delivery teams (...for those building information management/CRUD apps) need is a strict separation between:

* The *intention* of a page's functionality, and
* The *visual rendering* of that declarative functionality projected into specific components

And this separation needs to be pushed as far upstream as possible: **into the designer's core, everyday workflow**.

The goal is **not** just "keeping designers in line", ideally this is a **productivity unlock** for designers, b/c it moves their skills "up a level", from "pushing boxes around to" to "truly declaring the intent of this user's workflow".

### ADTs

What would this look like?

We need ADTs. Abstract Data Types are "just data" that have two things:

* a `kind` that says "this data item is a (button | table | modal | text-field | select-field)", and
* a per-`kind` set of fields that describe it, i.e. `variant: primary` or `multi-select: true`

A designer's workflow is then fundamentally split into two realms:

1. Defining your components
   - This is both their props (the ADT, the contract), and as well
   - Their implementation (specific rendering to HTML/CSS)
2. Defining your application's pages *only* as data
   - "No custom boxes allowed"

The tool should strictly delineate these two modes: the designer must only ever work "in component definition" mode (freedom to define new props, new boxes) or "page definition" mode (creating specific prop trees and then letting the component library render them to a UI).

When we look at this from the engineer's perspective, this is very obviously mapped to.

1. This is the component library (internal or external), that is reusable, and highly-leveraged.
2. These are the application's pages

## Other musings

The props should be a common definition language.

Does your app use MUI? Or Spectrum? Or Tailwind? **It should not matter to your designs OR your application pages**. The declaration of "I need a button w/variant: primary", "I need a select-field with options x/y/z" is orthogonal to "what do these ADTs actually look like?"

I should be able to "reskin" my application from MUI to Tailwind to Spectrum as easily as switching from dark mode to light mode--none of the ADT values I've declared need to change, they just need rendered out with different colored/sized boxes & pixels & shadings.

### Marketplace

If we established "the common ADT", that defined the "canonical props" for a button, a table, a form field, etc., we could let developers share a marketplace of:

- The tool plugin that would let designers swap their "sign-up / author edit page" over to the developer's UI library, and see that preview in the UX tool itself
- The output plugin that would generate scaffolding in React/Tailwind/etc.

The ADT for 90% of enterprise applications should be the same ADT. Why are we reinventing slightly different props across MUI or Tailwinds or Shadcn or ...? 

### Enterprise Apps

Hard-focus on enterprise apps. Apps that have 1 component library with 100s screens, or even better 100s of apps each with their own 100s of screens. But are still struggling with eng/UX handoff because designers are delivering "custom box" UIs.




