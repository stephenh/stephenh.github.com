---
layout: post
title: One Click VNC
section: Productivity
---

{{page.title}}
==============

I did some of the usual family tech support over the Thanksgiving holiday, this time for a family member who lives in another state.

While the "issue" (too many icons in the IE favorites bar) was taken care of in short order, it seemed inevitable that something else would come up, and I was not looking forward to remote phone support.

Initially, I was quite willing to sign up for Fog Creek's Copilot program, but ran into two issues:

1. It seems geared towards on-the-fly support, with the "here, we'll email them a code and they can download it" approach.

   For my situation, that was too many steps--instead, I wanted to set it up on the remote computer ahead of time, for free, and then be able to use it for a nominal daily fee if ever needed.

   (Perhaps Copilot actually allows this, and I didn't RTFM, but...)

2. They don't support Linux.

   Um...wtf? All Fog Creek did was pay some intern to bundle a VNC client/server into Window EXEs, hook up some admittedly vary useful firewall poking scheme via their remote servers, and hey, they have a product.

   Which, fair enough, smart business execution...but Copilot *is* VNC and VNC is from the Linux ecosystem--so, seriously, just let me fire up TightVNC, even if on my end I have to, oh no, type in a crazy host name and port number. Whatever.

So, that led to an hour or so of poking around, before coming across exactly what I was looking for: [One-Click VNC](http://www.vncscan.com/vs/oneclickVNC.htm).

With One-Click VNC, you can setup the relative's computer a head of time, with a simple "here, when I tell you to, just click on this desktop icon".

When they click on it, One-Click starts a VNC server on their local computer, and then, via a config file, calls out to your computer's IP address, so your waiting VNC client can accept the incoming connection.

And, tada!, you see their screen. Awesome.

Note that the server establishing the connection is not how VNC normally works, but it's great as it means One-Click will poke a hole through the remote computer's firewall, NAT, ISP, etc.

Which leads to the only wrinkle--your VNC client won't have poked a hole in your firewall, it's just waiting for an incoming connection, so you pretty much have to have a static IP (since it is hard-coded in the One-Click config file) which can forward the One-Click 5500 port back to your machine.

Which, hey, I have a static IP, so good enough.

Getting this to work if you have a dynamic IP is left as an exercise to the reader, but leave a comment if you figure it out (other than "just use Copilot on a Mac").


