---
layout: default
title: CSS Quirk, Collapsing Margins
section: GWT
---

{{page.title}}
==============

I occasionally have to hunt down obscure (to me) browser/CSS behavior, and usually just end up leaving the lessons learned/temp files on my system somewhere, only to come back across them months later and not really remember what they were for anyway.

So, this is my attempt to clean up and publish some of them, for my own memory/organization if nothing else.

Anyway, collapsed margins--it seems like I really should have known this by now, but it turns out margins of child elements can effectively replace their parent element's margin.

Here's a simple example. Given this HTML:

```xml
<div class="parent">
  <div class="child"></div>
</div>
```

We just have a parent/child. Let's style them as nested boxes with this CSS:

```css
.parent {
  background: blue;
  width: 200px;
  height: 200px;
}
.child {
  background: red;
  width: 100px;
  height: 100px;
  margin: 50px;
}
```

We expect a 200x200 blue box with a 100x100 red box inside of it, with 50px of blue showing all around the red box.

However, it actually looks like:

<div class="parent">
  <div class="child">
  </div>
</div>

...note there is no blue on top--the child element is laying right at the top of it's parent, very contrary to what our `margin: 50px` was supposed to do. Wtf?

Welcome to collapsing margins--briefly, it two (vertical) margins touch, the bigger of the two wins, and gets percolated to the outer most element.

The unintuitive fix is to add `overflow: auto` to the parent:

```xml
<div class="parent" style="overflow: auto;">
  <div class="child">
  </div>
</div>
```

And now it works as expected:

<div class="parent" style="overflow: auto;">
  <div class="child">
  </div>
</div>

Rather than trying to explain this here, I'll refer you to:

* This [tutorial](http://www.howtocreate.co.uk/tutorials/css/margincollapsing), which I found to be the best explanation of margin collasping
* This [Stackoverflow](http://stackoverflow.com/questions/1878997/child-elements-with-margins-within-divs) question, which is how I originally discovered what was going on
* The [CSS2 spec](http://www.w3.org/TR/CSS2/box.html#collapsing-margins), if you're in to that sort of thing

So, that's it. I'm not entirely sure it's worth putting these together, given it's pretty light content compared to what I usually try and write, but eh, we'll see how it goes.

<style>
  .parent {
    background: blue;
    width: 200px;
    height: 200px;
  }
  .child {
    background: red;
    width: 100px;
    height: 100px;
    margin: 50px;
  }
</style>

