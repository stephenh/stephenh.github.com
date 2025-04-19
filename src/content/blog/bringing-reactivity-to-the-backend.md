---
title: Bringing Reactivity to the Backend
description: ""
date: 2023-02-13T00:00:00Z
tags: ["Architecture", "Joist"]
draft: true
---


## Goal

Teach the audience about a neat/novel concept of Joist, a node/TypeScript ORM.

Audience is assumed to be backend engineers, ideally familiar with Node/TypeScript, but really not that important.

## Reactivity for Backends?

Typically when programmers think of "reactivity", they think of the latest frontend frameworks, like React or Vue or Solid.

This makes sense because keeping the various bits of a UX up-to-date, as the user clicks a button, or types into a form, can be surprisingly difficult if left to "non-reactive" imperative code.

However, backend programmers often have just as much angst with reactivity as frontend programmers, but we either don't realize it and resort to "non-reactive" imperative code (...or call it "cache invalidation").

React fixed "don't forget to update the DOM", but it didn't fix "don't forge to re-drive state".

Joist is a TypeScript ORM that, in a small way, brings reactivity to the backend.

## Background on Frontend Reactivity

...is this useful?

## Joist's Two Types of Reactivity

### Reactive Validation Rules

### Reactive Persisted Fields

### Reactive Calculated Fields

maybe?


## Disclaimers

- Use a monolith
- Yes this is cache invalidation
