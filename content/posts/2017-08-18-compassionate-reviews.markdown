---
date: "2017-08-18T00:00:00Z"
section: Favorites
title: Compassionate Code Reviews
---


I gave a short internal talk about code reviews the other day.

Not entirely sure if the slides are useful without the in-person commentary, but I thought I'd publish them anyway.

<div style="text-align: center;">
  <img src="/images/compassionate-reviews/1.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/2.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/3.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/4.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/5.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/6.png" style="width:30em;"/>
  <img src="/images/compassionate-reviews/7.png" style="width:30em;"/>
</div>

As a summary, obviously I really enjoy code reviews. To me they are fun, and I would do them as a hobby even if I didn't have to as part of my day job.

All things considered, I think the industry has really embraced code reviews over the last ~20 years.

When I started, or at least the places I started at (enterprise shops circa mid 2000s), it was very odd/unexpected to read other people's diffs. I had picked it up from following open source projects, mostly Apache's Jakarta projects, but in-house/day-job projects just didn't do it (granted, I'm sure there were exceptions, but it was not the rule).

But I started to apply it to in-house projects anyway, because I'd seen how effective they were. And, admittedly, my OCD liked seeing all of the changes to a codebase go by. It just felt very naked to not know what other developers had been changing in the project.

The tooling at the time was also very primitive and basically "a Perl post-commit hook that emails text diffs". One of my first open source projects, [commitmessage](http://commitmessage.stage.tigris.org/) (I can't believe that's still online), was a Python framework for writing cross-SCM commit hooks. It supported both mainstream SCMs at the time: CVS and, the new hotness, Subversion.

But now basically all tech companies do code reviews, such that you will get raised eyebrows if you come interview and your current place does not.

If your company is not doing code reviews, I will wonder: a) what other best practices has your current company ignored and so failed to teach/expose you to, and b) why haven't you evangelized code reviews and showed them the err of their ways?

Or maybe that's why you're interviewing, in which case, good call. :-)

Anyway, that tangent side, most places do code reviews and I also think most places do them pretty well, e.g. as part of an overall healthy culture of quality.

I hope you work in a culture where code reviews are similarly enjoyed, and, if not, that you can guide your team and culture towards that.

