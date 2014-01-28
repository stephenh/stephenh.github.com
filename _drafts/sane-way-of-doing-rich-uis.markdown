---
layout: draft
title: A Sane Way to do Rich UIs
---

{{page.title}}
==============



At work, our main webapp is based on GWT, e.g. Java code. When I first started in GWT, I found the constant inner class boilerplate to be a nightmare. I pined for Scala, and spent a non-trivial amount of time on Scala GWT.

But yesterday, a colleague who would otherwise be writing apps in JavaScript made the comment that, writing in Java actually isn't that painful anymore.

I realized the same thing, and I think it hinges on how you approach the design: declaratively or imperatively.

With imperative programming, everything is reactionary. You have anonymous inner classes listening to events and manually shuffling data back and forth.

Which, yeah, closures reduce the boilerplate, but its still spaghetti code.

A more robust approach is setting up relationships declaratively, which has the upshot of also requiring much else inner class bloat and so and all around pleasant experience.


Rules of Thumb
--------------

* Rarely update the view directly, update models that are bound to the view.

  Rule of thumb: rarely update the view directly. If something changes in time, make it a model, and bind your view to it.
