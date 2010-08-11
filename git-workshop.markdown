---
layout: default
title: Git Workshop
---

Git Workshop
============

Part 1 - Simple Commit
----------------------

    # 0. Clone from github
    $ git clone http://github.com/stephenh/git-workshop.git
    $ cd git-workshop

    # 1. Tell git who you are (usually done once per machine)
    $ git config user.name "Your Name"
    $ git config user.email your.email@example.com
    $ git config color.ui auto

    # 2. Make a new file
    $ echo "line1" > new.txt

    # 3. See your status, new.txt is untracked
    $ git status

    # 4. Stage the new file
    $ git add new.txt

    # 5. git status, new.txt is "to be committed"
    $ git status

    # Think of "svn commit file1 file2", in git this
    # is "add file1", "add file2", "commit". Staging,
    # then committing.

    # 6. commit
    $ git commit -m "Added new.txt."
    
    # 7. See the history
    $ git log

    # 8. Add a nice alias for log (no newlines)
    $ git config --global alias.l "log
        --graph
        --pretty=oneline
        --abbrev-commit
        --decorate"
    $ git l
{: class=brush:bash}

Part 2 - Diff, Undo Line Changes
--------------------------------

    # 1. Add a line to new.txt, see the status
    $ echo "line2" >> new.txt
    $ git status

    # 2. See the change
    $ git diff

    # 3. Undo your change, line2 is removed, nothing to commit
    $ git checkout new.txt
    $ git status

    # 4. Re-add line 2 and now stage the change
    $ echo "line2" >> new.txt
    $ git add new.txt

    # 5. See the staged change
    $ git diff --staged

    # 6. Note regular diff does not show changes
    $ git diff

    # diff          == working <-> staged
    # diff --staged == staged <-> HEAD

    # 7. Unstage the change, new.txt is back to modified
    $ git reset new.txt
    $ git status
    
    # 8. Undo the change, line2 is removed, nothing to commit
    $ git checkout new.txt
    $ git status
{: class=brush:bash}

Part 3 - Diff, Undo File Changes
--------------------------------

    # 1. Add, stage a new file, see it staged
    $ echo "line1" > new-b.txt
    $ git add new-b.txt
    $ git status

    # 2. Unstage the new file, new-b.txt is back to untracked
    $ git reset new-b.txt
    $ git status
    $ rm new-b.txt

    # 3. Remove new.txt, it is shown as deleted
    $ rm new.txt
    $ git status
    
    # 4. Stage the removal, it is shown as "to be committed"
    $ git rm new.txt
    $ git status

    # 5. Unstage the removal (HEAD is important, try without it)
    $ git reset HEAD new.txt
    $ git status

    # 6. Restore new.txt in working copy
    $ git checkout new.txt
    $ git status
{: class=brush:bash}

Part 4 - Local Branches
-----------------------

    # 1. See your branches
    $ git branch

    # 2. Make a new branch, see you're on the new one
    $ git checkout -b adding-b
    $ git branch -v

    # 3. Make a change
    $ echo "line1" > new-b.txt
    $ git add new-b.txt
    $ git commit -m "Added new-b.txt."

    # 4. Go back to master, change new.txt
    $ git checkout master
    $ echo "line2" >> new.txt
    $ git commit -a -m "Added line2 to new.txt."

    # 5. Note in git log, the adding-b changes are not in master
    $ git l

    # 6. Note we cannot delete adding-b, it is unmerged
    $ git branch -d adding-b

    # 7. Merge in adding-b, see the history
    $ git merge adding-b
    $ cat new-b.txt
    $ git l

    # 8. Now we can delete adding-b branch
    $ git branch -d adding-b
    $ git branch -v
{: class=brush:bash}

Part 5 - Local Branches with Conflicts
--------------------------------------

    # 1. Make a new branch, change new.txt and new-b.txt
    $ git checkout -b changing-b
    $ echo "line3 changing-b" >> new.txt
    $ echo "line2 changing-b" >> new-b.txt
    $ git commit -a -m "Added new line3, new-b line2 on branch."

    # 2. Go back to master, change new-b.txt as well
    $ git checkout master
    $ echo "line2 master" >> new-b.txt
    $ git commit -a -m "Added new.txt line2 on master."

    # 3. Merge in changing-b branch, see the conflict
    $ git merge changing-b
    $ git status

    # Notice that new.txt (no conflicts) is already staged.

    # 4. See only the conflicts
    $ git diff

    # 5. Examine each version of new-b.txt
    $ git show :1:new-b.txt # original version
    $ git show :2:new-b.txt # master's version
    $ git show :3:new-b.txt # changing-b's version

    # 6. Resolve the conflicts, see what we changed
    $ echo "line1" > new-b.txt
    $ echo "line2 master and changing-b" >> new-b.txt
    $ git diff

    # 7. Commit, use the default commit message
    $ git add new-b.txt
    $ git commit
    $ git l
    $ git branch -d changing-b
{: class=brush:bash}

Part 7 - Changing History
-------------------------

    # 1. Add line4 with a typo, commit
    $ echo "line44" >> new.txt
    $ git commit -a -m "Added new.txt line4."

    # 2. Note our history
    $ git l
    # sha-a "Added new.txt line4."

    # 3. Fix our typo, amend the commit
    $ sed -i s/line44/line4/ new.txt
    $ git commit -a --amend

    # 4. Note history, there is one, different "line4" commit
    $ git l
    # sha-a' "Added new.txt line4."

    # commit sha = hash(timestamp, author, message, repo contents)
    # amending always changing the last commit's sha

    # 5. Change new, new-b in separate commits
    $ echo "line5" >> new.txt
    $ git commit -a -m "Added new line5."
    $ echo "line3" >> new-b.txt
    $ git commit -a -m "Added new-b line3."

    # 6. Rebase to re-order the commits
    $ git rebase -i HEAD~2

    # oldest is listed first
    # pick sha-a "Added new line5."
    # pick sha-b "Added new-b line3."

    # Change order of lines:
    # pick sha-b "Added new-b line3."
    # pick sha-a "Added new line5."

    # Save/quit
    
    # 7. Note history
    $ git l

    # 8. We screwed up, pretend line3/line5 never happened
    $ git reflog

    # Shows what "HEAD" was X commits ago
    # Find 'commit (amend): Added line4'

    $ git reset --hard HEAD@{N}
    $ cat new.txt   # no line5
    $ cat new-b.txt # new line3
{: class=brush:bash}

Part 8 - Local Branches with Rebasing
-------------------------------------

    # So far, each time we merged, there was a fork
    # in the history. Forks for real branches are good,
    # but each concurrent change doesn't need a fork.

    # 1. Checkout a new branch, change new.txt
    $ git checkout -b working
    $ echo "line5" >> new.txt
    $ git commit -a -m "Added new line5."

    # 2. Checkout master, change new-b.txt
    $ git checkout master
    $ echo "line3" >> new-b.txt"
    $ git commit -a -m "Added new-b line3."

    # 3. Go back to working, note the fork
    $ git checkout working
    $ git l working master

    # 4. Rebase your work on top of master, no more fork
    $ git rebase master
    $ git l working master

    # 5. Checkout master, merge in working
    $ git checkout master

    # Note in the output it said "Fast-forward".
    # Unless told --no-ff, git will avoid needless
    # merge commits
    $ git l
    
    # No (unneeded) forks
{: class=brush:bash}

Part 9 - Remote Branches with GitHub
------------------------------------

Find someone to work with.

Both people:

* Go register for [github](http://github.com)
* Setup your SSH key ([Windows](http://help.github.com/msysgit-key-setup/), [Linux](http://help.github.com/linux-key-setup/)), also note the [Windows git setup](http://help.github.com/win-git-installation/)
* Should be able to SSH to github: `ssh git@github.com`

First person, click the New Repository button on the [github.com homepage](http://github.com), push a file to it:

    $ mkdir git-workshop
    $ cd git-workshop
    $ git init
    $ touch README
    $ git add README
    $ git commit -m 'first commit'
    $ git remote add origin git@github.com:<user1>/git-workshop.git
    $ git push origin master
{: class=brush:bash}

Second person, go to `github.com/<user1>/git-workshop`, fork their repository, and then checkout your copy of it:

    $ git clone git@github.com:<user2>/git-workshop.git
    $ cd git-workshop
    $ cat README

    # Change README
    $ echo "from user2" >> README
    $ git commit -a -m "Updated the readme."

    # Push user2's change back to user2's clone
    $ git push
{: class=brush:bash}

First person, pull in user2's change into your local repo:

    # Pull down user2's work
    $ git remote add user2 git://github.com/user2/git-workshop
    $ git remote fetch user2

    # Diff your master to user2's master
    $ git diff master..user2/master

    # Merge user2's changes
    $ git merge user2/master

    # Add your own change to README
    $ echo "from user1" >> README
    $ git commit -a -m "Updated the readme."

    # Push the changes to your user1 repo
    $ git push
{: class=brush:bash}

Second person, pull in user1's changes, and update your repo:

    # Pull down user1's work
    $ git remote add user1 http://github.com/user2/git-workshop.git
    $ git fetch user1

    # Diff against what they added
    $ git diff master..user1/master

    # Merge user1's changes
    $ git merge user1/master
    $ cat README

    # Push their changes out to your user2 repo
    $ git push
{: class=brush:bash}

Things To Add
-------------

* cherry-pick
* revert

