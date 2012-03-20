---
layout: draft
title: git-svn workshop
---

Basic Project Setup
-------------------

First, make the project trunk, A:

    $ svn mkdir https://bizodev.jira.com/svn/GITSVN/trunk/project1 -m "Creating project1."

    $ svn mkdir https://bizodev.jira.com/svn/GITSVN/branches/project1 -m "Creating project1 branches."
{: class=brush:plain}

Now make git-svn clones, A and B:

    $ git svn clone https://bizodev.jira.com/svn/GITSVN
       -T trunk/project1
       -t tags/project1
       -b branches/project1
       --authors-file=./authors
       --prefix=svn/ project1
{: class=brush:plain}

The authors file maps user names to emails, mine is:

    mike = Mike <mike@bizo.com>
    stephen = Stephen <stephen@bizo.com>
    larry = Larry <larry@bizo.com>
    timo = Timo <timo@bizo.com>
    darren = Darren <darren@bizo.com>
    alex = Alex <alex@bizo.com>
    josh = Josh <josh@bizo.com>
    tony = Tony <tony@bizo.com>
    donnie = Donnie <donnie@bizo.com>
    chris = Chris <chris@bizo.com>
    mlimotte = <mlimotte@bizo.com>
    kip = Kip <kip@bizo.com>
    gannon = Patrick <gannon@bizo.com>
    appnexus = AppNexus <appnexus@bizo.com>
{: class=brush:plain}

The default local branch name is master, but I think trunk makes more sense, A and B:

    $ git checkout -b trunk master

    $ git branch -d master
{: class=brush:plain}

Note that `master` will keep showing up, as `git-svn` seems to resurrect it occasionally.

Making the First File
---------------------

Make a new line, person B:

    $ echo "line 1" > file1.txt
{: class=brush:plain}

Note that the file is currently "untracked", B:

    $ git status
    # On branch master
    # Untracked files:
    #   (use "git add <file>..." to include in what will be committed)
    #
    #	file1.txt
    nothing added to commit but untracked files present (use "git add" to track)
{: class=brush:plain}

Running `git commit` would not do anything at this point.

So, you want to stage `file1.txt` for addition, B:

    $ git add file1.txt 

    $ git status
    # On branch master
    # Changes to be committed:
    #   (use "git reset HEAD <file>..." to unstage)
    #
    #	new file:   file1.txt
{: class=brush:plain}

Now make a local commit for it, B:

    $ git commit -m "Added file1.txt"

    $ git log
    commit 0d9b4daa8ce8f7ecb855197654ee935659001f6c
    Author: Stephen Haberman <stephen@exigencecorp.com>
    Date:   Tue Mar 20 14:02:34 2012 -0500

        Added file1.txt.

    commit ef3ebc991e9f7d40d7d3e0d9dea7de8310404368
    Author: Stephen <stephen@bizo.com>
    Date:   Tue Mar 20 18:52:54 2012 +0000

        Creating project1.
        
        git-svn-id: https://bizodev.jira.com/svn/GITSVN/trunk/project1@22024 e6edf6fb-f266-4316-afb4-e53d95876a76

    $ git branch -av
    * trunk             0d9b4da Added file1.txt.
      remotes/svn/trunk ef3ebc9 Creating project1.
{: class=brush:plain}

And push it to Subversion, B:

    $ git svn dcommit
    Committing to https://bizodev.jira.com/svn/GITSVN/trunk/project1 ...
      A	file1.txt
    Committed r22025
      A	file1.txt
    r22025 = 22b69e561f69beeda2bcd8dbfc0a9724acc2f4ba (refs/remotes/svn/trunk)
    No changes between current HEAD and refs/remotes/svn/trunk
    Resetting to the latest refs/remotes/svn/trunk

    $ git branch -av
    * trunk             22b69e5 Added file1.txt.
      remotes/svn/trunk 22b69e5 Added file1.txt.
{: class=brush:plain}

Also, pull it down, A:

    $ git svn rebase

    $ ls 
    file1.txt
{: class=brush:plain}

Dealing with Conflicts
----------------------

Both people make a change to `file1.txt`, person A:

    $ echo line2a >> file1.txt

    $ git diff
    diff --git i/file1.txt w/file1.txt
    index 89b24ec..db90b1d 100644
    --- i/file1.txt
    +++ w/file1.txt
    @@ -1 +1,2 @@
    line 1
    +line2a

    $ git commit -m "Added line2."
{: class=brush:plain}

Person B:

    $ echo line2b >> file1.txt

    $ git diff
    diff --git i/file1.txt w/file1.txt
    index 89b24ec..d471140 100644
    --- i/file1.txt
    +++ w/file1.txt
    @@ -1 +1,2 @@
    line 1
    +line2b

    $ git commit -m "Added line2."
{: class=brush:plain}

Person A wins, commits first:

    $ git svn dcommit
    Committing to https://bizodev.jira.com/svn/GITSVN/trunk/project1 ...
      M	file1.txt
    Committed r22026
      M	file1.txt
    r22026 = 1fb3acea494184455fbae1e7bfba6388c87d2f62 (refs/remotes/svn/trunk)
    No changes between current HEAD and refs/remotes/svn/trunk
    Resetting to the latest refs/remotes/svn/trunk
{: class=brush:plain}

Person B gets a conflict:

    $ git svn rebase
      M	file1.txt
    r22026 = 1fb3acea494184455fbae1e7bfba6388c87d2f62 (refs/remotes/svn/trunk)
    First, rewinding head to replay your work on top of it...
    Applying: Added line2.
    Using index info to reconstruct a base tree...
    Falling back to patching base and 3-way merge...
    Auto-merging file1.txt
    CONFLICT (content): Merge conflict in file1.txt
    Failed to merge in the changes.
    Patch failed at 0001 Added line2.

    When you have resolved this problem run "git rebase --continue".
    If you would prefer to skip this patch, instead run "git rebase --skip".
    To check out the original branch and stop rebasing run "git rebase --abort".

    rebase refs/remotes/svn/trunk: command returned error: 1

    $ git diff
    diff --cc file1.txt
    index db90b1d,d471140..0000000
    --- i/file1.txt
    +++ w/file1.txt
    @@@ -1,2 -1,2 +1,6 @@@
      line 1
    ++<<<<<<< HEAD
     +line2a
    ++=======
    + line2b
    ++>>>>>>> Added line2.
{: class=brush:plain}

Fix the file, then mark it as resolved:

    $ git diff
    diff --cc file1.txt
    index db90b1d,d471140..0000000
    --- i/file1.txt
    +++ w/file1.txt
    @@@ -1,2 -1,2 +1,2 @@@
      line 1
    - line2a
     -line2b
    ++line2

    $ git add file1.txt

    $ git diff
    (No changes, everything is staged)

    $ git diff --staged
    diff --git c/file1.txt i/file1.txt
    index db90b1d..00ca81d 100644
    --- c/file1.txt
    +++ i/file1.txt
    @@ -1,2 +1,2 @@
     line 1
    -line2a
    +line2

    $ git rebase --continue
{: class=brush:plain}

Let's change the commit message:

    $ git commit --amend -m "Fixed line2."

    $ git branch -av
    * trunk             4bc84a1 Fixed line2.
      remotes/svn/trunk 1fb3ace Added line2.
{: class=brush:plain}

And push it to Subversion:

    $ git svn dcommit
    Committing to https://bizodev.jira.com/svn/GITSVN/trunk/project1 ...
      M	file1.txt
    Committed r22027
      M	file1.txt
    r22027 = 1b16b4f4c2e718c09fc4e6fd9fb1d536e6d758f9 (refs/remotes/svn/trunk)
    No changes between current HEAD and refs/remotes/svn/trunk
    Resetting to the latest refs/remotes/svn/trunk
{: class=brush:plain}
      
And Person A pulls down the change,

    $ git svn rebase
      M	file1.txt
    r22027 = 1b16b4f4c2e718c09fc4e6fd9fb1d536e6d758f9 (refs/remotes/svn/trunk)
    First, rewinding head to replay your work on top of it...
    Fast-forwarded master to refs/remotes/svn/trunk.
{: class=brush:plain}

Branching
---------

Make a new branch, Person A:

    $ git svn branch -m "New branch foo." foo
    Copying https://bizodev.jira.com/svn/GITSVN/trunk/project1 at r22027 to https://bizodev.jira.com/svn/GITSVN/branches/project1/foo...
{: class=brush:plain}

Create a local branch to make changes on:

    $ git checkout -b foo svn/foo

    $ echo line3 >> file1.txt

    $ git add file1.txt

    $ git commit -m "Added line3."
    [foo f180d76] Added line3.
     1 file changed, 1 insertion(+)

    $ git svn dcommit
    Committing to https://bizodev.jira.com/svn/GITSVN/branches/project1/foo ...
      M	file1.txt
    Committed r22030
      M	file1.txt
    r22030 = 7f31f71982414d098bf52bf3decb447669e21efb (refs/remotes/svn/foo)
    No changes between current HEAD and refs/remotes/svn/foo
    Resetting to the latest refs/remotes/svn/foo
{: class=brush:plain}

Now Person B can work on the branch too:

    $ git svn fetch
    Found possible branch point: https://bizodev.jira.com/svn/GITSVN/trunk/project1 => https://bizodev.jira.com/svn/GITSVN/branches/project1/foo, 22027
    Found branch parent: (refs/remotes/svn/foo) 1b16b4f4c2e718c09fc4e6fd9fb1d536e6d758f9
    Following parent with do_switch
    Successfully followed parent
    r22029 = 6def22c400445c0044b3ec501321698b250d895e (refs/remotes/svn/foo)
      M	file1.txt
    r22030 = 4d49165aedd14008f6e037515685dd6365a2e807 (refs/remotes/svn/foo)

    $ git branch -av
    * trunk             1b16b4f Fixed line2.
      remotes/svn/foo   4d49165 Added line3.
      remotes/svn/trunk 1b16b4f Fixed line2.
{: class=brush:plain}

Person B can merge foo into trunk:

    $ git config --global svn.pushmergeinfo true

    $ git merge --no-ff --log svn/foo
    Merge made by the 'recursive' strategy.
     file1.txt |    1 +
     1 file changed, 1 insertion(+)

    git log --graph trunk --pretty=oneline --abbrev-commit --decorate
    *   8a171bc (HEAD, trunk) Merge remote-tracking branch 'svn/foo' into trunk
    |\  
    | * 4d49165 (svn/foo) Added line3.
    | * 6def22c New branch foo.
    |/  
    * 1b16b4f (svn/trunk) Fixed line2.
    * 1fb3ace Added line2.
    * 22b69e5 Added file1.txt.
    * ef3ebc9 Creating project1.

    $ git svn dcommit
    Committing to https://bizodev.jira.com/svn/GITSVN/trunk/project1 ...
      M	file1.txt
    Committed r22031
      M	file1.txt
    Found merge parent (svn:mergeinfo prop): 4d49165aedd14008f6e037515685dd6365a2e807
    r22031 = 8baa1e105c067292165892345dc62081e9c4d09b (refs/remotes/svn/trunk)
    No changes between current HEAD and refs/remotes/svn/trunk
    Resetting to the latest refs/remotes/svn/trunk
{: class=brush:plain}



