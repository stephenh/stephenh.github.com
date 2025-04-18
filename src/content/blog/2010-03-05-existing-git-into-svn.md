---
title: Moving an existing git repo into svn
description: ""
date: 2010-03-05T00:00:00Z
tags: ["Productivity"]
---


I've found myself lately making local git repositories to prototype things that I later need to promote into [Bizo](http://www.bizo.com)'s internal Subversion repository.

`git-svn` supports this really well, with just a slight variation on the usual `git svn clone`.

Instead of the standard `project/trunk|branches|tags` we use a slightly different `parent/trunk|branches|tags/project` so you'll see I specify the `-T/-t/-b` flags.

git svn init
------------

Here is what I do, from the existing local git repo:

```bash
# Create the project directory in subversion
$ /usr/bin/svn mkdir
  https://foo.com/svn/parent/trunk/project
  -m "Make project directory."
Committed revision 200.

# Initialize git-svn, doesn't fetch anything yet
$ git svn init https://foo.com/svn/
  -T parent/trunk/project
  -t parent/tags/project
  -b parent/branches/project
  --prefix=svn/

# Set authors so we get prettier authors
$ git config svn.authorsfile ../authors

# Now pull down the svn commits
$ git svn fetch
W: Ignoring error from SVN, ...
W: Do not be alarmed at the above message git-svn ...
This may take a while on large repositories
r200 = (guid) (refs/remotes/svn/trunk)

# We should now see our svn trunk setup under our svn remote
$ git branch -av
* master            c3a7161 The latest git commit.
  remotes/svn/trunk 3b7fed6 Make project directory.

# Now we want to take all of our local commits and 
# rebase them on top of the new svn/trunk
$ git rebase svn/trunk
First, rewinding head to replay your work on top of it...
Applying: First git commit
Applying: The latest git commit

# Now we should see our local commits applied
# on top of svn/trunk
$ git lg
* 52b7977 (HEAD, master) The latest git commit
* a34e162 First git commit
* 3b7fed6 (svn/trunk) Make project directory.

# Everything is cool, push it back to svn
$ git svn dcommit
Committing to https://foo.com/svn/parent/trunk/project
...
```

--prefix=svn
------------

One flag I especially like lately, which you can also use with `git svn clone`, is `--prefix=svn/`.

This will prefix all of your tracking branches of the remote Subversion branches, tags, and trunk with `svn/`, making it look a whole lot like the usual `origin/` idiom used by regular git remotes.

With the tracking branches having a prefix, you can also use them as local branch names, e.g.:

```bash
# Name your copy of svn/trunk "trunk" instead of "master"
$ git checkout -b trunk master
Switched to a new branch 'trunk'

$ git branch -d master
Deleted branch master (was 33c3136).

$ git branch -av
* trunk             33c3136 Latest svn commit
* remotes/svn/trunk 33c3136 Latest svn commit
```

Then if you have other branches you want to track:

```bash
$ git checkout -b featurea svn/featurea
```

Almost Really Sweet
-------------------

Overly, I've been very pleased with `git-svn` over the last few years I've been using it.

My one regret is that `git-svn` will not push merges back to `svn`, so I have to break down and use the `svn` command line client to do that.

Surprisingly, Bazaar actually [writes back svn:mergeinfo](http://wiki.bazaar.canonical.com/BzrForeignBranches/Subversion), which I'm very jealous of. Assuming it works well, it's pretty nifty.

