---
layout: draft
title: Go Ahead, Use Your Database as a Queue
---

{{page.title}}
==============

Recently I've come across a few opinions that assert using this is a test of how the wrapping is going to work your database as a queue is an anti-pattern. E.g. posts like [this][1] from just a few days ago.  

However, I feel that "anti-pattern" is a mislabeling of the approach, because the term insinuates that it is always a bad idea and should be avoided or else you risk disaster when things inevitably go wrong.

This doesn't match my experience. I've used a database as a queue on several projects now, and, so far, have not been burned by the approach.  Quite the opposite, I think it provides several nice properties that can make it a good choice *for the right situation*, of course.  

To evaluate whether it's a good choice for your project or not, I think there a few things to think about: scale, response time, atomicity, idempotence, availability, and implementation.

Scale
-----

First, the scale disclaimer; yes, if you're Twitter, or the next hot social whatever, you can't use this approach. The database-as-a-queue (DaaQ) will fall all over itself if you have a lot of contention. However, what is "a lot"?  

First, note that I think in most situations, you can apply KISS and realize that you'll very likely only ever need one worker. I think this is a sweet spot for DaaQ and makes things a lot simpler.

That being said, I'm confident DaaQ could scale to multiple workers, but it will take some more effort. The key is to have as little state in the workers as possible, and just keep leveraging the database as the authoritative state.

I'm admittedly making this up, but I think if you can estimate having less than 10-20 workers polling your DaaQ, that you should be fine. It seems unlikely that a database should get upset about 10 connections contending over some rows. Honestly, I've never had to use more than 1 worker--if anyone has experience with more, I'd be interested in hearing how it went.

(Note that, ideally you can avoid it, especially if rolling your own worker polling, but packages like [queue classic][2] can likely handle this or even more workers as it has a fancy notification/backoff algorithm.)

But, yeah, if you venture out of this, and will have tens+ of polling machines contending on the DaaQ, a traditional queue is a better choice.

Response Time
-------------

In my experience, DaaQ usually involves polling on the part of workers.  The polling lag may be anywhere from seconds to minutes, but it is nonetheless noticeable.

If you're like Amazon and need to have the order confirmation email in my Inbox I swear before I've even clicked "Confirm Order", then using a traditional queue is a good choice.

(However, I say that, but the previously mentioned [queue classic][2] uses a PostgresSQL-specific feature to do wake ups of sleeping workers and supposedly achieve pretty quick pick up times. Cool stuff!)

Atomicity
---------

Okay, the last few points have been about why *not* to choose DaaQ--this one is the biggest reason why you *should* choose DaaQ if you at all possibly can: atomicity within your primary database for free.

DaaQ typically means your queue lives inside your main database. Which means you can update both your business objects and any ensuing queueing of work within 1 transaction.

So if either one or the other fails (invalid data or what not), both the data + enqueue operation rollback atomically and you have one less boundary condition to think about.

Idempotence
-----------

Of course, while you get "atomicity for free" within your primary database, whenever you talk about a queue (DaaQ or traditional), idempotence is always going to be a part of the discussion.

In a failure scenario, your work items may potentially be executed multiple times. That is just the nature of queueing (unless you subject yourself to two-phase commit throughout your entire architecture, but I think ensuring idempotence is by far the lesser evil).

So, again, this really isn't DaaQ-specific, but risk of re-doing work is just a natural consequence of queues enabling work recovery. In general, I find the benefit of work recovery (retrying an email send when the server is done) to outweigh the con of work duplication (sending the email twice because the queue update failed after the message had been put on the wire).

Availability
------------

When I want to enqueue work, I want the strongest guarantee that the queue will be available. For me, that is usually the point of a queue--the work might fail (typically due to network-based/3rd-party services), so I'd rather perform the work outside the request thread, in a manner that can be recovered when services are inevitably unavailable.

So, I want enqueues to just work, which means the queue should *always* be available. If it's not, I'm back at square one, somehow having to ensure enqueues aren't dropped when the queue is unavailable. This means somehow persistently writing to local disk, having enqueues recovered on machine failure, etc., and a lot of extra work.

(Admittedly, an alternative if your external queue is unavailable is to fail the entire request, especially any database commits. Then you don't need to worry about dropped enqueues because it will be the user's/caller's responsibility to recognize the entire request failed and try again later. If you can make and enforce this choice, then a separate queue would be okay.)

Instead, I find the simplest, strongest guarantee of availability is to just use your primary application database--it should always be there.

And, granted, sometimes it won't be, but at that point your entire application is down, so the point is moot. No dropped enqueues because there are no requests at all.

Furthermore, I think this approach generalizes to other resources besides the queue. Whenever possible, I prefer for my web applications to talk to as few external resources as possible--that includes email servers, queue servers, 3rd party SOAP services, etc.  

For example, sending emails on the request thread--will work 99% of the time, but when it doesn't, the user sees an error. And if instead you send email from a background thread, you risk it being lost if the machine goes down. Or you could just shove the email into the database and let a polling worker send it.

Besides the simplification (much easier to test the web UI if it just talks to the db; less services to fake out), you're essentially building in durability to your system.

Email service flake out? No problem, the polling worker will try again in an hour. A 3rd party SOAP API suffer a severe data center outage? No problem, the polling worker will try again in an hour.

Which is *much* better than the answer being "um...I'll dig through the logs looking for stack traces and manually resend what got dropped".

Okay, so I've admittedly drifted from using specifically DaaQ in your application to using a persistent queue in general. But, again, it is nice if your queue is not yet-another-service, as then you're ensured your application stays consistent.

Implementation
--------------

In my experience, I think there are two common ways to implement DaaQ:

1. Boolean flags with a single worker.

   If you have an `employee` table, add a flag `needs_work_done`, and have a worker polling every five minutes for `SELECT * FROM employee WHERE needs_work_done = true`, and then for each result, do the work + change `needs_work_done = false`, ideally in a single transaction.

   (This assumes the work's side-effects are also in your primary database--if they are else where, you'll have to think of error conditions and idempotence, as with any queue.)

   This is my favorite DaaQ approach just because it's the simplest. I think it's very hard for things to go wrong with this model. It's easy for the application logic to "enqueue" work (just flip the flag), and easy for the polling workers, or you as an admin, see what work is remaining by querying on the `needs_work_done = true`.

   The major con of this approach is that it doesn't lend itself to more than 1 worker, which usually entails more flags like an `in_progress_since` time stamp for coordination between workers, etc.

2. A separate `queue` table with a new row for each work item, with either one or many workers polling from `queue`, marking `queue.in_progress_since = now()`, and then deleting the `queue` row when done.

   This is used by off-the-shelf DaaQ libraries like [queue_classic][2] because it means the queue can use its own few, generic tables in your schema and not have to integrate with anything else. It is also amenable to coordinating multiple workers that can generically perform any number of tasks.

   It is a little trickier to implement, but I think still doable, even rolling your own. In keeping with the DaaQ pattern, I think it's important to still leverage your database as the authoritative state as much as possible.
   
   The window between a worker doing "get some work", "do the work", and "mark work done" should be as tiny as possible to ensure the database doesn't suddenly go away. But, of course, it still might, so you'll still need to think of idempotence.

Another thing to consider is implementing your own DaaQ logic/polling, or using something off the shelf.

My general opinion is that if you need potentially lots of workers, using an existing solution is likely a good bet. However, for lighter workloads, there can be an advantage to rolling your own, as you can adapt it to your needs.

For example, one queue I implemented had the feature that if a user had multiple enqueued items, and one failed, the all of the user's work would be put on hold (because items later in the queue depended on the user's items earlier in the queue completing successfully). But items for other users would keep being processed.

Conclusion
----------

So, yeah, tl;dr, use common sense, if database-as-a-queue isn't going to work for your system, then don't use it. But if your situation allows it, I think it's an easy win for a simpler, more robust system.

[1]: http://it.toolbox.com/blogs/programming-life/a-look-at-using-your-database-as-a-queue-49143

[2]: http://ryandotsmith.heroku.com/2011/09/queue_classic.html

