---
layout: draft
title: Sane Rich User Interfaces
---

{{page.title}}
==============

I've been meaning to write a "lessons learned" or "best practice" sort of post on how I think rich UI applications can be made simpler and less buggy by changing your mindset from an imperative one to a declarative one.

But, until I do that, I thought it might be better to start with a concrete example. Sometimes its easier to wrap your head around something small and concrete before abstracting the into the theoretical.

So, do that, I thought I'd show an example refactoring of changing some UI code from an imperative approach to a declarative approach.

The Example Problem
===================

We'll use a relatively small problem that I think is still a good illustration: managing a list of tabs.

E.g. the tabs might be "Tab A", "Tab B", and "Tab C", and clicking on each tab hides the previous tab's content and shows the new tab's content.

Instead of just building this functionality into a larger page, we'll break it out into a separate component, `Tabs`.

The Imperative Approach
=======================

Jumping straight to the code, this is a slightly simplified version of an imperative approach to building the tabs:

    public class Tabs extends CompositeIsWidget {

      private IsTabsView view = newTabsView();
      private ArrayList<IsWidget> panels = new ArrayList<IsWidget>();

      public Tabs() {
        setWidget(view);
      }

      public void addTab(String tabName, IsWidget panel) {
        IsTabView itemView = newTabView();
        panels.add(panel);
        if (panels.size() == 1) {
          itemView.listItem().addStyleName("active");
          show(panel);
        } else {
          hide(panel);
        }
        itemView.anchor().setText(tabName);
        itemView.anchor().addClickHandler(new ClickHandler() {
          public void onClick(ClickEvent event) {
            for (IsWidget p : panels) {
              hide(p);
            }
            for (int i = 0; i < view.list().getWidgetCount(); i++) {
              view.list().getIsWidget(i).removeStyleName("active");
            }
            show(panel);
            itemView.listItem().addStyleName("active");
          }
        });
        view.list().add(itemView);
      }
    }
{: class=brush:java}

This code might be a little foreign if you're not used to GWT/Tessell development, but I think in general it's pretty easy to follow.

The `newXxxView` calls are instantiating templates from GWT's `ui.xml` UiBinder files, so `newTabsView()` returns a styled `ul` tag, and `newTabView()` returns a styled `li` tag for each tab.

In general, I don't think there is anything terribly wrong with this code; the variable names are good, the methods aren't egregiously long, and it's bug free.

However, it is very imperative, in that it's reactive to user behavior instead of being proactive. For example, what makes it seem imperative is code like:
 
* Whether a panel is hidden or shown is done reactively in 4 places (show+hide on initial add, show+hide on each click).
* The `active` CSS class is added in two places, and removed in one place.
* We have an anonymous inner class that does multiple things in response to a click

The result is actually not that bad in this case, but I think the approach, when used in larger components and applications, eventually leads to spaghetti code.

You end up with lots of "oh, remember to do this here and there and there" lines in each place that responds to user input or logic changes. It becomes easy to miss places where updates need to happen, or not make the updates consistent, and results in bugs.

The Declarative Approach
========================

So, now let's try and refactor this code to being more declarative.

In taking on a declarative mindset, we want to think, without reacting to user input, how can we declare that some behavior of our UI should just happen?

For example, let's think of the behaviors of our tabs:

* When I am the current tab, show my panel
* When I am the current tab, set `active` on my `li` tag
* When I am clicked, make myself the current tab

Looking at these behaviors, the notion of a "current tab" is pretty apparent. Really all of our behaviors are based around which tab is the current tab.

So, let's pull out that notion into an abstraction; let's make a `Tab` and a `currentTab`:

    public class Tabs extends CompositeIsWidget {

      private IsTabsView view = newTabsView();
      private Tab currentTab;

      public void addTab(String tabName, IsWidget panel) {
        Tab tab = new Tab(tabName, panel);
        if (currentTab == null) {
          setCurrentTab(tab);
        }
        view.list().add(tab.view);
      }

      private void setCurrentTab(Tab tab) {
        if (currentTab != null) {
          // unstyle old active tab;
        }
        // style new tab
        currentTab = tab;
      }

      private class Tab {
        private IsTabView view = newTabView();
        private Tab(String tabName, IsWidget panel) {
          view.addClickHandler(new ClickHandler() {
            public void onClick(ClickEvent e) {
              setCurrentTab(Tab.this);
            }
          });
        }
      }
{: class=brush:java}

This is better. We've moved the styling updates into one place, `setCurrentTab`, so things are not as spread out.

However, we're still stuck in the reactive model; we're having to remember to call `setCurrentTab` in all the right places. (Which, granted, in this small example is only two places).

The stumbling block is that `currentTab` is just a field--we can't react to its changes unless we manually add code before/after our own setting of the field.

Rich UI frameworks, Tessell included, solve this by promoting simple fields into stateful properties, which can watch their current value, and call observers when it is changed. The property is the foundation for models in traditional MVC.

So, let's change `currentTab` to a property:

    private BasicProperty<Tab> currentTab =
      basicProperty("currentTab");
{: class=brush:java}

Since we have an abstraction around the value instead of just the value, we can now setup declarations around the abstraction, the property, and not just the value itself.

To see how well this works out, we can re-examine our 3 behaviors, and see how they can be translated into declarations. (We'll use Tessell's DSL, but the same abstractions could be done in any MVC framework.)

* "When I am the current tab, show my panel" can look like:

      binder.when(currentTab).is(this).show(panel);
  {: class=brush:java}

* "When I am the current tab, set `active` on my `li` tag" can look like:

      binder.when(currentTab).is(this).set(active).on(view.li());
  {: class=brush:java}

* "When I am clicked, make myself the current tab" can look like:

      binder.onClick(view.anchor()).set(currentTab).to(this);
  {: class=brush:java}

And that's it.

With a property-based DSL, like in Tessell, we have a 1-to-1 mapping between a behavior and 1 line of code.

This behavior should then "just work" as the program runs. Whether in response to user input, or other business logic code changing the model, we don't care; our behavior should implicitly stay correctly applied.

The Final Code
==============

So, here's the full refactored code example:

    public class Tabs extends CompositeIsWidget {

      private IsTabsView view = newTabsView();
      private Binder binder = new Binder();
      private BasicProperty<Tab> currentTab = basicProperty("currentTab");

      public Tabs() {
        setWidget(view);
      }

      public void addTab(String tabName, IsWidget panel) {
        Tab tab = new Tab(tabName, panel);
        currentTab.setIfNull(tab);
        view.list().add(tab.view);
      }

      private class Tab {
        private IsTabView view = newTabView();

        private Tab(String tabName, IsWidget panel) {
          view.anchor().setText(tabName);
          binder.when(currentTab).is(this).show(panel);
          binder.when(currentTab).is(this).set("active").on(view.listItem());
          binder.onClick(view.anchor()).set(currentTab).to(this);
        }
      }
    }
{: class=brush:java}

When This Works
===============

Obviously the success of this approach depends on the robustness of the binding DSL, as the DSL has to support the various behaviors you want to perform in a generic way.

Specifically for Tessell, I won't assert that Tessell's DSL is as refined as something like Hamcrest, which I think is the prototypical DSL in the Java world. But it supports a pretty wide array of behaviors, and is getting more when they are added as needed.

Besides the DSL, you also have to represent your problem domain as these stateful properties, basically models, to allow them to be passed declaratively into the DSL and for the DSL to be able to register observers and react to them.

I don't think either of these are large stumbling blocks, but they do require massaging your codebase to fit the MVC/property/DSL approach, instead of just using raw DTOs.

Rules of Thumb
==============

I have a few rules of thumb for thinking declaratively:

* If you find yourself both *doing* a behavior and later *undoing* that behavior (like applying then unapplying a style), this is a smell there there's some higher level abstraction that you could setup declaratively instead of performing it imperatively in multiple places.

* Manual event listeners (e.g. anonymous inner classes for `addClickListener` in GWT, or anonymous functions for `element.onclick` in JavaScript) should be used sparingly, and, if really needed, be as tiny as possible.

  Anonymous inner classes (or callback functions in JavaScript) are a smell that you're doing something reactively, e.g. responding to specific UI input and events, that you'll probably have to react to elsewhere in a different way, and so there might be an abstraction you could pull out.

  (Tangentially, I think this minimizes the downside of using the Java language, which lacks closures, for rich UI development. Even if you had closures for reacting to user input, it's still a reactive model, and so will lead to the same spaghetti code, albeit with less anonymous inner class boilerplate.)

* Try and think "1 behavior == 1 line of code", and then extend your DSL as necessary to fit that.

  Even if your behavior is not terribly generic, I think having it in your DSL and out of your controller/presenter code is a better separation of concerns anyway.

Conclusion
==========

So, those are my thoughts on building a rich UI in a sane way.

I don't think this is terribly novel, as MVC is old-hat 1980s/90s stuff, albeit reinvented in Web 2.0 apps, and I think everyone generally acknowledges that declarative programming can be, for the right problems, much more succinct than imperative programming.

But I think, even if its not novel, its easy for developers to stay in an imperative mindset if you're not consciously thinking of looking for abstractions and pulling out declarations as they become apparent.

