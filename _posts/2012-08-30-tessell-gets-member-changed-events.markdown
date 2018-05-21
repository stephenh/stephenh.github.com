---
title: Tessell Gets Member Changed Events
layout: post
section: GWT
---

{{page.title}}
==============

Tessell got a feature I'd been meaning to add for awhile: member changed events.

Tessell has always had property changed events, e.g. `StringProperty` gets a new value, so it fires a change event, which, via data-binding, auto-updates the view:

```java
binder.bind(someStringProperty).to(view.someNameField);
```

Which has handled a surprising number of use cases over Tessell's lifetime.

But the other hip JavaScript MVC frameworks usually have this notion of "member changed" (my made-up term), where if you have a model:

```java
class EmployeeModel {
  StringProperty name;
  StringProperty city;
}
```

You can, besides listening to `name`/`city` change events, listen to change events on the model, and get notified when any of the properties of the model changes.

This also typically works recursively up a model tree, e.g. if you add a parent/child model:

```java
class EmployeeModel {
  StringProperty name;
  List<AddressModel> addresses;
}

class AddressModel {
  StringProperty city;
}
```

Then any change of an address's `city` property will not only fire the event on `AddressModel`, but also on the parent `EmployeeModel`.

Well, after thinking Tessell should have that for awhile, I finally got around to it:

[Add MemberChangedEvent to percolate changes up the model tree.](https://github.com/stephenh/tessell/commit/47b0c12fe864a7ba1848fece486a13d8d01242f5)

Coincidentally, I had a chance to use this today, with some data-binding:

```java
binder.onMemberChange(employeeModel).execute(saveCommand);
```

So that any time any property on the `EmployeeModel` changes, we send it to the server (yes, doing this manually is terribly unhip, compared to transparent persistence frameworks like Meteor).

...in retrospect, `ModelChangedEvent` probably would have been a better name. Although `ListProperty` also fires these "something I own changed" events, so that is probably why I shied away from "model".

I had also thought of reusing `PropertyChangedEvent`, instead of creating a new event type. This seems to be what some of the other frameworks do, e.g. Backbone, which just have `change`, which is used to denote either a property itself changing or the model implicitly changing. Perhaps this would have been better, but for now I thought the semantic distinction seemed worth making it a separate event type.

