---
title: Immutability Doesn't Matter with useSES
draft: true
---

This is a somewhat short, opaque post, but after diving into [Valtio](https://github.com/pmndrs/valtio) and React 18's new [useSES](https://react.dev/reference/react/useSyncExternalStore) a few months ago, I came to what I believe is a correct conclusion: that any React 3rd party state/store library (i.e. Mobx, Valtio, Zustand, Legend State, Redux, etc.) that use the new `useSES` hook to cross the "external store changed" -> "schedule render of downstream React components" divide, just does not need to bother with immutability.

Why? Because of `useSES`'s limited, "tick-less" API.

Stepping back, the main job of `useSES` is to prevent "torn renders" in React 18's async rendering, which is where:

1. Your page starts to render, with two Components A & B on it,
2. Component A reads `const { color } = store`, gets blue, and renders "blue" into the wip VDOM
3. React 18's async rendering yields to the browser, to avoid blocking the screen/UI
4. During this yield, a store state change sneaks in (an AJAX call completes), and the color is now "green"
5. Component B reads `const { color } = store`, gets green, and renders "green" into the wip VDOM
6. The async rendering finishes, and, in theory, all of the wip VDOM will be committed to the DOM

But, if this happened, our user would see a "torn" UI, b/c one part of the UI says "current color = blue", and another says "current color = green".

While implementing React 18's async rendering, this was recognized as sufficiently bad to be [written up](https://github.com/reactwg/react-18/discussions/69) and solutions explored to solve it, of which `useSES` is the result.

The way `useSES` prevents this is, at the very start of "Step 6" in the above flow, it asks every component that put content into the wip VDOM: "did your external store change since your last render?".

If any of them respond "yes", React throws away the entire torn VDOM (without flushing it to the DOM), starts over at Component A, and tries again, hoping that this time it will get a consistent/non-torn VDOM when it hits "Step 6" for the 2nd time. Let's assume that is true, and so now, after two renders, React flushes the 2nd, consistent VDOM into the DOM. 

Which is good! We've avoided tearing!

So, what's the big deal about immutability?

The issue is not that immutability of your external store is "wrong" per se, it just doesn't matter.

Why? Well, let's look at what we could do if immutability _did_ matter.

If immutability _did_ matter, `useSES` should have been able to tell all of our components that were rendered in the above flow to _stay on the same version of their external store's state_.

With this proposed capability of the `useSES` api, the flow _could_ have looked like:

1. Your page starts to render,
2. Component A reads `const { color } = store`, and _knows to use v1 of its store's state_
3. React yields to the browser
4. During this field, a new v2 of the store is created, the color is now green
5. Component B reads `const { color } = state`, and _knows to still use v1 of its store's state_
6. The async rendering is finished, and can be committed to the DOM

Note that, at step 6, our wip VDOM is technically _stale_, but not _torn_. This should make it okay to commit to the DOM as "the current (consistent) state of the world", while React then proceeds to do a new render for the v2 of the store's state.

If `useSES` offered this capability, of knowing "which snapshot/version of the store to render", then immutability of the store would matter, and be desirable--you could avoid tearing and wasted/aborted renders (which, tangentially, is exactly what React's internal `useState`-managed state can do, b/c they cheat and _do_ have internal access to "what version of the state should I be using to make this async render consistent?" And even leverage this do to state branching with `startTransition`, which `useSES` stores fundamentally cannot do either).

But, `useSES` doesn't do this--components or stores calling `useSES` are not told anything about "the current tick", "the current frame", or "the current version" being rendered.

Hence, back to my original assertion: it actually does not matter if your `useSES`-based store is immutable or not. If it is, that's fine, there is nothing wrong with that, but you don't actually have an edge over a mutable store.

Granted, my favorite store, Mobx, is a mutable store, so this conclusion happens to work out for me personally--I have no reason, at least in terms of tear avoidance / `useSES` semantics, to stop using Mobx.

But it does seem unfortunate that the Zustands and Valtios of the world, which tout immutability as one of their key features, aren't able to actually leverage that immutability into a meaningful advantage over other stores (at least in terms of async rendering or `useSES` semantics).

