---
layout: post
title: git config
---

<h2>{{ page.title }}</h2>

I've got an enjoyable git environment set up, with various `.gitconfig`/etc. hacks. This is just a post to document those for my future self and others.

First, you should start with [git-sh](http://github.com/rtomayko/git-sh). It adds some bash shell customizations like a nice `PS1` prompt, tab completion, and incredibly short git-specific aliases. I'll cover some of the aliases later, but this is the thing that started me down the "how cool can I get my git environment" path.

I've included commented versions of my `.gitconfig` and `.gitshrc`, but you can get the raw versions [here](/files/gitconfig) and [here](/files/gitshrc).

Example Shell Session
---------------------

A lot of my customizations are around aliases, so this is a quick overview, and then the aliases are defined/explained below.

Here is a made up example bash session with some of the commands:

```bash
# show we're in a basic java/whatever project
$ ls
src/ tests/

# start git-sh to get into a git-specific bash environment
$ git sh

# change some things
$ echo "file1" > src/package1/file1
$ echo "file2" > src/package2/file2
$ echo "file3" > src/package3/file2

# see all of our changes
$ d
# runs: git diff

# see only the changes in package1
$ dg package1
# runs: git diff src/package1/file1

# stage any path with 'package' in it
$ ag package
# runs: git add src/package1/file1 src/package2/file2 src/package3/file3

# we only wanted package1, reset package2 and package3
$ rsg package2
# runs: git reset src/package2/file2
$ rsg package3
# runs: git reset src/package3/file3

# we wanted *some* of the changes in package3
$ agp package3
# runs: git add -p src/package3/file3

# see what we have staged now (only package1+some package3)
$ p
# runs: git diff --cached

# commit it
$ ci -m "Changed stuff in package1"
# runs: git commit -m "..."
```

That is the basic idea.

Most of the magic is from the `[alias]` section of `.gitconfig`, along with my `.gitshrc` allowing the `git` prefix to be dropped.

`.gitconfig`
------------

The `.gitconfig` file is in your home directory and is for user-wide settings.

Here is my current `.gitconfig` with comments:

```plain
[user]
  name = Stephen Haberman
  email = stephen@exigencecorp.com
[alias]
  # 'add all' stages new+changed+deleted files
  aa = !git ls-files -z -d | xargs -0 -r git rm && git ls-files -z -m -o --exclude-standard | xargs -0 -r git add

  # 'add grep' stages new+changed that match $1
  ag = !sh -c 'git ls-files -z -m -o --exclude-standard | grep -z $1 | xargs -0 -r git add' -

  # 'add updated grep' stages changed that match $1
  aug = !sh -c 'git ls-files -z -m | grep -z $1 | xargs -0 -r git add' -

  # 'add updated patch' stages changed that match $1 with add -p
  agp = "!sh -c \"git add -p `git ls-files -z -m -o --exclude-standard | grep -z $1 | tr '\\000' ' '`\" -"

  # 'checkout grep' checkouts any files that match $1
  cg = !sh -c 'git ls-files -z -m | grep -z $1 | xargs -0 -r git checkout' -

  # 'diff grep' diffs any files that match $1
  dg = !sh -c 'git ls-files -z -m | grep -z $1 | xargs -0 -r git diff -- ' -

  # 'patch grep' diffs any staged files that match $1
  pg = !sh -c 'git ls-files -z -c | grep -z $1 | xargs -0 -r git diff --cached' -

  # 'remove grep' remove any files that match $1
  rmg = !sh -c 'git ls-files -z -d | grep -z $1 | xargs -0 -r git rm' -

  # 'reset grep' reset any files that match $1
  rsg = !sh -c 'git diff --cached --name-only | grep $1 | xargs -r git reset HEAD -- ' -

  # nice log output
  lg = log --graph --pretty=oneline --abbrev-commit --decorate

  # rerun svn show-ignore -> exclude
  si = !git svn show-ignore > .git/info/exclude

  # start git-sh
  sh = !git-sh

  # rebase unpushed commits
  r= !git rebase --preserve-merges --interactive @{u}
[color]
  # turn on color
  diff = auto
  status = auto
  branch = auto
  interactive = auto
  ui = auto
[color "branch"]
  # good looking colors i copy/pasted from somewhere
  current = green bold
  local = green
  remote = red bold
[color "diff"]
  # good looking colors i copy/pasted from somewhere
  meta = yellow bold
  frag = magenta bold
  old = red bold
  new = green bold
[color "status"]
  # good looking colors i copy/pasted from somewhere
  added = green bold
  changed = yellow bold
  untracked = red
[color "sh"]
  branch = yellow
[core]
  excludesfile = /home/stephen/.gitignore
  # two-space tabs
  pager = less -FXRS -x2
[push]
  # 'git push' should only do the current branch, not all
  default = current
[branch]
  # always setup 'git pull' to rebase instead of merge
  autosetuprebase = always
[diff]
  renames = copies
  mnemonicprefix = true
[svn]
  # push empty directory removals back to svn at directory deletes
  rmdir = true
  # set svn:mergeinfo when pushing merge commits
  pushmergeinfo = true
[pull]
  # preserve merge commits when rebasing
  rebase = preserve
```

`.gitshrc`
----------

This is my `.gitshrc` file, heavily based off Ryan Tomayko's original.

Ryan's original comments are prefixed with `#`, I'll prefix my additions with `###`, most of which are aliases to my `[alias]` entries above and some `git-svn` aliases.

```bash
#!/bin/bash
# rtomayko's ~/.gitshrc file
### With additions from stephenh

# git commit
gitalias commit='git commit --verbose'
gitalias amend='git commit --verbose --amend'
gitalias ci='git commit --verbose'
gitalias ca='git commit --verbose --all'
gitalias  n='git commit --verbose --amend'

# git branch and remote
gitalias  b='git branch -av' ### Added -av parameter
gitalias rv='git remote -v'

# git add
gitalias  a='git add'
gitalias au='git add --update'
gitalias ap='git add --patch'
### Added entries for my .gitconfig aliases
alias aa='git aa' # add all updated/new/deleted
alias ag='git ag' # add with grep
alias agp='git agp' # add with grep -p
alias cg='git cg' # checkout with grep
alias dg='git dg' # diff with grep
alias pg='git pg' # patch with grep
alias rsg='git rsg' # reset with grep
alias rmg='git rmg' # remove with grep

# git checkout
gitalias c='git checkout'

# git fetch
gitalias f='git fetch'

# basic interactive rebase of last 10 commits
gitalias r='git rebase --interactive HEAD~10'
alias cont='git rebase --continue'

# git diff
gitalias d='git diff'
gitalias p='git diff --cached'   # mnemonic: "patch"

# git ls-files
### Added o to list other files that aren't ignored
gitalias o='git ls-files -o --exclude-standard'    # "other"

# git status
alias  s='git status'

# git log
gitalias  L='git log'
# gitalias l='git log --graph --pretty=oneline --abbrev-commit --decorate'
gitalias  l="git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset' --abbrev-commit --date=relative"
gitalias ll='git log --pretty=oneline --abbrev-commit --max-count=15'

# misc
gitalias pick='git cherry-pick'

# experimental
gitalias mirror='git reset --hard'
gitalias stage='git add'
gitalias unstage='git reset HEAD'
gitalias pop='git reset --soft HEAD^'
gitalias review='git log -p --max-count=1'

### Added git svn asliases
gitalias si='git si' # update svn ignore > exclude
gitalias sr='git svn rebase'
gitalias sp='git svn dcommit'
gitalias sf='git svn fetch'

### Added call to git-wtf tool
gitalias wtf='git-wtf'
```

Since I defined most of the interesting aliases in the `.gitconfig` `[alias]` section, it means they're all usable via `git xxx`, e.g. `git ag foo`, but listing `alias ag='git ag'` in `.gitshrc` means you can also just use `ag foo`, assuming you've started the `git-sh` environment.

It results in some duplication, but means they're usable from both inside and outside of `git-sh`, which I think is useful.

That's It
---------

Leave comments if you have any similar hacks/links/etc.


