---
layout: draft
title: jOOQ Went Commercial
---

{{page.title}}
==============

I have no idea how I missed it, but over a year ago the [jOOQ](http://www.jooq.org) [went commercial](http://blog.jooq.org/2013/10/09/jooq-3-2-offering-commercial-licensing-and-support/).

Or half-commercial.

jOOQ is a Java database access library that focuses on being a low-level DSL for SQL (it's part of the No-ORM movement). I follow it because it uses code generation in a way that is similar to [Joist](http://www.joist.ws) (although Joist is very much in the Pro-ORM camp).

See [their website](http://www.jooq.org) for more examples, but just to give you an idea, here's a select statement:

    create
      .selectFrom(BOOK)
      .where(BOOK.PUBLISHED_IN.eq(2011))
      .orderBy(BOOK.TITLE)
{: class="brush:java"}

As usual with database libraries, jOOQ has various adaptors/backends, e.g. MySQL, PostgreSQL, Oracle, etc.

So, a year ago, they decided to keep the backends for the open source databases free (MySQL, PostgreSQL, etc.), and then *de-open source* the backends for the commercial databases (Oracle, etc.).

Anyone that wanted to use jOOQ to talk to commercial databases would then have to buy a *per-workstation* developer license.

Even more, this was not "we have this brand new Oracle backend, but it's going to be commercial from day one"; AFAICT, it was "this same Oracle backend that was open source in 3.1, yeah, you can't have it anymore in 3.2".

These guys have balls!

And, if you read their [announcement](http://blog.jooq.org/2013/10/09/jooq-3-2-offering-commercial-licensing-and-support/), I have to admit, they make some good points.

The reason I liked most is why they avoided the traditional "all open-source, support-only" model (like Spring or Typesafe): they assert that jOOQ, unlike big, complex libraries, is really simple to use. No one should need support anyway. So of course support-only model is a bad idea.

And, similarly, they assert that jOOQ is all about developer productivity; it's not a database server that cares about number of cores/server, or RAM/server; it's about developer productivity. It's a developer tool. Hence a per-developer workstation license.

Both are good points.

And, hey, here they are, [still around](http://blog.jooq.org/2014/09/30/the-caveats-of-dual-licensing/) a year later. So it must be working out.

It's pretty exciting to see open source developers actually making money from their software. (Although, if you look at their [news](http://www.jooq.org/news)/events page, they seem to be doing their fair share of evangelism at conferences/etc.; which is great that they're actively marketing their product.)

(Very tangentially, I also whole-heartedly agree with their recent post on [using your database for messaging](http://blog.jooq.org/2014/09/26/using-your-rdbms-for-messaging-is-totally-ok/). I have an ever-in-drafts blog post from 2011 that asserts basically the same thing. With the caveat that, since then, and primarily due to Amazon SQS and Kinesis, I'm not as anti-queue as I used to be.)

In other "open source developers that have the gall to make money" news, Synergy, which is amazing and I use on a daily basis, recently started requiring $5 on their [download page](http://synergy-project.org/download/).

On one hand, Synergy has been around for forever, so I've always been surprised when reading the docs/forums about the allusions that it takes a full-time team of devs to continue building/supporting. Naively, I thought it'd be one of those programs that, once written, was "done".

But they do support Windows, so maybe that's it. Or the continuous Wayland/whatever gyrations is happening on the Linux desktops these days.

Either way, kudos to them as well. I hope it works out.

...

Wow, I just saw the jOOQ pricing. I was anticipating a $50/developer price point. It's actually $500/year/developer, for the basic commercial version. Or $2,200/developer for the perpetual/non-yearly non-basic commercial version. 

One one hand, that seems a little much for a SQL DSL, as those prices are more like Java debugger price points (which are order of magnitude more complex to build/maintain, so can more easily justify that price IMO).

On the other hand, I can also see a developer/productivity tool (specifically thinking of Joist) contributing $2k/developer of value over the life of a project. A team of 10 developers? $20k (or 0.2% of a 5-year/10 dev budget) for the time and errors saved from boilerplate code would be worth it.

So, makes sense. I hope it goes well for them.



