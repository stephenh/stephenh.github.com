---
layout: post
title: Sane AJAX Testing in Selenium
---

{{page.title}}
==============

Let's cut to the chase: testing AJAX applications can suck.

Selenium is great for Web 1.0 applications, which involve a page load after each significant user action. Selenium knows to block until the page is done loading, and so the page load provides an implicit "wait until crap is done" barrier to keep your test from getting ahead of the browser.

But that goes away in AJAX applications--no page load. There are a variety of ways to compensate, most of which are what I call pre-assertion waiting--before asserting "did X happen" poll for a little bit to ensure "X" is there. E.g.:

    ajaxSubmit.click();
    waitForErrorToShowUp();
    assertErrorIs(...);
{: class="brush:java"}

In my experience, pre-assertion waiting in tests is not ideal. They're verbose, often fickle, and at a higher risk of rotting when the application is refactored ("Is this wait really needed? Better leave it in, just in case.").

Instead, I think a good goal for functional UI tests is to **never have explicit wait lines** in your test methods. If you can pull this off, I think the resulting tests will be more readable, more reliable, and more resilient to change.

To accomplish this, I've been using two tricks that, in tandem, work really well:

1. Reintroduce the concept of "page loading"
2. Use post-action waiting instead of pre-assertion waiting

And also a heavy dose of [Page Objects](http://code.google.com/p/selenium/wiki/PageObjects) abstraction.

So, let's see what this looks like.

Reintroduce "page loading"
--------------------------

First: reintroduce page loading. Not real page loading, obviously. But what was Web 1.0 page loading useful for? Knowing when the browser is waiting on the server. AJAX calls are the same thing--talking to the server. We just need to make it explicit and visible to Selenium.

There are a variety of ways of doing this, but you basically need a choke point in your application where all AJAX requests go through. Then:

1. Before any AJAX request goes out, increment an `outstanding` variable
2. Put the value of `outstanding` into a hidden `div` tag
3. When the AJAX response comes back, decrement `outstanding` variable
4. Again put the value of `outstanding` into the hidden `div`

Now Selenium has the ability to see the application's "loading" state:

* If `outstanding.innerText == "0"`, all things are good, continue the test
* If `outstanding.innerText != "0"`, the application is waiting, block the test

I don't have any JavaScript code to show how this works, as I do all my client-side programming in GWT, so use a [gwt-dispatch](http://code.google.com/p/gwt-dispatch/)-style approach that broadcasts AJAX events on an `EventBus`, which then [OutstandingWatcher](https://github.com/stephenh/tessell/blob/master/user/src/main/java/org/tessell/util/OutstandingWatcher.java) listens for and maintains the `outstanding` div appropriately.

For JQuery/etc., something in [Extending AJAX](http://api.jquery.com/extending-ajax/) would probably work. It's probably 10-20 lines of code.

Anyway, once you have this in place, you've basically got page loads back--any time an AJAX request is in-flight, Selenium can know about it by watching if `outstanding != 0`. E.g. with Selenium's new `ExpectedConditions` API, it might look like:

    /** Waits until all async calls are complete. */
    public static ExpectedCondition<Boolean> outstanding() {
      return new ExpectedCondition<Boolean>() {
        public Boolean apply(final WebDriver from) {
          final String outstanding = from
            .findElement(By.id("outstanding"))
            .getText();
          return "0".equals(outstanding);
        }
      };
    }
{: class="brush:java"}

So, then you could use this in a test like:

    ajaxSubmit.click();
    WebDriverUtil.waitFor(outstanding());
    assertErrorIs(...);
{: class="brush:java"}

Post-Action Waiting
-------------------

Which brings us right to the second trick: the test is now doing **post-action** waiting. And not only is it post-action, but it's **generic waiting**. This has several nice benefits:

* It doesn't matter whatever the application was doing while the request was in-flight--spinning a wheel for the user, doing nothing at all, whatever--Selenium can always look for `outstanding != 0` and just work.

* It doesn't matter what the test is going to assert after this, so we don't need to worry about all of our tests' wait logic breaking if we change the application's behavior.

Basically, we're back to the convenience of Web 1.0 applications--we have an automatic, reliable way of keeping the browser and test in sync with each other.

Page Objects
------------

So, that's the core of the approach. I think this just by itself will work quite well and, in my opinion, better than pre-assertion/per-assertion waiting approaches.

However, I've also been going one step further and, with my [pageobjects](https://github.com/stephenh/pageobjects) implementation, centralizing the waiting declarations within the page objects themselves. So, I might have:

    // each page/fragment in the app has an XxxPage class
    class EmployeePage extends AbstractPageObject {
      // each element on the page has a field of XxxObject
      public TextBoxObect name = new TextBoxObect("employeeName");

      // fluently add `outstanding` to submit
      public ButtonObject submit = new ButtonObject("submit")
        .afterClickWaitFor(outstanding());

      // cstr, other fields...
    }
{: class="brush:java"}

The `afterClickWaitFor` means there is just *one place* in all of the functional tests that says "after this button is clicked, we will probably have to wait for the server".

So the test can now look even simpler, with no mention of waiting:

    employeePage.submit.click();
    assertErrorIs(...);
{: class="brush:java"}

And if you're extra spiffy, you might even encapsulate the error gathering logic into the `EmployeePage` as well, so then you're test is:

    employeePage.submit.click();
    assertThat(employeePage.getErrors(), contains("..."));
{: class="brush:java"}

To me, this is a pretty nice test to read. No explicit waiting, pretty high level (the ids/lookup logic are encapsulated in the page objects). It's probably not as flowing as a [GooS](http://www.growing-object-oriented-software.com/)-style functional tests, which are awesome, but personally I find this level of abstraction to be a sweet spot in the trade off between effort and benefit.

Disclaimer
----------

The one large disclaimer to this approach is that I haven't had to deal with a lot of animation--all of my waiting really is on the server, and then things in the UI are generally displayed right away (within the same event loop that services the AJAX response).

If you're doing anything with `setTimeout`, e.g. animation or progressive calculations, then you'll probably have to fall back to pre-assertion waiting. Although hopefully you could find a wait to encapsulate it into a page object, perhaps some sort of `beforeAssertionWaitFor` method (which doesn't exist yet).

Anyway, that disclaimer aside, I've found this approach to be very successful. My last few projects have had much more most robust Selenium tests than previous ones (that doesn't mean perfect; but definitely much better). Part of that is likely due to the kick ass job the Selenium developers are doing, but I think the outstanding + post-action waiting approach has a large part to do with it as well.

If you try it out, I hope you find it useful. Feel free to download [pageobjects](https://github.com/stephenh/pageobjects), play around, and drop me an email/Github message if you run in to anything.

