---
layout: post
title: Tools
---

{{page.title}}
==============

A misc collection of tools I find useful. WIP.

I had a more lengthy introduction, but moved it to it's own post: [Tools, Productivity, and Investing in Yourself](/2017/08/12/tools-productivity-investing.html).

Key bindings
------------

Side stepping a flame war, whether you prefer vim bindings or Emacs bindings doesn't matter, but in my opinion all professional programmers should pick one or the other and then use your preferred bindings as much as possible.

Your job is basically editing text all day, and so you should be extremely proficient at it (as attribution, I saw this first articulated in [The Pragmatic Programmer](https://www.amazon.com/dp/020161622X)).

Once you pick one (either vi or emacs), then try to use those bindings everywhere, e.g. if you pick vi bindings, use [vrapper](http://vrapper.sourceforge.net/home/) in Eclipse, and vi mode in bash/readline [here](https://github.com/stephenh/config/blob/master/.inputrc#L2), and vimium in Chrome. Get the same bindings in as many places as possible so you can reuse the muscle memory in as many places as possible.

Also learn more than just the basic movements, e.g. if you use vim, learn vim macros. Get beyond just h/j/k/m.

Browsing
--------

* [Vimium](https://chrome.google.com/webstore/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb?hl=en) - vi bindings for forward/back/etc.
  * One semi-hidden feature is a "search mode" for links, e.g. type `f` to switch to "search mode", start typing the text of the link you want to navigate (e.g. if you want to click the Login button, start typing "log"), and vimium will incrementally match/highlight links, until you've got it narrowed down and can select one. This sounds tedious, but `f p u <enter>` are my 4 keystrokes for hitting the "Publish" button in a webapp.
* [wasavi](http://appsweets.net/wasavi/) - vi bindings in textboxes
* [Quick Tabs](https://chrome.google.com/webstore/detail/quick-tabs/jnjfeinjfmenlddahdjdmgpbokiacbbb?hl=en) - Chrome plugin that maps "Alt + o" (or that is what I set the binding to) to open a quick list of your open tabs, so you can switch from tab 20 to tab 3 by typing "Alt + o + (title of tab 3)". It does incremental search + fuzzy matching. 

Shell
-----

* [Fish shell](https://fishshell.com/)
  * I switched to this in 2017 and prefer it over bash, great autocomplete out-of-the-box
* Bash shell
  * See my [.bashrc](https://github.com/stephenh/config/blob/master/.bashrc) and [.inputrc](https://github.com/stephenh/config/blob/master/.inputrc) for various customizations I setup over the years, e.g. for vi bindings + control-j/k/incremental history search
* A fuzzy finder, e.g. [fzf](https://github.com/junegunn/fzf)
  * You can/should hook this into bash/[fish](https://github.com/fisherman/fzf)/vim, which once hooked up, was described by one programmer I work with as "life changing"
  * Note: To get fish-fzf and fish-vi-mode ot play nicely, I have a few lines in my [config.fish](https://github.com/stephenh/config/blob/master/.config/fish/config.fish#L23)
* [tmux](https://tmux.github.io/)+[mosh](https://mosh.org/) for remote sessions
  * See my [.tmux.conf](https://github.com/stephenh/config/blob/master/.tmux.conf) for various customizations
* [ack](https://beyondgrep.com/) or [ripgrep](https://github.com/BurntSushi/ripgrep) for search in files

Version Control
---------------

* git
  * See my git setup post [here](/2010/03/04/git-config.html) and then latest config [here](https://github.com/stephenh/config/blob/master/.gitconfig)
  * Great article on [using rebase for a clean repository](https://mtyurt.net/2017/08/08/git-using-advanced-rebase-features-for-a-clean-repository/)

Misc OS Tools
-------------

* I'm a fan of tiling window manager, e.g. [i3](https://i3wm.org/)


