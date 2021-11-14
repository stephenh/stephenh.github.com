---
date: "2010-11-23T00:00:00Z"
section: GWT
title: GWT Handler Registrations
---

{{page.title}}
==============

Being a fat-client technology, GWT involves a lot of event listeners. The idiom for using them is pretty simple:

```java
widget.addValueChangeHandler(
  new ValueChangeHandler<String>() {
    public void onValueChange(ValueChangeEvent<String> event) {
      // do logic here
    }
  }
);
```

One interesting question is what to do with the `HandlerRegistration` return value of the `addValueChangeHandler` method:

```java
HandlerRegistration r = widget.addValueChangeHandler(
  new ValueChangeHandler<String>() {
    public void onValueChange(ValueChangeEvent<String> event) {
      // do logic here
    }
  }
);
// when do you call this?
r.removeHandler();
```

Is Calling `removeHandler()` Required?
--------------------------------------

There are two relative points about calling `removeHandler()` on a `HandlerRegistration`:

1. `removeHandler` is never required to avoid DOM-/browser-level memory leaks.

   Per [UnderstandingMemoryLeaks](http://code.google.com/p/google-web-toolkit/wiki/UnderstandingMemoryLeaks) in the GWT docs, GWT's event system ensures that you'll never end up with circular references between your event handlers and unattached DOM elements.

   In either `Widget.onDetach` or page unload, GWT will clean up the DOM event listeners so that garbage collections can happen.

   So, it's tempting to think `removeHandler` is a quaint but unnecessary capability. However:

2. `removeHandler` is required to avoid application-level memory leaks.

   If you have a "global" event source, like an always-visible navigation bar widget or an application-wide `EventBus`, and you have a transient event listener, like a presenter listening for events, the presenter's event handler will keep it from being garbage collected until the `EventBus` is also garbage collected.

For example, if you have a `FooPlacePresenter` in a framework like [Tessell](http://www.tessell.org):

```java
public class FooPlacePresenter {
  public void onBind() {
    super.onBind();
    eventBus.addHandler(
      BlahEvent.getType(),
      new BlahEventHandler() { ... });
  }
}
```

Each time the user visits the `#foo` place, a new instance of `FooPlacePresenter` will get created and it will start listening for `BlahEvent`s on the application-wide `EventBus`.

When the user navigates away from `#foo`, the `FooPlacePresenter` instance should be garbage collected, so that the memory is freed up for the next place in your application the user visits.

However, because of `FooPlacePresenter`'s `BlahEventHandler` that did not get unregistered, the `EventBus` still thinks `FooPlacePresenter` is interested in `BlahEvent`s, and so the presenter instance will not be garbage collected.

After a while of in-application navigation, you could potentially have a lot of presenter instances kept in memory due to their handlers listening on the application-wide event bus.

What To Think About
-------------------

To avoid application-level memory leaks, when adding event handlers, you need to think about:

1. What is the scope of the event source (the widget or the `EventBus`)?
2. What is the scope of the event handler (the presenter)?

And then:

* If the scopes are the same: you can ignore the `HandlerRegistration` and trust that GWT/the garbage collection will clean things up for you.
* If the handler scope is longer-lived than the source scope: the handler would keep the source in memory, so you need to call `removeHandler()` when appropriate.
* If the source scope is longer-lived than the handler scope: the source would keep the handler in memory, so you also need to call `removeHandler()` when appropriate.

Be Proactive
------------

You should also take steps to pro-actively avoid application-level memory leaks.

The best way to do this is to avoid directly exposing application-scoped event sources to place-scoped presenters. If place-scoped code is unable to attach directly to applicate-scoped sources, it will be impossible for place handlers to stay in memory longer than they should.

For example, GWT 2.1 uses this in its `ActivityManager` implementation. Instead of handing the application-wide `EventBus` directly to an activity, it wraps the `EventBus` in a `ResettableEventBus`.

`ResettableEventBus` keeps tracks of any handlers the current activity registers, and then when that activity is done, the `ActivityManager` calls `ResettableEventBus` `removeHandlers()` to forcibly remove the old activity's handlers from the `EventBus`.

Now the activity doesn't have to worry about calling `removeHandler()` on either its widgets or the `EventBus`, so it's much less boilerplate and not as prone to programmer error. Both are big wins.

