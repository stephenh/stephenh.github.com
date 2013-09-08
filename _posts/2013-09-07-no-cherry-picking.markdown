---
title: If you cherry pick, your branch model is wrong
layout: post
---

{{page.title}}
==============

At [work](http://www.bizo.com), we finally moved off of Subversion (which I'd been tolerating via `git-svn` for the last 4 years) and moved to git.

(Ironically, what forced our hand was that Atlassian shutdown their hosted Subversion service, so we migrated over to...Atlassian Bitbucket (we have 10x more projects than developers, so it's cheaper than Github).)

Anyway, with Subversion gone, we're actually using feature branches now. Nice.

So, in mulling over how we want to handle branching, we are ending up with something that looks kinda/sorta like [git flow](http://nvie.com/posts/a-successful-git-branching-model/) (except using our existing branch naming conventions, other minor things).

Cool. Git flow is old (but good) news, nothing new.

Get to the point
----------------

So, why the post? I wanted to highlight my realization that **git flow does away with the need for cherry picking**.

Perhaps this does not seem like a big deal, but it was sort of an "ah ha" moment for me.

(Aside: "cherry picking" is a general SCM notion of saying "take this commit that was in this branch, say `release`, and put just that single commit (and none of the commits before or after it) into this other branch, say `master`. Usually cherry picking is used for, say, committing a hot fix onto your `release` branch and then back porting just that one commit to other branches.)

Cherry Picking in git vs. Subversion
------------------------------------

Several years ago (2008-ish), a friend and I were first starting to use git, and were going back and forth on the merits of git's vs. Subversion's cherry pick. Even though it's the same conceptual operation, the details are different between the two systems. Specifically:

* In git, `git cherry-pick` copy/pastes a commit from one branch to another.

  In doing so, when the commit is "pasted" onto the new branch, it now has a new parent commit (which would be whatever the tip of that branch was when the "paste" happened).

  And since parent ids are part of the new commit's SHA1 id, the pasted commit now has a new commit id.

  So you now have two physically distinct commits in your repository for the same logical change. And no metadata tying them together.

  Here is what the DAG would look like:
  
      A -- B -- C -- E'   trunk
       \
        D -- E            release

  {: class=code:plain}

  Where `E` is the original hot fix commit on the release branch, and `E'` is the copy of the `E` commit.

  The DAG does not give any hints that these two separate commits are the same conceptual change.

  My friend's assertion was that that's pretty ugly. And it is.

* In contrast, in Subversion, it also pastes the diff onto the new branch (which technically makes a new Subversion version number), but it records in the metadata (`svn:mergeinfo`) where the commit came from.

  This is admittedly cleaner, as now we may have the same diff applied twice, but we at least know they came from the same logical change. 

The Solution: Don't Cherry Pick
-------------------------------

At the time, I did not have a good answer for the deficiency of git's cherry-pick.

But now, 5 years later, I realized that git flow has a really elegant approach: you shouldn't use `git cherry-pick` in the first place. If you look at their diagram, commits can move through every major use case (development, release preparation, hot fixes) without being cherry picked.

Their insight is that, with git (or any DAG-based SCM), if you can anticipate where a commit may/will be need to applied, you can put it on it's own branch, and merge it into those various places as needed.

This will get the change applied to all the necessary branches (you can merge it into release as well as master), but not result in the commit getting copy/pasted. Instead, new merge commits will be recorded, so no new commit ids, and the history (what branches have this commit?) is tracked nicely in the DAG.

This is much more kosher than a clumsy cherry-pick. 

Branching from master
---------------------

So, the question is, if we're going to make a new branch for our commit (instead of committing directly on release), where should we branch from?

In [git flow](http://nvie.com/posts/a-successful-git-branching-model/), they create hot fix branches off of the master (release) branch.

This is intuitive, because you want to ignore all of the commits in "develop" (using the git flow terms), and release only has what is in production.

So, per their diagram, you commit on the hot fix branch, and merge it into both master and develop. It'd look like:

    A --- C ---- F           develop
     \          /
      ..       /             (last release branch)
       \      /
        B -- E               master (release)
         \  /
          D                  hot fix
{: class=code:plain}

Where `D` is the hot fix commit, and `E` is where it is merged into master (for release to production) and `F` is where it is merged into develop.

I think this generally works well and makes sense.

Branching From develop
----------------------

That said, one thing about git flow's approach is that, because hot fixes are created off master (release) branch, when you merge the hot fix back into develop, you're basically merging the release branch itself back into master.

This is likely usually fine, but for us posed a problem because we actually have commits on the master (release) branch that we don't want coming back into develop. (The commits are config/build related, not application functionality.)

So, we need another place to branch from, that doesn't have the latest develop work-in-progress. Basically, what develop looked like when the last release was cut.

E.g. we want the DAG to look like:

    A --- C ----- F           develop
    |\            |
    | ..          |           (last release branch)
    \  \          /
     \  B -- E   /            master (release)
      \     /   /
       --- D --               hot fix
{: class=code:plain}

Where, again, the `D` is the hot fix (but branched off `A` instead of `B`), `E` is where we merged into master, and `F` into develop.

This approach has the behavior we were looking for, in that commits made directly on master (release), won't be in the hot fix branch, since it comes directly from develop.

But, how do we know where on develop to create the branch from? We want it to be "the last commit on develop that was merged into master". There is not a named branch for this, so are developers just supposed to scan back in the DAG and find it?

Turns out we can ask git. `A` is what git calls the merge base of develop and master--it's the last commit that is on both of them.

So, to make a hot fix branch off of `A` when develop has already moved on to `C`, we can run:

    git checkout -b hot_fix_branch \
      $(git merge-base origin/release origin/develop)
{: class=code:shell}

This is admittedly not as simple as `-b hot_fix_branch master`, but it is still copy/paste-able and doesn't require the developer to manually identify the commit.

Downsides?
----------

The con to not cherry picking is that you'll need to know up front that you want your commit applied into multiple places, so that you can place it on it's own branch.

However, I think this is usually the case. E.g. you're working on a bug report in production, and know you'll need the fix to be on a hot fix branch.

That said, there are admittedly other times where you'll make a commit in day-to-day development directly on an existing branch, and then only later realize it needs to be on another branch. This is where you'll still need to cherry pick. Hopefully it doesn't happen too often.

Terminology
-----------

One last note is that I find git flow's branch names confusing--personal preference of course, but I would call their master branch "release" (or "stable"), and call their develop branch "master".

Hm. Although, in retrospect, if master is the default branch that users build when they randomly checkout the project (say if it were an open source project), then having the default branch (master) also be the release branch makes sense.



