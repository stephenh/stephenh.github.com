---
date: "2010-04-07T00:00:00Z"
categories:
  - GWT
title: GWT View Generation
---

This will be brief, but lately I've been on a crusade to reduce the boilerplate in GWT MVP projects.

My current target has been the trio of `FooView.ui.xml`, `FooPresenter.Display`, and `FooView`, all of which are intrinsically linked. You end up making changes in one (usually `FooView.ui.xml`) and then dutifully percolating those changes to the other two.

Or other three, as in my case I throw in a `StubFooView` for testing (I find, after two or three uses, mocks get old and stubs are more pragmatic).

So, I did a short spike for the last two mornings and am becoming convinced I can generate everything from the single `FooView.ui.xml` file.

The steps are basically:

* Scan `FooView.ui.xml` for `ui:field` declarations, record their type+name
* For each `ui:field`, come up with its `HasXxx` (or really `IsXxx`, see later)
* Create `IFooView` with a method `HasXxx` for each `ui:field`
* Create `FooView` with a `@UiField`-annotated field + method for each `ui:field`
* Create `StubFooView` with the stub version of each `ui:field`

I have this all basically working. It means for each presenter/view in your project, instead of 4+ hand-written files (presenter, `ui.xml`, interface, view, stub), you have just 2 (presenter, `ui.xml`).

For me, this would make GWT MVP drastically less painful.

`HasXxx` vs. `IsXxx`
--------------------

Mapping a `ui:field` to a single `HasXxx` interface is problematic because each widget has multiple `HasXxx` interfaces.  For example, `Anchor` has `HasClickHandlers`, `HasAllFocusHandlers`, `HasName`, `HasHTML`, etc.

If you put a `gwt:Anchor` in your `ui.xml`, which `HasXxx` should we expose to the presenter? What if the presenter needs more than one?

My answer is to introduce a new interface, `IsAnchor`, that extends all of these interfaces and, by returning just the one `IsAnchor` type, your presenter has access to all of its constituent `HasClickHandlers`/etc. methods.

To me this makes a lot of sense anyway, as I was always annoyed with having to return the same `Anchor` field multiple times in my view implementation, once for each `HasXxx` interface I needed for it.

The Problem
-----------

Turns out `Anchor` doesn't actually implement `IsAnchor`. Of course, given `IsAnchor` is our own interface.

So, we have several options:

* Composition: make a new class `GwtAnchor implements IsAnchor`, with a constructor `GwtAnchor(Anchor anchor)`, then you implement a whole bunch of delegate methods in `GwtAnchor` that just call `anchor.xxx`.
* Inheritance: make a new class `GwtAnchor extends Anchor implements IsAnchor` and your mostly done, though now your `ui.xml` file will have to have a `foo:GwtAnchor` declaration instead of the regular `gwt:Anchor`.
* Forking: Add `IsAnchor` to the GWT code base and just make the real `Anchor` implement `IsAnchor`. Done.

I started out with composition only because I've only done a few minor widgets. But it involves a whole lot of boilerplate. Inheritance is probably what I should try next. But forking is awfully tempting because it, for the most part, just makes the problem go away.

Of course, even with forking, I'll still have to implement a `StubIsAnchor` for testing. Hopefully that won't be too bad. It is definitely an up-front investment, but I'm convinced the stub will pay off over the long term vs. mocking.

My `ViewGenerator` spike is currently 200 lines. Pretty simple really, it will not get much larger. The hard part is surgically inserting the `IsXxx` interfaces into the multitude of GWT widgets. Which is not so much hard, but potentially very time consuming to get full coverage of all of the widget.


