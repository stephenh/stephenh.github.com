---
title: Linear Tech Talk Notes
description: ""
date: 2023-07-04T00:00:00Z
tags: ["Architecture"]
---


Just posting my quick notes after watching this great [Linear.app Tech Talk](https://www.youtube.com/watch?v=Wo2m3jaJixU) on their application's synchronization approach. This is similar to my last post/notes on Vulcan.io, although both have the disclaimer that, while I enjoy paying attention to the offline/two-way sync problem domain, I have (thankfully?) not had to work it in myself yet.

My takeaways are that Linear's initial client-side architecture was:

- Download all of your org's data (basically your tenant) in 1 GQL call,
- Put literally all of it into in-memory MobX objects,
- Write a React UI against the MobX objects,
- Profit!

I'm a MobX fan, so love the callout.

This architecture still required a lot of up-front effort to build (sounds like they basically built a client-side, offline-first ORM on top of IndexedDB and MobX), but the pay-off was a super-fast offline-first UI that was their product's primary differentiator (in the video, he was an aside that mentions the Linear co-founders did zero product/market fit research during their first few months as a startup, because they took it as obvious that millions of people use issue trackers, so of course there is a market, they just needed to build the best one).

After this initial architecture, they progressively realized:

* Okay, so "downloading all the org's/tenant's data (even if fast-forwarding to only changes since your last boot) at once can be slow", so they split it into two "smaller and important boot data" (blocking) + "larger but less important boot data" (non-blocking) loads.
* Okay, after that, some orgs have huge data, so instead of pulling the entire client-side db into memory, we'll lazy-load the client-side db --> in-memory MobX objects (with admittedly a pretty neat approach which was very transparent to the React UI: they would basically use sync access to trigger loads, and briefly return `[]` while the async load resolved in the background),
* Okay, after that, some orgs have so much data (issues, comments, history) that even pulling it all in the client-side db is too slow, so now we'll even lazy load the server-side db -> client-side db (which is starting to look more and more like a traditional network-requiring app...)

Afaict, I think they've basically ended up with three levels:

1. The ~static subset of the graph needed to even boot the app (basic org + users + team data)
2. The ~static subset of the graph that needs to load very soon after boot (maybe projects? issues assigned to you?)
3. The dynamic subset of the graph that lazy loads as you navigate the app (ideally speculatively running these to maintain the as-fast-as-possible UX)

(And all of this is just reads, tracking writes is also required.)

Basically the problem generalizes to what subset of the server-side object graph does the client need, and how/when do you incrementally crawl/lazy-load the object graph down to a) the client-side db and b) the client-side in-memory UI to best achieve the immediate-ui-load performance vs. slow-app-bootstrap trade-off.

When you're small, you can build an MVP and assume the client-side's data subset is the tenant's entire dataset, which is super-clean & elegant, and you definitely should do this to ship the MVP and gain customers...but then eventually data/tenants in the real-world are large, and you'll come back around to this problem of needing to lazy-load a subset of the graph. Which of course is a luxurious problem to have.


