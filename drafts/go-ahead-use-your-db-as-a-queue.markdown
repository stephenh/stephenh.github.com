---
layout: draft
title: Go Ahead, Use Your Database as a Queue
---

{{page.title}}
==============

Recently I've come across a few opinions that assert using your database
as a queue is an anti-pattern. E.g. posts like [this][1] from just a few
days ago.

However, I feel that "anti-pattern" is a mislabeling of the approach,
because the term insinuates that it is always a bad idea and should be
avoided or else you risk disaster when things inevitably go wrong.

This doesn't match my experience. I've used a database as a queue on
several projects now, and, so far, have not been burned by the approach.
Quite the opposite, I think it provides several nice properties that can
make it a good choice *for the right situation*.

To evaluate whether it's a good choice for your project or not, I think
there a few things to think about: scale, response time, atomicity, and
simplicity.

Scale
-----

First, the disclaimer; yes, if you're Twitter, or the next hot social
thing, you can't use this approach. The database-as-a-queue (DaaQ) will
fall over if you have a lot of contention. However, what is "a lot"?

I'm admittedly making this up, but I think if you can safely guarantee
you'll have less than 10 worker *machines* polling your DaaQ, that you
should be fine.

I explicitly say machines, because even if you have multiple
workers/machine, you should be able to easily have 1 worker/machine be
in charge of grabbing things to do and distributing it internally to the
rest of the workers. And it seems unlikely that a database would get
upset about 10 connections contending over some rows.

Of course, I saw 10, but, really, I've never had to have more than just
1 polling machine, and I think it's extremely likely that the majority
of DaaQ use cases fall into that load size as well.

But, yeah, if you venture out of this, and will have tens+ of polling
machines contending on the DaaQ, a traditional queue is a better choice.

Response Time
-------------

In my experience, DaaQ usually involves polling on the part of workers.
The polling lag may be anywhere from seconds to minutes, but it is
nonetheless noticeable.

If you're like Amazon and need to have the order confirmation email in
my Inbox I swear before I've even clicked "Confirm Order", then using a
traditional queue is a good choice.

(However, I say that, but then recently stumbled across the fun looking
[queue classic][2], which uses a PostgresSQL-specific feature to do wake
ups of sleeping workers. Cool stuff!)

Atomicity
---------

Okay, the last few points have been about why *not* to choose DaaQ--this
one is the biggest reason why you *should* choose DaaQ if you at all
possibly can: atomicity.

What's awesome about DaaQ is that your queue lives inside your main
application database. Which means 1 transaction. Which means all of your
business logic (saving the user, whatever) and the ensuring enqueue of
work (send user info to other system, whatever) are committed together
*atomically*, without any crazy two-phase commit JTA/whatever
configuration.

Simplicity
----------

This ties into the last one, but I find DaaQ much easier to reason
about. Especially the error conditions.

When I want to enqueue work, I want the strongest guarantee that the
queue will be available, otherwise I will surely at some point have to
recover dropped enqueues (well, unless you ensure your queue error
happens *before* your commit, so then none of the request's work is
completed and the user/caller just has to try again).

The simplest, strongest guarantee of availability I know of is to just
use your primary application database--it should always be there.

And, granted, sometimes it won't be, but at that point your entire
application is down, so the point is moot. No dropped enqueues because
there are no requests at all.

Furthermore, I think this approach generalizes to other resources
besides the queue. Whenever possible, I prefer for my web applications
to talk to as few external resources as possible--that includes email
servers, queue servers, 3rd party SOAP services, etc.

For example, sending emails on the request thread--will work 99% of the
time, but when it doesn't, the user sees an error. And if instead you
send email from a background thread, you risk it being lost if the
machine goes down. Or you could just shove the email into the database
and let a polling worker send it.

Besides the simplification (much easier to test the web UI if it just
talks to the db; less services to fake out), you're essentially building
in durability to your system.

Email service flake out? No problem, the polling worker will try again
in an hour. A 3rd party SOAP API suffer a severe data center outage? No
problem, the polling worker will try again in an hour.

Which is *much* better than the answer being "um...I'll dig through the
logs looking for stack traces and manually resend what got dropped".

Okay, so I've admittedly drifted from using specifically DaaQ in your
application to using a persistent queue in general. But, again, it is
nice if your queue is not yet-another-service, as then you're ensured
your application stays consistent.

Conclusion
----------

So, yeah, tl;dr, use common sense, if database-as-a-queue isn't going to
work for your system, then don't use it. But if your situation allows
it, I think it's an easy win for a simpler, more robust system.

[1]: http://it.toolbox.com/blogs/programming-life/a-look-at-using-your-database-as-a-queue-49143

[2]: http://ryandotsmith.heroku.com/2011/09/queue_classic.html

