---
date: "2023-09-08T00:00:00Z"
title: Immutability Doesn't Matter with useSES
categories:
  - React
---


This is a somewhat short, opaque post, but after diving into [Valtio](https://github.com/pmndrs/valtio) and React 18's new [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) a few months ago, I came to what I believe is a correct conclusion: that any React 3rd party state/store library (i.e. Mobx, Valtio, Zustand, Legend State, Redux, etc.) that use the new `useSES` hook to cross the "external store changed" -> "schedule render of downstream React components" divide, just does not need to bother with immutability.

Why? Because of `useSES`'s limited, "tick-less" API.

Stepping back, the main job of `useSES` is to prevent "torn renders" in React 18's async rendering, which is where:

1. Your page starts to render, with two Components A & B on it,
2. Component A reads `const { color } = store`, gets blue, and renders "blue" into the wip VDOM
3. React 18's async rendering yields to the browser, to avoid blocking the screen/UI
4. During this yield, a store state change sneaks in (an AJAX call completes), and the color is now "green"
5. Component B reads `const { color } = store`, gets green, and renders "green" into the wip VDOM
6. The async rendering finishes, and, in theory, all of the wip VDOM will be committed to the DOM

But, if this happened, our user would see a "torn" UI, b/c one part of the UI says "current color = blue", and another says "current color = green".

While implementing React 18's async rendering, this was recognized as sufficiently bad to be written up (see [What is tearing?](https://github.com/reactwg/react-18/discussions/69) and [Concurrent React for Library Maintainers](https://github.com/reactwg/react-18/discussions/70)), and solutions explored to solve it, of which `useSES` is the result.

The way `useSES` prevents tearing is, at the very start of "Step 6" in the above flow, it asks every component that put content into the WIP VDOM: "did your external store change since your last render?".

If any of them respond "yes", React throws away the entire torn VDOM (without flushing it to the DOM), starts over at Component A, and tries again. This is called a "de-opt" in the "Concurrent React for Library Maintainers" discussions [^1]), and the hope is that this time, on the 2nd render, when we get to "Step 6" for the 2nd time, and again ask "has there been any store change in _this_ render?", that hopefully everyone says "no" `:crossed_fingers:`, and so we now have a consistent/non-torn VDOM. Let's assume that is true, and so now, after two renders, React flushes the 2nd, consistent VDOM into the actual DOM. 

[^1]: Afaiu, the original prototype version of `useSES`, which was written as a regular user land hook, used the existing `useLayoutEffect` hook to trigger the "de-opt". I.e. by putting the dirty check inside of `useLayoutEffect`, and then calling a `setState` when dirty, you can manually trigger a de-opt, i.e. a re-render without committing the 1st render to the DOM, per my understanding of [this comment](https://github.com/facebook/react/issues/17334#issuecomment-553984285). Now that `useSES` is implemented internally within React, it does not use `useLayoutEffect` anymore, but, again AFAIU, the semantics are effectively the same.

Which is good! We've avoided tearing!

So, what's the big deal about immutability?

The issue is not that immutability of your external store is "wrong" per se, it just doesn't matter.

Why? Well, let's look at what we could do if immutability _did_ matter.

If immutability _did_ matter, `useSES` should have been able to tell all of our components that were rendered in the above flow to _stay on the same version of their external store's state_.

With this proposed capability of the `useSES` API, the flow _could_ have looked like:

1. Your page starts to render,
2. Component A reads `const { color } = store`, and _knows to use v1 of its store's state_
3. React yields to the browser
4. During this field, a new v2 of the store is created, the color is now green
5. Component B reads `const { color } = state`, and _knows to still use v1 of its store's state_
6. The async rendering is finished, and can be committed to the DOM

Note that, at step 6 in our new pretend/ideal world, our WIP VDOM is technically _stale_, but not _torn_. This should make it okay to commit to the DOM as "the current (consistent) state of the world", while React then proceeds to do a new render for the v2 of the store's state.

This is effectively the "Level 3. Make it fast" support mentioned in the previously-linked [Concurrent React for Library Maintainers](https://github.com/reactwg/react-18/discussions/70) reactwg discussion.

If `useSES` offered this capability, of knowing "which snapshot/version of the store to render", then immutability of the store would matter a lot, and be very desirable--you could fundamentally avoid tearing and have zero wasted "de-opted" renders [^2], which could make a big difference for performance (admittedly in probably/hopefully rare situations where there is a very high number of external state changes, such that interleaved async renders & external state changes happened frequently--which I think in practice would actually pretty rare).

[^2]: The notion of "de-opted" renders only comes up when discussing external stores, because React's internal `useState` primitives are able to avoid this problem. They do so by "cheating" and internally knowing "what version of the state should I be using to make this async render consistent?" Unfortunately, this capability is just fundamentally unavailable to external stores--which, imo, is what `useSES`, as a React primitive, should have fixed.

But, `useSES` doesn't do this--components or stores calling `useSES` are not told anything about "the current tick", "the current frame", or "the current version" being rendered.

Hence, back to my original assertion: it actually does not matter if your `useSES`-based store is immutable or not. If it is, that's fine, there is nothing wrong with that, but you don't actually have an edge over a mutable store.

Granted, my favorite store, Mobx, is a mutable store, so this conclusion happens to work out for me personally--I have no reason, at least in terms of tear avoidance / `useSES` semantics, to stop using Mobx.

But it does seem unfortunate that the [Zustand](https://zustand-demo.pmnd.rs/)s and Valtios of the world, which tout immutability as one of their key features, aren't able to actually leverage that immutability into a meaningful advantage over other stores (at least in terms of async rendering or `useSES` semantics [^3]). `:shrug:`

[^3]: ...my other suspicion, just in terms of "React 18 and external stores", is that this same lack of communication/visibility into "what version of state is this render for?", means that applications that use external stores will have a hard time levering the new `startTransition` API. Specifically that, if you've started a transition, but React tries to do a "responsive re-render of the pre-transition state", any data used by that responsive re-render that comes from a `useSES`-based external store will get the latest, global, `startTransition`-side-effected state, and not the pre-transition store state. Effectively creating another form of tearing, this is just a hunch based on my current mental models, and not something I've dug into.
