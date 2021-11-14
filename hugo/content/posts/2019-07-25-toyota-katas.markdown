---
date: "2019-07-25T00:00:00Z"
section: Books
title: Toyota Katas Notes
---

{{page.title}}
==============

I recently re-read [Toyota Katas](https://www.amazon.com/Toyota-Kata-Managing-Improvement-Adaptiveness/dp/0071635238), which I'd picked up awhile ago based on a recommendation in a book (I forget which).

The very brief overview is the book asserts in the 1980s/90s, manufacturing in the US copied *specific practices* of the Toyota production system ("oh, you do six sigma", "oh, you do kanban", "oh, you use cell manufacturing" (other specific practices I don't really know), "no problem, we can do that too!".

When really those were just point-in-time innovations, and Toyota's actual competitive advantage was a culture and approach (an "improvement kata", a "coaching kata", etc.) that kept finding _new_ best practices (i.e. the author has several stories of returning to factories that were no longer doing a specific practice, and Toyota's staff would explain "well, that approach doesn't make sense anymore").

So the book tries to describe Toyota's continuous improvement culture.

A few of my high-level takeaways/ahas:

Kanban is Not the Goal
----------------------

For all the fan fair around Kanban in the software community, with the aurora of "it comes from _The Toyota Production System_", I was surprised to hear that they regard kanban as a to-be-tolerated compromise and not the ideal goal.

Their ideal goal is 1-by-1 flow, which is a production line of ~20-whatever machines, all handing off their part immediately to the next machine, exactly when that machine needs it, with no batching/inventory in between.

In contrast, kanban is a "supermarket" for parts, where parts are placed in bins, and the bins are only refilled by upstream machines when they're "bought" from by downstream machines. This makes it a pull-based system, but the bins are inherently inventory/batching.

That said, despite introducing inventory, kanban is still a net improvement over "scheduled-based" planning, where upstream machines would produce X parts/day, "because the central planning schedule that management forecasted a few months ago says so", and be blithely unaware about downstream demand.

So, kanban is a pragmatic compromise, but just not the end/ideal goal.

'No Inventory' is More About Quality, Not Just Cost
----------------------------------------------

From American popular press, I'd generally picked up "Toyota's Just-In-Time manufacturing was amazing because it has no/less inventory, and inventory is expensive".

This is true, but the book asserts that no inventory is, as far as I understand, even more so about quality.

When a machine produces a bad part, and it immediately goes to the next machine, if that part doesn't work, there is an immediate "hey wait, what happened?" feedback loop. The line stops (the cord pulls), and a team lead (manager-ish) can walk back to the offending machine and diagnose (in a blameless retro) what happened/why the system failed.

But, if a machine produces a bad part, and it goes in a box with 1,000 other parts, and a few days later when it's taken out, we learn that part is bad, tying that back to what happened is pretty hard. So, meh, grab another part and keep going. Hence inventory hampers output quality.

Similarly, if a machine + operator usually produce ~5 parts/hour, but then something odd happens every now and then, and they drop to ~2 parts/hour, if there is no inventory (buffer), that is a big deal, we're missing 3 parts/hour, and we have to diagnose/fix the bump now. But with inventory, meh we don't see the bump yet, the downstream machine is fine. Hence inventory hampers process quality.

So, ironically, inventory can be seen as a good thing, i.e. a buffer against variability, but that is also precisely why the Toyota system considers it bad: it hides both output quality and process quality behind the veil of "meh, there is a buffer".

Team Leads Spend 50% of their Time on Improvement
-----------

The book asserts there are two view-points on continuous improvement, one being "operator-driven" (i.e. as the operator is producing ~X parts/hour, they'll also figure out "oh hey, my process is not great here") or "team lead-driven" (i.e. a team lead watches over the operator's shoulder, or more precisely walks up when the 'stop' chord is pulled).

The assertion is that it's not fair to expect operators to both produce ~X parts/hour + do meta-thinking/planning about process improvement (although they're certainly a source of ideas too, they're not the primary driver).

So, team leads (kinda/sorta managers) spend **50% of their time** specifically on process improvement.

As far as I understand, these team leads are an entire layer of the organization that other manufacturers don't/didn't have, which seems expensive, but it pays off b/c the rest of Toyota's operators are more efficient (due to better processes), so there are less operators (so actually net less personnel). And also the work output is higher quality.

Applications to Software
------------------------

I can't help but think of applications to software.

Or, if anything, non-applications; reading a book written by a manufacturing expert, for other manufacturing experts (albeit still for a lay audience), drives home how repetitive manufacturing processes are. The same part, on the same machine, multiple times *per minute*, for days and weeks. It's just nothing like software development.

But this repetition is why they can focus so much on optimization and reducing variability.

(That said, I suppose while our build-time environment is very different, at runtime our software systems look pretty similar to manufacturing systems, i.e. request processing is the same request, thousands of times per minute, for days and weeks; and we want the same optimizations and reductions in variability; just at runtime.)

Having team leads spend 50% of their time on process improvement is perhaps the most intriguing and potentially applicable practice. I.e. I could see something where any time an engineer on a team got "stuck" (i.e. their task took too long, their tests ran too slow, there was a bug due to a language/tooling/framework issue), a team lead would have 50% of their time available to diagnose/refactor/fix the issue.

Which really is just refactoring, but with a senior, per-team person dedicating a non-trivial amount of their time to it, as their specific job/responsibility. I imagine that would result in some pretty great systems, and teams that could then move extremely quickly.



