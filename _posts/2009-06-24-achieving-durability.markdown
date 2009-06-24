---
layout: default
title: Achieving Durability
---

Achieving Durability
====================

Intro
-----

At one of my last gigs, nightly batch processes were a way of life. Yeah, batch processes aren't sexy, but when you need thousands of checks to get mailed out every morning, you don't generate the PDFs from within the user's rich client Air application.

One aspect I felt strong about while building these processes was ensuring durability--if something happened, which it would, things should just work. Power/network/whatever went out? Just restart the process. Third party sent in data that we've never seen before? The process continues and just tries the funky data again tomorrow.

Previously, these types of events would cause mini-catastrophes that required immediate attention from a developer. Developers would have to hand-edit the file to only retry the "bad" transactions, figure out where a process died and jury rig it to start from there, and just generally do a lot of manual leg-work and hand-holding for the system.

Instead of constantly fighting fires, the goal should be for the system to expect failures, handle them gracefully, and continue on to the next task, either immediately if the error was recoverable or, at worst, after a system restart.

Of course, it is unlikely you'll have the time/desire to make the entire system fault tolerant to the Nth degree, but some basics will still take you a long way, in my experience.

Atomicity
---------

One fundamental concept to durability is atomicity--if you want to continue where you left off before, you can't redo previous work.

If your tasks are idempotent, you're in luck. Being idempotent means you can "retry" a task as many times as you want, and the task is smart enough to not cause funky behavior (like double-/triple-processing). For example, it's a debit card transaction with a unique transaction id that, if you find the id already in your system, you know not to enter it again. If your tasks are idempotent, you can just retry everything and what was already done will not cause duplicates.

However, if your tasks are not idempotent, you'll have to explicitly mark tasks as pending and then done.

Marking stuff "done" is pretty easy with in-memory lists/etc.--but its not atomic. Your process can't be:

1. Make an ArrayList of tasks
2. Do task A
3. Remove task A from the list
4. Repeat until list is empty

There are two bad scenarios here:

1. Failure happens between 2 and 3--you've done a task but not yet marked it done
2. Failure happens after N tasks--on restart, the ArrayList will have those first N items in it again

The key to scenario 1) is atomicity--you can't have a two step "do A", "mark A done", because if the box goes down in between those two, you're going to redo "A" when you come back up.

The key to scenario 2) is to make your lookup of tasks take into account those that are already done.

Embrace ACID
------------

The easiest way I've found to achieve durability is to realize you have an awesomely-durable resource at your disposal and you should leverage/abuse it as much as possible: your relational database server.

The fundamental hack is to perform the business logic of the task *and* mark the task as done within the same transaction.

This means embedding in-progress data into your primary database instead of the JVM process (see the examples for details). A con is that if your database is already your bottleneck, even this small extra load may not be welcome. However, in the enterprise apps I've worked on, this has not been the case. Also, a pro is that the in-progress data will be easily available for dashboards to report against.

So now scenario 1) is solved. Your database does all of the hard work ensuring that both task + marking either happen or not happen.

Solving scenario 2) is fairly problem specific, so I'll defer to the examples, particularly the `DocumentCursor.line` attribute.

Examples
--------

Two examples of hacking durability into a system are:

* Sending emails
* Processing 3rd party data files.

Both can run into problems that you want to have handled nicely.

Sending Email
-------------

The first time I wrote email processing for the client's app, it felt dirty--here within a nice Unit Of Work, doing some business logic was an ugly `Transport.send` dropping an email onto the wire. Who knew what that would do if it failed. For example:

* The email goes out because the `Transport.send` succeeds, but the transaction fails to commit--we've told the user about some action we thought we performed but didn't actually get committed
* The `Transport.send` fails because our mail server is being dumb, but then the entire Unit Of Work fails and we don't get any work done for the day until the mail server is back up

There ended up being an obvious solution--a partner firm was storing their generated email in the database for CRM purposes (knowing what you've sent users), but I realized this was also the perfect way to solve the `Transport.send` problem--decouple generation of the email content within the business process from the actual sending of the email content out onto the network.

So, now:

* A business process has 1 Unit Of Work that: does business logic and saves a `Email` object to the database--both either succeed or fail atomically.
* An infrastructure process polls the email table and, after seeing newly-committed emails, drops them onto the wire. If errors occur, it tries again after 5 minutes. If it succeeds, it updates the row's "sent" column.

Now email server funkiness will not disrupt the business process from its core work of performing business logic and generating emails. And business process funkiness will not result in "leaked" emails.

Note that we still have a window of opportunity for failure in the infrastructure process--again between the `Transport.send` and the `UoW.commit`, but it's much smaller window given we're only updating the `sent` column and not performing the complex business logic that lead to the creation of the email (and could have triggered non-trivial validation rules that would have to all pass before committing). This is where, if you wanted to go to the Nth degree, you'd implement some sort of API with your mail server to see if the current message id had already been sent.

Processing Data Files
---------------------

Processing nightly batch files from the client's debit card provider was another big win for durability. The provider had a history of sending new and interesting transactions on a semi-regular basis. Not enough to be really annoying, but enough to burn a day screwing around with recovery every few months or so.

The original approach would retry entire files, and attempt to leverage an almost-idempotent transaction id. However, as I recall, the debit card provider was extra special so there were several heuristics to determine "is this really the same transaction". I'm fuzzy here though.

So, when we were changing how the system handled files anyway, I refactored the process to be durable:

* Upon finding a file, a `Document` is saved to the database, and then a `DocumentCursor` with `cursor.line=0` is stored as well.
* An atomic parser then finds all open cursors in the database, and starts reading over their documents. It skips to line `x` if `line != 0`, so if a file is 80% done, it jumps right to the last 20%.
* Each line is processed in its own transaction--if the business logic succeeds, the cursor's `line` is ticked within the same transaction.
* If a line's transaction fails due to faulty parsing/business rules, the `DocumentCursor` is given a new `FailedLine` child row that stores that line's number. This will cause the cursor to stay open, and the `FailedLine` will be retried on the next process run. The idea is to keep retrying until it succeeds, e.g. by pushing out a fix it is critical.

This code was reusable and later used to handle other incoming files with non-idempotent lines, so the durability was key there as well.

Keep Things Simple: One Datasource
----------------------------------

The thing that made all of this doable was keeping business data and temporary in-progress data in the same database.

At first, I hesitated to do this, and was initially considering jury rigging some sort of two-phase commit with the primary database and a separate embedded/temporary database for the in-progress data. But, frankly, it's so much simpler to avoid JTA and just use 1 transaction that, empirically, the one-datasource approach has won me over.

Having big wins like this with a single ACID data source makes me awfully curious about how people handle similar scenarios with DHTs. I love the sexiness of scaling to Amazon-size as much as the next guy, but doing recovery scenarios in application code on top of a DHT seems painful. Intra-source resolution (e.g. "merge carts") makes sense, but it is inter-source resolution that I haven't puzzled through yet.

I'm still a big fan of starting with a RDBMS for your first few versions and only switching to DHTs when it becomes painfully obvious you need it. Yes, this is going to involve a massive refactoring of your code to deal with the completely different semantics of a DHT, but I think that is worth the simpler development you'll get up-front. And, who knows, you may never need the DHT.

Testing For Failures
--------------------

I don't trust myself to get failure scenarios correct the first time, so I also developed a way to test at least the known points of failure.

My solution was a class, `TestBreaker`, that was put into the production code to cause failures on demand, but only when in the testing environment, and only when enabled by a unit test.

So, the `CursorProcessor` had several of these `TestBreakers` declared as constants:

<pre name="code" class="java">
    public static final TestBreaker BREAK_AFTER_CURSOR = new TestBreaker();
    public static final TestBreaker BREAK_INSIDE_LINE_RETRY = new TestBreaker();
    public static final TestBreaker BREAK_AFTER_LINE_ATTEMPT = new TestBreaker();
    public static final TestBreaker BREAK_INSIDE_LINE_ATTEMPT = new TestBreaker();
</pre>

Then at vulnerable points in the code path, we'd put an explicit call:

<pre name="code" class="java">
    // some important code that could break
    CursorProcessor.BREAK_AFTER_CURSOR.ifSetFor(cursorId);
</pre>

In production, this is a no-op. But in test, it will throw an exception if we're on a certain cursor. This allows us to test the scenario of one cursor completely blowing up, but verifying that the process continues on to the next cursor.

A JUnit test can then explicitly trigger the breakage:

<pre name="code" class="java">
    public void testOneCursorFailingOutsideLineContinuesOnToTheNext() {
        // data setup
        CursorProcessor.BREAK_AFTER_CURSOR.setFor(2);
        // run process
        // assertions
    }
</pre>

Showing my bias, I also love that `BREAK_AFTER_CURSOR` is a static constant, because just I did a `Ctrl-Shift-G` on the constant in Eclipse and immediately saw which 1 test out of thousands was referencing it to trigger than failure condition. I'm not an IoC expert, but I anticipate you would lose this capability with dependency injection.

Conclusion
----------

I've shown several examples of leveraging your RDBMS to achieve business process durability. The approach has worked very well for me and I anticipate using it again in the future.

I'm also interested in other approaches, e.g. when you can't leverage a single data source, but I have not spent as much time researching this. If you have pointers to different ways of solving this sort of problem, I'd appreciate links in the comments.

