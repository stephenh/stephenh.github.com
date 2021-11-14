---
date: "2018-06-27T00:00:00Z"
section: Productivity
title: I Forgot How Much I Don't Like Pull Requests
---


**Update:** Joan Gamell pointed out in the comments that I'm blind and the PR UI has view-by-commit built in (and not just the Commits tab, which I'd seen before, but a dropdown integrated into the File Changes view itself). It even has hot keys of `c`, `n`, `p`. I'm very exited about this. I'm going to leave the post as-is, as my diatrbe still applies to making nice commits, and reviewing code by commit, but it looks like GitHub can/does support this workflow well.

I've recently started doing code reviews on GitHub (not because I'm new to code reviews, but I've been using other tools for awhile), and, man, I forgot how much it sucks.

My dislike stems from branch-based reviews being inferior to commit-based reviews.

If you know what I mean, and you already know that [Gerrit](https://www.gerritcodereview.com/) solves everything, you can stop reading. I have nothing new to say.

Branch-Based Review
-------------------

The term is very obvious, but GitHub/PRs are *only* branch-based.

E.g. if I have three commits:

* C1: Extract a small helper method from a larger method
* C2: Rename an older field to a better name
* C3: Add a new test+fix for a bug

I do this all in one sitting (e.g. a morning), and then push out my branch.

In a GitHub Pull Request, all of these changes are shown at once as one single, intermingled diff, which is terrible.

For example:

* The 1st commit might change ~50 lines in one file (one local method extraction).
* The 2nd commit might change ~100 lines in ten files (method rename across all callers).
* The 3rd commit might change ~20 lines in two files (the class and it's test file).

When you view the PR, these are all mingled together, and now all of my code reviews have to waste their time trying to tease the two part.

There are 170 total lines changed; for *every single line*, I have to mentally decide, is this line:

* Related to the 1st boring change, a 30% chance (~50 of ~170)
* Related to the 2nd boring change, a 58% chance (~100 of ~170)
* Related to the actual interesting change, a 12% chance (~20 of ~170)

Granted, some of the lines will be grouped as diff chunks (e.g. a newly-add method with ~10 new lines shows up as a single green diff chunk), so I can infer at the diff-chunk level...

But actually not, because a single ~10 line chunk *might* have changes from both the 2nd and 3rd commit.

Now I have to tease out, within every single green/red diff chunk, what changed for boring reasons vs. what changed for interesting reasons.

This is terrible.

Commit-Based Review
-------------------

Commit-based review is just what it says, look at each individual commit separately.

In our example of boring 1st commit, boring 2nd commit, interesting 3rd commit, I assert it might take ~10 minutes to do the "one big intermingled" PR (e.g. 10 minutes to review all 170 lines).

However, if I review the changes by commit, then:

* The 1st commit will take ~30 seconds (scan all ~50 lines, "yep these are all a method extraction", done)
* The 2nd commit will take ~30 seconds (scan all ~100 lines, "yep these are all a method rename", done)
* The 3rd commit that is *only 20 lines long*, I can now spend ~5 minutes focusing on just this change

So my net time is 10 minutes for "1 review of the intermingled branch" but 6 minutes for "3 reviews of individual commits".

Obviously I completely made up these numbers: academics of the world, please feel free to do a study, or link me to ones that already exist (...as long as they agree with me? :-)).

So, granted, I am somewhat unapologetically just going off my gut, of what feels fun and fast to me (commit-based) vs. tedious and slow (branch-based).

It's Not Just Time/ROI, But Review Quality
------------------------------------------

While the last section was a made up "you'll spend less time", and tries to make a ROI case for commit-based reviews, for me that is not entirely it.

Instead, a better articulation is "fast path" reviews vs. "slow path" reviews.

When I'm reviewing mechanical changes that incrementally make the code base better, I can read those reviews in "fast path" mode. I don't need to think about test cases, I don't need to think about failure modes. I just need to scan and go.

However, for true business logic changes, I have a "slow path" mode, where I slow down and actually read the code. I try to tell what the code was doing before, what the code is doing now, and why we had to make the change. (Obviously the commit message/pull request overview is a great hint from the author that, when well written, can help bootstrap data into my "slow path" process. But I still sanity check that for myself, because that's the point of a code review.)

So, what kills my productivity in branch-based reviews is mixing "fast path" with "slow path" code changes.

When I can't tell which is which, I either have to: a) use "slow path" for the entire review, which is hard and tedious, and b) give up and use "fast path" for the entire review, and admit I'm not actually doing a true code review, and might be missing nuances that my typical "slow path" might have caught.

Both of these choices suck, and means I'm likely to give less-than-I-could review feedback.

Branch-Based Forces Sync, Large Reviews
---------------------------------------

As a disclaimer, I do see smaller PRs, and those are great.

However, the branch-based workflow fundamentally drives larger code reviews because it forces them to synchronous.

By synchronous, I mean "I push a branch, and then don't touch it until I get a +1 and/or feedback, and then I continue".

E.g. I'm synchronously blocked on getting the PR feedback.

To illustrate this, you could *try* to do small reviews in a branch-based model, but it would look like:

* 9:00am Extract a helper method (easy/fast)
* 9:02am Commit 1st PR
* 9:03am Push branch
* ...waiting...
* 10:30am My reviewer gives me a +1
* 10:40am I notice the +1 in slack/email
* 10:45am I get back to my CLI and do a git merge, new branch
* 10:46am Rename an older field to a better name (easy/fast)
* 10:48am Commit 2nd PR
* 10:49am Push branch
* ...waiting...
* 12:00pm My reviewer gives me a +1
* 12:05pm I notice the +1 in slack/email
* 12:15pm I get back to my CLI and do a git merge, new branch
* 12:16pm Make new test + bug fix (actual work, takes ~60 minutes)
* 1:16pm Commit 3rd PR
* 1:18pm Push branch
* ...waiting...
* 2:00pm My reviewer gives me a +1
* ...

Obviously no developer would do this; they're not going to wait for their initial branches/PRs to make it all the way through code review + master before continuing to work.

Instead, you're going to keep hacking, and stay in your flow (which is great, that's the goal).

However, because you can't "check point" **and** "continue to work" (asynchronously), the branch-based review inherently, actively biases you towards large, ugly code reviews.

(You can technically commit, create a PR, and then switch to another branch and work there, and so not be completely blocked, but typically/only if it's completely different work, which is not very productive if you're trying to focus on a single task.)

Commit-Based Allows Asynchronous Reviews
----------------------------------------

Let's examine what happens in a commit-based timeline:

* 9:00am Extract a helper method (fast/easy)
* 9:02am 1st Commit 
* 9:03am Rename an older field to a better name (fast/easy)
* 9:05am 2nd Commit 
* 9:06am Make new test + bug fix (actual work)
* 10:06am 3rd Commit, push PR
* 11:30am My reviewer gives me a +1

This is much nicer:

* I've stayed in flow for a solid ~2 hours in the morning
* My reviewer gets an easier job
* I get their reviewer feedback sooner and can ship sooner

Note that I showed a synchronous flow above, but this can also be very async:

* 9:02am 1st Commit + Push PR
* 9:05am 2nd Commit + Push PR
* The reviewer starts at 9:30am
* 10:06am 3rd Commit + Push PR

I can make progress, continue, progress, continue, and it's completely interleaved with when the reviewer gets to my commits.

Granted, you don't want to completely pull the rug out from under your reviewer, e.g. push out half-working commits and then say "oh no, I totally rewrote those". As, yes, that would be bad, but you can use judgement to avoid that most of the time.

Fixing Small Commits
--------------------

Granted, of course you'll have to go back and fix some things in the 1st/2nd commit.

For example, let's say in the 2nd commit you renamed `Foo` to `Bar`, and the reviewer feedback is that you should rename it to `Zaz` instead.

Here `git rebase -i` is your friend, as you should be able to take your commits of:

* 1st commit
* 2nd commit, rename Foo -> Bar
* 3rd commit, bug fix

Make a new commit:

* 1st commit
* 2nd commit, rename Foo -> Bar
* 3rd commit, bug fix
* 4th commit, rename Bar -> Zaz

And then use `git rebase -i` to do:

* 1st commit
* 2nd commit, rename Foo -> Bar
  * Squash in 4th commit, rename Bar -> Zaz
* 3rd commit, bug fix

Granted, you may have to fix conflicts in the 3rd commit, but ~90% of the time, that is easy (not any conflicts, not very many, easy to fix).

In the remaining 10% of the time, that's fine, just push the 4th commit and everyone will understand that's fine/it was pragmatic.

But I Don't Have Clean Commits
------------------------------

A common push-back/concern about commit-based review is that "my commits are ugly".

E.g. if you have a commit history of:

* "Try this"
* "Try that"
* "...fuck..."
* "..."
* "Finally it works!"

Then, yes, these will not be useful in a commit-based review model.

My counter is two items:

* Just learn to make good commits.

  I regularly have exploratory "I need to try this" code changes, that would lead to "Try this", "Try that" commits.

  This is just fine, it happens, sometimes often, sometimes not.

  However, I think, with practice, especially in a particular codebase, this becomes rare: ~80% of the time (90% of the time in a codebase I know intimately), I know I'm doing mechanical "small rename", "small cleanup", "tweak this", steps, so I can easily stop and make coherent commits along the way.

  Once you have this habit, it is quite easy to do (again, not all the time, but most of the time), and I assert you'll be a better, faster developer if you try to do this.

  Also, if you're not aware of it, `git add --patch` is your friend, as you can tease aparts changes to a single file into separate commits.

  "But this takes time for me to do!" 

  That is true, but I assert every ~1 minute you put into making your code/commit cleaner saves your code reviewer ~1 minute of code review time. I'm making up tons of numbers in this post, but, give me that, that it's a 1 to 1 mapping. I think is fair, because you have a lot of current context of the code, and your reviewer, while they may know the codebase really well, is still walking in after-the-fact, and has to bootstrap their context.

  So, 1 minute of your time, 1 minute of your reviewers time, maybe that is a wash.

  However, you'll probably have more than 1 reviewer, maybe 2 or 3.

  So, I assert any time you put into cleaner commits, cleaner code reviews, should lead to a ~2-3x ROI to the team as a whole.

* Not every single PR has to be perfect, but *most* could be.

  I've written my fair share of huge, tangled, "all in one commit" commits.

  That's fine, it happens, I'm not saying everyone is perfect, and that every commit/PR should be a perfect lineange of "small change", "small change", "small change".

  However, I at least want the *option* to do that, and I'd prefer for *most* PRs to be structured that way, and right now GitHub supports neither, and so actively disincentives anyway from caring/trying to do this.

I Still Want To See The Whole Change
------------------------------------

I've also heard that reviewers sometimes want "the big picture" of a branch-based review.

E.g. it can be hard to piece together in their head a string of `N` commits, and they want to see the final merge.

I somewhat sympathize, but have two general opinions:

* Just get used to reading small commits. :-)

  The speed and "code reviews are fun again", for me, far outweigh loosing ability to (at least explicitly, without following it in your head) preference to "see the big picture".

  I assert once you try it, and get used to it, you won't want to go back.

  (This point is very egotistical, I know.)

* On specific reviews where this is still important, you can still use regular/local git to scan it (or the branch compare view in GitHub).

  E.g. about once/year I do want to see the whole branch view, and that's fine, when that rare event happens, I can drop into git branch diff and/or GitHub branch diff and look at it there. I don't need it to be directly/solely in the PR/code review UI.

  This approach allows one-off/as-needed branch-based visibility, but we keep the commit-based approach as the normal/"fast path" for the reviews themselves.

* If you insist, develop tooling to make psuedo-duplicate reviews for both view.

  E.g. it would be easy for tools like [review-branch][review-branch] to create both N per-commit reviews and a final per-branch review.

  I'd worry about duplicating effort/comments between reviews, and I think it's overkill for every commit/branch, but it is possible.

  And it would be a compromise if you have two strong commit-based and branch-based camps/references within your org. 

I Can't Even Hack This Into GitHub
----------------------------------

What annoys me the most about GitHub's branch-based model is that I can't figure out a way to hack it to do commit-based reviews instead.

E.g. I'd be fine with branch-based being the default PR model, but I don't have the options, either built-in or hacked-in, to model a commit-based approach.

For example, a previous code review tool I used, ReviewBoard, also has tooling that creates branch-based reviews.

However, that is just the high-level tooling (e.g. the `rb` CLI command), and the underlying model is still flexible enough ("just upload a diff"), that I was able to write [review-branch][review-branch] to manually explode your local branch with N commits into N reviews, one-per-commit.

It would also track "local logical commit X == remote review Y", and track this "commit X" across rebases (by using git tags instead of git hashes), and so could implement the workflow mentioned above of "go back and fix/amend commit one", and it would remember/update commit one's original review.

This resulted in a very natural flow where, as long as your commits didn't drastically change, the reviewers could see your per-commit fixes very easily (in each commit's corresponding review).

Basically it was Gerrit.

I want to do this in GitHub, but I can't figure out how.

I've thought of pushing N branches, e.g. if your branch is `bug_fix_foo`:

* Push commit 1 as branch `bug_fix_foo_1`
* Push commit 2 as branch `bug_fix_foo_2`
* Push commit 3 as branch `bug_fix_foo_3`

And then create three separate reviews of:

* Review 1: `master -> bug_fix_foo_1`
* Review 2: `bug_fix_foo_1 -> bug_fix_foo_2`
* Review 3: `bug_fix_foo_2 -> bug_fix_foo_3`

I dunno, I'm tempted to try this via the GitHub API...

There would be some complexities:

* Branch explosion, although the tool could probably clean up the throw-away branches
* I'm not sure how the "merge PR" logic would like the trio of "Merge PR1, then PR2, then PR3", when all three PRs are based on each other instead of all on master.
* I'm not sure how to handle updates; GitHub prefers PRs to be append-only, but your local branch has thrown away/amended the old hash.

  In theory, the tool could diff "1st commit" vs. "1st commit amended" and then push a sythentic commit, e.g. the diff of C1 -> C2.

  This is ugly though because we wouldn't want these clean up synthetic commits actually merged. Just force pushing to the PR would be more what we want, but I believe that throws away all existing comments/issues, which is also not good.

Anyway, this is not something I want to do.

Or Just Use Gerrit
------------------

Per the intro, a simpler solution than the previous section's degenerate "contort GitHub to display per-commit reviews" is to just use [Gerrit](https://www.gerritcodereview.com/), which has an amazing commit-based workflow.

(Technically the Gerrit workflow is both branch-based and commit-based: it understands branches as a patch series, and as workflow around blessing a patch series, but viewing diffs is still done at the individual commit-within-the-branch level.)

My primary hesitation with pitching "Gerrit everywhere" is that everyone has cut their teeth on GitHub PRs these days, which have generally have a very slick/easy to use UI (their branch-based nonsense aside).

And Gerrit, as with raw git itself, has a bit of a power-user/written-by-programmers UI.

So, I'm wary of the selling I'd have to do, to get Gerrit widely accepted within a company/org. E.g. have to do a trial with newbie git users, and make sure it doesn't hamper their productivity more than the net-ROI win from the speed up in reviews.

It is tempting though, as it looks like there is a [Gerrit/GitHub](https://gerrit.googlesource.com/plugins/github/) plugin that auto-converts GitHub PRs to Gerrit changes.

Gerrit does want to be the git master, e.g. it wants to control pushing/merging commits to the master branch, and treat GitHub as a replica.

So I'm not sure how this would jive with GitHub-based integrations like CI tools, e.g. could a CI tool see a Gerrit-managed patch/branch (via the GitHub replica), and have it's "+1 build passed" vote pass from GitHub through to Gerrit? That would be slick.

[review-branch]: https://github.com/stephenh/review-branch

Granted, Reviews Are Reviews
----------------------------

So, anyway, yes, I am super-picky about my code review workflow.

To GitHub's credit, their super-slick Pull Request UI has done a lot for lowering the barrier to entry to code reviews, and helping spread code reviews-as-best-practice within the industry (they are not the sole reason, but slick tooling always helps).

So, that is great, I'm glad nearly everyone is doing code reviews these days; in the grand scheme of things, that is more important than commit-based vs. branch-based workflows.

...even if commit-based reviews are fundamentally superior... :-)


