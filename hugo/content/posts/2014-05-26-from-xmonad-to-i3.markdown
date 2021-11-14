---
date: "2014-05-26T00:00:00Z"
section: Productivity
title: From xmonad to i3 on Ubuntu 14.04
---


For several years now, I've been a faithful user of [xmonad](http://xmonad.org/), the Linux tiling window manager that is written in Haskell but I just recently switched over to [i3](http://www.i3wm.org/).

(Update Dec 2016: I'm still using i3, and here are the links to my config files: [~/.i3/config](/files/i3-config.txt), [~/.config/i3status/config](/files/i3-status-config.txt), and [~/.Xresources](/files/Xresources.txt).

Why Move From xmonad?
---------------------

I really enjoyed xmonad, and want to still highly recommend it, but I consistently ran into two issues:

1. I consider myself an expert-level programmer, but even after years of using xmonad, I simply did not understand how my xmonad config file (which is a Haskell program) actually worked.
  
   Here is an example from my config file:

   ```haskell
   myKeys =
     [
       -- additional keys
     ]
     ++
     [ (mask ++ "M-" ++ [key], screenWorkspace scr >>= flip whenJust (windows . action))
       | (key, scr)  <- zip "wer" [2,0,1]
       , (action, mask) <- [ (W.view, "") , (W.shift, "S-")]
     ]
   ```

   This snippet of code maps the three shortcuts `Mod-w`, `Mod-e`, and `Mod-r` to my left, center, and right monitors, which unfortunately are not just magically in the right order when detected by machine at boot.

   I like to think I "get" functional programming--I know what `zip` does, I can guess that `++` is list concat...but otherwise the rest of this Haskell code is basically Greek to me.

   For several years I manged to use xmonad by copy/pasting and cargo culting code from other people's config files. But even trivial tasks, like "take snippet 1 and combine it with snippet 2", I just couldn't do.

   Eventually I resigned myself from "I'm sure I'll understand this soon..." to "...okay, this just isn't going to happen without a significant time investment".

2. xmonad just stopped working for Ubuntu 14.04

   xmonad has always been painful to setup, mostly due to my own admittedly personal preference of not running xmonad "bare bones", but as the window manager within a still-basically-Gnome environment.

   Basically, I still wanted the Gnome panel (which is the top/bottom bar in an OS window environment that has the wireless status, message notifications, etc.), and I wanted that primarily because (somewhat embarrassingly) unless the Gnome panel started, the Network Manager applet wouldn't start, and so my wireless wouldn't connect.

   Yes, I must admit that I am not, nor really want to be, 1337 enough to manage my wireless connection solely from the CLI.

   Previously that was fine, as I'd always been able to, eventually, get xmonad running within whatever Gnome environment was within Ubuntu (e.g. [Using xmonad in Gnome](http://www.haskell.org/haskellwiki/Xmonad/Using_xmonad_in_Gnome)), and was quite happy.

   In Saucy, the xmonad install was actually really slick--just `sudo apt-get install xmonad`, and then the LightDM login screen would give you a "Login with XMonad Gnome" (or something like that) option that, IIRC, just worked.

   But now for 14.04, it's back to just not working. I could probably figure it out, but Saucy spoiled me, and I now expect it to just work.

Tangent: Tried Lubuntu
----------------------

For Saucy, I had been using xmonad within [LXDE](http://lxde.org/) (because the Gnome 2 panel stopped working, so I switched to `lxpanel`, which provided the basic top/bottom bar applets), but I'd always used Xmonad after tweaking a stock Ubuntu that still had vestiges of Unity/etc. installed.

This time around, I'd just gotten a new, larger SSD, and so had an excuse to do a clean install of Ubuntu, instead of my regular Saucy -> Trusty in-place upgrade path.

So, I thought that would be a good excuse to try [Lubuntu](http://lubuntu.net/), which is built on top of LXDE, and from a clean install and skip the "bloat" of Unity/etc. all together. Super lightweight!

Good plans, but for whatever reason, it just didn't work out. For one, I was surprised at how different Lubuntu looked vs. stock LXDE. Granted, it was just theming.

However, the biggest issue was that xmonad still didn't "just work", even after changing the LXDE window manager from the default `openbox` to `xmonad`.

This had worked before, pre-14.04, but did not in Lubuntu.

So, I gave up on Lubuntu, and reinstalled the stock Ubuntu 14.04 as a clean install, but it *still* ran into the same problem of xmonad just not working.

Enter i3wm
----------

After many gyrations, I ended up installing [i3](http://www.i3wm.org/) and, so far, am very happy. For two reasons:

1. The config file is plain text!

   Here's a few lines from the my config file:

   ```
   # start a terminal
   bindsym $mod+Shift+Return exec i3-sensible-terminal

   # kill focused window
   bindsym $mod+Shift+c kill
   ```

   How readable!

2. It works out-of-the-box!

   After doing `sudo apt-get install i3`, LightDM shows a "Login with i3" option, and, the first time I logged in, `i3` even noticed I didn't have an i3 config file yet, so went through a few prompts to create a default one.

   And then it just worked. The `sudo apt-get install i3` was literally all it took. Amazing.

   (Notice how both of these are exactly the opposite of what I disliked about xmonad.)

3. As a bonus, i3 runs panel-less (so no futzing with Gnome/LXDE/etc.) but is still newbie-friendly because it includes a basic applet-friendly status bar out-of-the-box.

   Per before, I was never brave enough to run xmonad without a "basically Gnome" panel, and so always went to the pain of having the Gnome/LXDE panels available for the various applets/etc. This was always the most annoying part of getting xmonad setup.

   What real power users of xmonad use, instead of a panel, is a separate, non-Gnome/etc., "status bar" (like [xmobar](http://projects.haskell.org/xmobar/)), which sits in the same place as the panel, but differentiates itself by being primarily text-based, and super-extensible.

   Which, for xmonad, "super-extensible" meant "not there by default" which meant "intimidating for new users", so I never set one up.

   With i3, it runs panel-less (as in no heavyweight Gnome/LXDE/etc. panel), but has an out-of-the-box status bar ([i3status](http://i3wm.org/i3status/)) that "just works" and is sufficiently-configurable (plain text) that, for now, I see no reason to switch. 

4. As a bonus bonus, per [this post](http://www.brentwalther.net/blog/how-to-replace-unity-with-i3-window-manager-on-ubuntu-1204), I was even able to uninstall the Unity and Compiz packages.

   Granted, having them uninstalled doesn't really matter, given I wasn't using them anyway, but it's still fun.

I was quite pleased.

Tweaking i3
-----------

So, while i3 worked right out of the box, it has taken me a few days of playing with it to get familiar and tweak it to my liking. I've done a few customizations:

1. Tweaked the key bindings to be more like xmonad since that is what I like/am used to (especially for the common ones, like new terminal, kill window, etc.).

2. Added `nm-applet` to run on startup so I am not helpless:

   ```
   exec --no-startup-id nm-applet
   ```

3. Installed [`volnoti`](https://github.com/davidbrazdil/volnoti) to get the sexiest volume up/down setup I've had since switching to Linux

4. Tweaked fonts/sizes/etc. (I'm a fan of [Source Code Pro](https://github.com/adobe/source-code-pro) these days).

5. Discovered i3's [scratchpad](http://build.i3wm.org/docs/userguide.html#_scratchpad)--very awesome.

6. Turns out [dunst](http://www.knopwob.org/dunst/) is installed with i3 to handle DBus notifications, but the default theme is so minimal, even for me, that I didn't realize it was installed until I built dunst from source and it wouldn't start two instances at once.

   [This](http://www.knopwob.org/dunst/dunstrc.1.0.0-1) is a nice `dunstrc` to start from, and shows some of the nifty things it can do based on the content/etc. of the notifications.

Window resizing is still taking some getting used to. I liked xmonad's approach better, but that is probably because I still am not fully adjusted to i3 yet. I'd like to get the equivalent of `Mod-enter` == "switch current window into the main content area", but I don't think that's exactly how i3 works...there isn't really a "main" content area. Dunno, we'll see.

Various DPI Shenanigans
-----------------------

So, while i3 just worked, and I've spent an acceptable amount of time tweaking i3, I've spent an inordinate amount of time tweaking (or even finding) the stupid DPI settings for X/GTK/Linux/whatever--"stuff that goes on the screen".

I am admittedly slightly OCD about having the OS use my laptop's native 143 DPI (yes, it's not a MBP; although there are 200+ DPI ThinkPads out these days...).

Previously, I was in enough of a "mainstream" environment (those panels) that `gnome-tweak-tool`/etc. was enough to, AFAICT, throb the right hidden font/DPI settings.

But now that I'm in a more bare-bones environment, with no real master UI preferences/appearance control panel, it took quite a bit of fussing to get right, but I finally found what I believe is the magic incantation:

1. `~/.Xresources`

   This is the magic file that, AFAICT, is one of the main (?) DPI settings for (all/most?) programs:

   I have just one line in `~/.Xresources`:

   ```
   Xft.dpi: 143
   ```

   You'll know this is working if you can run:

   ```bash
   $ xrdb -query | grep dpi
   ```

   And see your configured DPI as the output.

   I had seen various posts about potentially configuring this as the LightDM-level, but I couldn't really understand if then it would apply to the LightDM X session, or any X session spawned by LightDM, or what.

2. `xrandr`

   While `~/.Xresources` was kind of hard to find, most forums/posts mention `xrandr` as the primary place to set your DPI:

   ```
   xrandr --dpi 143
   ```

   You can verify this by running:

   ```shell
       $ xdpyinfo | grep dots
   ```

   And you should again see your configured resolution.

   For me, I put this into my `~/.i3/config` file to run on login:

   ```
   exec --no-startup-id xrandr --dpi 143
   ```

   I believe editing an `X.org` config file (e.g. off in `/etc/X11/...`) is another, more permanent way to do this, but I've always been too scared of severely messing up my X11 config and never being able to log in again to mess with those.

3. GTK Settings

   These are not technically for DPI settings, but just general default fonts/sizes/etc.

   GTK2 and GTK3 have separate settings files:

   * `~/.gtkrc-2.0`
   * `~/.config/gtk-3.0/settings.ini`

   Which is annoying, but it turns out the LXAppearance tool will keep both up to date.

   However, I still don't really know where the system-wide (or toolkit-wide?) default monospace font is configured...

As a disclaimer, this works for me, and I'm happy with the size/display of my fonts, but I must admit I don't really know what's going on.

I don't know why `xrandr` has one DPI setting, and `.Xresources` has another. There could be several other DPI settings for all I know. There are likely other default font/size locations for Qt/KDE/etc.

This is just what works for me.

Must...Stop...Tweaking...
-------------------------

I've had a lot of fun over the last few days, getting i3 setup, and tweaking various parts of my environment. But for now I need to be done and satisfied.

At least until I go back to work and my desktop...which is still running xmonad.

Hopefully I can avoid driving myself crazy using both xmonad and i3 until I get a chance to switch the desktop over.



