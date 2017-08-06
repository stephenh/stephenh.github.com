---
layout: post
title: Tools
---

{{page.title}}
==============

A misc collection of tools I find useful. WIP.

Key bindings
------------

Side stepping a flame war, whether you prefer vim bindings or Emacs bindings doesn't matter, but a professional programmer should pick one and use it as much as possible. Your job is basically editing text all day, and so you should be extremely proficient at it (I saw this first articulated in The Pragmatic Programmer).

E.g. if you pick vi bindings, use [vrapper](http://vrapper.sourceforge.net/home/) in Eclipse, and vi mode in bash, and vimium in Chrome. Get the same bindings in as many places as possible so you can reuse the muscle memory in as many places as possible.

If you use vim, learn vim macros. Get beyond just h/j/k/m.

Browsing
--------

* [Vimium](https://chrome.google.com/webstore/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb?hl=en) - vi bindings for forward/back/etc.
  * One previous feature I didn't realize at first was kind of a "search mode" for links, e.g. type `f` to switch to "search mode", start typing the text of the link you want to navigate, and vimium will incrementally match/highlight links, until you've got it narrowed down and can select one. This sounds tedious, but `f p u <enter>` are my 4 keystrokes for hitting the "Publish" button in a webapp.
* [wasavi](http://appsweets.net/wasavi/) - vi bindings in textboxes

Shell
-----

* [Fish shell](https://fishshell.com/) - a "modern" shell, has great autocomplete basically out-of-the-box
* Bash shell with vi + amazing control-k bindings
  * TODO: Publish my `.inputrc`/`.bashrc`/etc. 
* A fuzzy finder, e.g. [fzf](https://github.com/fisherman/fzf)
* tmux+mosh for remote sessions
* [ack](https://beyondgrep.com/) or [ripgrep](https://github.com/BurntSushi/ripgrep)

Misc OS Tools
-------------

* I'm a fan of tiling window manager, e.g. [i3](https://i3wm.org/)


