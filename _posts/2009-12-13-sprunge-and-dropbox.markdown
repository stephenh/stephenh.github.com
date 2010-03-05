---
layout: post
title: Sprunge And Dropbox
---

Sprunge And Dropbox
===================

Just a quick post on [Sprunge](http://sprunge.us) and [Dropbox](http://dropbox.com).

Sprunge Rocks
-------------

If you haven't used it yet, [sprunge.us](http://sprunge.us) rocks.

It's a CLI-friendly paste bin.

So, say you have some log file/snippet/whatever, off on your headless server, and you'd like your coworkers to take a look at it. Assuming you don't have sensitive information in it, Sprunge makes this trivial:

    curl -F 'sprunge=@somefile.txt' sprunge.us
{: class=brush:bash}

This uses `curl` to do an HTTP POST to `http://sprunge.us` with a multi-part form containing `sprunge=<the contents of somefile.txt>`.

In the response, Sprunge will give you a unique URL that you can then send to your coworkers for them to check out (e.g. something like [http://sprunge.us/IdhX](http://sprunge.us/IdhX)).

Note if you don't want all of `somefile.txt`, you can also use `stdin`, e.g.:

    cat somefile.txt | grep ERROR | curl -F 'sprunge=&lt;-' sprunge.us
{: class=brush:bash}

Being CLI-friendly is Sprunge's main act--it doesn't have much else, e.g. no syntax highlighting, commenting, whatever. But for what I've used it for, sharing snippets of files, it works just great.

Speaking of which...

Dropbox CLI Upload
------------------

I can't give Dropbox too much crap, because I only have a free account, but I wanted to get a file from a headless server into their system today and finally gave up.

To their credit, they have a Linux [download](https://www.dropbox.com/downloading?os=lnx), but it involves running a proprietary daemon plus an open source Nautilus extension.

Which I'm sure is exactly what you want for 2-way sync, normal Dropbox awesomeness, but it really sucks when all I want to do is drop a backup file up there and be done with it.

So, riffing on Sprunge, I'd like to be able to do:

    curl -F 'data=@somefile.bin' -F 'name=myfolder/somefile.bin' -u me:password https://dropbox.com
{: class=brush:bash}

This would use basic auth to identify me, but that's fine given the connection is over HTTPS anyway.

This command may not be something users could type off the top of their head, but it'd be easy to script for automating uploads/backups/etc.

So, for now I'll continue with a manual `scp` download to my laptop and then use a browser to upload the file back into Dropbox. It's nothing too important/frequent, so it'll be fine for now.

