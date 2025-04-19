---
title: Collecting User Actions with GWT
description: ""
date: 2010-08-13T00:00:00Z
tags: ["GWT"]
---


Collecting User Actions with GWT
================================

(Cross-posted from the Bizo [dev blog](http://dev.bizo.com/2010/08/collecting-user-actions-with-gwt.html).)

While I was at one of the [Google I/O](http://code.google.com/events/io/2010/) GWT sessions (courtesy of [Bizo][1]), a Google presenter mentioned how one of their internal GWT applications tracks user actions.

The idea is really just a souped-up, AJAX version of server-side access logs: capturing, buffering, and sending fine-grained user actions up to the server for later analysis.

The Google team was using this data to make A/B-testing-style decisions about features--which ones were being used, *not* being used, tripping users up, etc.

I thought the idea was pretty nifty, so I flushed out an initial implementation in [BizAds][bizads] for [Bizo's][1] recent hack day. And now I am documenting my wild success for [Bizo's][1] first post-hack-day "beer & blogs" day.

No Access Logs
--------------

Traditional, page-based web sites typically use access logs for site analytics. For example, the user was on `a.html`, then `b.html`. Services like [Google Analytics](http://www.google.com/analytics) can then slice and dice your logs to tell you interesting things.

However, desktop-style one-page webapps don't generate these access logs--the user is always on the first page--so they must rely on something else.

This is pretty normal for AJAX apps, and Google Analytics already supports it via its asynchronous API.

We had already been doing this from GWT with code like:

```java
public native void trackInGA(final String pageName) /*-{
  $wnd._gaq.push(['_trackPageview', pageName]);
}-*/;
```

And since we're using a MVP/places-style architecture (see [Tessell](http://www.tessell.org)), we just call this on each place change. Done.

Google Analytics is back in action, not a big deal.

Beyond Access Logs
------------------

What was novel, to me, about this internal Google application's approach was how the tracked user actions were much more fine-grained than just "page" level.

For example, which buttons the user hovers over. Which ones they click (even if it doesn't lead to a page load). What client-side validation messages are tripping them up. Any number of small "intra-page" things that are nonetheless useful to know.

Obviously there are a few challenges, mostly around not wanting to detract from the user experience:

* How much data is too much?

  Tracking the mouse over of every element would be excessive. But the mouse over of key elements? Should be okay.

* How often to send the data?

  If you wait too long while buffering user actions before uploading them to the server, the user may leave the page and you'll lose them. (Unless you use a page unload hook, and the browser hasn't crashed.)

  If you send data too often, the user might get annoyed.

The key to doing this right is having metrics in place to know whether you're prohibitively affecting the user experience.

The internal Google team had these metrics for their application, and that allowed them to start out batch uploading actions every 30 seconds, then every 20 seconds, and finally every 3 seconds. Each time they could tell the users' experience was not adversely affected.

Unfortunately, I don't know what exactly this metric was (I should have asked), but I imagine it's fairly application-specific--think of GMail and average emails read/minute or something like that.

Implementation
--------------

I was able to implement this concept rather easily, mostly by reusing existing infrastructure our GWT application already had.

When interesting actions occur, I have the presenters fire a generic `UserActionEvent`, which is generated using [tessell-apt](http://github.com/stephenh/tessell/apt) from this spec:

```java
@GenEvent
public class UserActionEventSpec {
  @Param(1)
  String name;
  @Param(2)
  String value;
  @Param(3)
  boolean flushNow;
}
```

Initiating the tracking an action is now just as simple as firing an event:

```java
UserActionEvent.fire(
   eventBus,
   "someAction",
   "someValue",
   false);
```

I have a separate, decoupled `UserActionUploader`, which is listening for these events and buffers them into a client-side list of `UserAction` DTOs:

```java
private class OnUserAction implements UserActionHandler {
  public void onUserAction(final UserActionEvent event) {
    UserAction action = new UserAction();
    action.user = defaultString(getEmailAddress(), "unknown");
    action.name = event.getName();
    action.value = event.getValue();
    actions.add(action);
    if (event.getFlushNow()) {
      flush();
    }
  }
}
```

`UserActionUploader` sets a timer that every 3 seconds calls `flush`:

```java
private void flush() {
  if (actions.size() == 0) {
    return;
  }
  ArrayList<UserAction> copy =
    new ArrayList<UserAction>(actions);
  actions.clear();
  async.execute(
    new SaveUserActionAction(copy),
    new OnSaveUserActionResult());
}
```

The `flush` method uses [gwt-dispatch](http://code.google.com/p/gwt-dispatch/)-style action/result classes, also generated by [tessell-apt](http://github.com/stephenh/tessell/apt), to the server via GWT-RPC:

```java
@GenDispatch
public class SaveUserActionSpec {
  @In(1)
  ArrayList<UserAction> actions;
}
```

This results in `SaveUserActionAction` (okay, bad name) and `SaveUserActionResult` DTOs getting generated, with nice constructors, getters, setters, etc.

On the server-side, I was able to reuse an excellent `DatalogManager` class from one of my [Bizo][1] colleagues (unfortunately not open source (yet?)) that buffers the actions data on the server's hard disk and then periodically uploads the files to Amazon's S3.

Once the data is in S3, it's pretty routine to setup a Hive job to read it, do any fancy reporting (grouping/etc.), and drop it into a CSV file. For now I'm just listing raw actions:

```sql
-- Pick up the DatalogManager files in S3
drop table dlm_actions;
create external table dlm_actions (
    d map<string, string>
)
partitioned by (dt string comment 'yyyyddmmhh')
row format delimited
fields terminated by '\n' collection items terminated by '\001' map keys terminated by '\002'
location 's3://<actions-dlm-bucket>/<folder>/'
;

alter table dlm_actions recover partitions;

-- Make a csv destination also in S3
create external table csv_actions (
    user string,
    action string,
    value string
)
row format delimited fields terminated by ','
location 's3://<actions-report-bucket/${START}-${END}/parts'
;

-- Move the data over (nothing intelligent yet)
insert overwrite table csv_actions
select dlm.d["USER"], dlm.d["ACTION"], dlm.d["VALUE"]
from dlm_actions dlm
where
    dlm.dt >= '${START}00' and dlm.dt < '${END}00'
;
```

Then we use Hudson as a cron-with-a-GUI to run this Hive script as an Amazon Elastic Map Reduce job once per day.

Testing
-------

Thanks to the awesomeness of [Tessell](http://www.tessell.org), the usual GWT widgets, GWT-RPC, etc., can be doubled-out and testing with pure-Java unit tests.

For example, a method from `UserActionUploaderTest`:

```java
UserActionUploader uploader = new UserActionUploader(registry);
StubTimer timer = (StubTimer) uploader.getTimer();

@Test
public void uploadIsBuffered() {
  eventBus.fireEvent(new UserActionEvent("someaction", "value1", false));
  eventBus.fireEvent(new UserActionEvent("someaction", "value2", false));
  assertThat(async.getOutstanding().size(), is(0)); // buffered

  timer.run();
  final SaveUserActionAction a1 = async.getAction(SaveUserActionAction.class);
  assertThat(a1.getActions().size(), is(2));
  assertAction(a1, 0, "anonymous", "someaction", "value1");
  assertAction(a1, 1, "anonymous", "someaction", "value2");
}
```

The usual GWT timers are stubbed out by a `StubTimer`, which we can manually tick via `timer.run()` to deterministically test timer-delayed business logic.

That's It
---------

I can't say we have made any feature-altering decisions for [BizAds][bizads] based on the data gathered from this approach yet--technically its not live yet. But it's so amazing that surely we will. Ask me about it sometime in the future.

[1]: http://www.bizo.com
[bizads]: http://bizads.bizo.com


