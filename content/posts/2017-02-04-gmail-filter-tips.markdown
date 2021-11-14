---
date: "2017-02-04T00:00:00Z"
section: Productivity
title: Gmail Filter Tips
---


It took me awhile to give up my local/desktop e-mail client ([Claws](http://www.claws-mail.org/) was my last refuge), but I now use gmail like everyone else.

That said, I still have some habits from a desktop-, yes-I-said-it-Outlook-style workflow, which is using a lot of folders.

In gmail these are called labels, and are basically the same thing.

For example, I'll have a "lists" label for the main email lists I'm on, a "reviews" label for code review notifications, a "jira" label for Jira updates, etc.

Here's a screenshot of my current filters:

<img src="/images/gmail-labels.png" width="200" border="0" style="margin-left: 4em; display:block">

No, I'm not at inbox zero.

Pros/Cons of Labels
-------------------

Some people avoid folders/labels all together, which is just fine, as I'm sure there are good things about that approach. In particular, it seems more inline with inbox zero, which is a solid approach to email processing.

But personally I like the folder-based approach, primarily for batch processing. E.g. when I decide to focus on code reviews, I can work through that label, and stay in that mindset for a dedicated chunk of time.

Granted, a downside of batch processing is that if I either accidentally or semi-purposefully go awhile without focusing on a given label, then a big backlog can build up, and I'm likely to get behind on replying to things that I should be on top of.

Gmail's Filter Quirks
---------------------

So, assuming you are going to use labels, the key is to have filter rules that automatically categorize your incoming mail. E.g. any code review notifications get the "reviews" filter applied, etc.

No big deal, gmail supports filter rules, as has Outlook, Claws, and basically every other email client.

However, there are two quirks about gmail's filters that stymied my initial attempts to setup non-trivial rules:

1. There is no "stop" command
2. Editing filters manually in gmail automatically changes their order

I'll briefly touch on both.

No stop command
---------------

The concept of a "stop" command is useful when you have email that would match multiple rules, but you only want to apply a single one (typically the first).

For example, I might have:

1. Code review emails to team A, apply "reviews-a"
2. Code review emails directly to me (but not also team A), apply "reviews-mine"

E.g. email notifications that are to *both* team A and me, I want to just keep in "reviews-a".

Typically in non-gmail email clients, this is done by appending a "stop" command to the 1st rule (e.g. after the "move to 'reviews-a' folder" command), so that any subsequent rules are skipped.

However, gmail doesn't allow this.

So, the trick/hack is to just use negative filters on the subsequent rules to get the same affect as stopped processing, e.g.:

1. `subject:(code review) to:team-a, apply reviews-a`
2. `subject:(code review) to:me -label:reviews-a, apply reviews-mine`

Specifically, the 2nd rule has a negative filter, `-label:reviews-a` (or `-to:team-a` would work as well), which means it won't apply to any email that also matches the 1st rule.

This hack is really not that complicated, and it is tedious to keep the additional negative filters updated in each subsequent potentially-matching rule, but, at the end of the day, it is an effective way to work around the lack of a "stop" command.

That said, an extension of this tip that makes it less verbose/more resilient is to leverage that the 1st rule can apply the `shouldArchive` command, which will remove the `inbox` label (most of my filter rules do this anyway, as skipping the inbox is, for me, the point of using filters).

This means that your 2nd rule can, instead of a negative filter on a previous specific filter (e.g. `label:reviews-a`, which is somewhat brittle), it can add a positive filter, `label:inbox`, that is very generic, to effectively mean "only touch mail that has not already been touched/categorized by a rule before me".

And so then as long as your rules are in the order you like, you've effectively made an ad hoc "stop command".

I think the most-cute thing I use this for is my "noise" label, which is "any email that I get, that is not directly addressed to me *and* not already touched by a previous filter, take out of my inbox, and apply the noise label". These typically end up being organization-wide announcements, none of which are time critical, that I can then batch process when I'm bored/low-energy. (See below for my noise label definition.)

So, great, we have a "stop" ability, however, that leads us to the 2nd wrinkle.

Editing Filters Changes Their Order
-----------------------------------

With the above hack, order of filters becomes important. 

However, frustratingly, each time you edit a filter in the gmail UI, the updated filter moves to the bottom of the filter list, which messes up your order.

So if you want to keep your filters in deterministic order, each time you edit one in the UI, you have to fake-edit the others, in a very specific order, to get your desired order back. This is fine with 2 or 3 filters, but becomes impossible with 10+.

Fortunately, there is a trick, which is to not use the gmail UI at all, and instead bulk import/export your filters as XML files.

This is a little clunky, because you have to:

* Make your change in your local `filters.xml` file
* Select all your existing filters in gmail UI, delete them
* Upload your updated `filters.xml` filter, import them all

Your filters will then be in the same order as they are in the `filters.xml` file, and any nuances you have about filter order will work.

Although an upshot of this is that, since you now have a `filters.xml` file locally, you can check it into your home directory git repository, and have it for easy diffing/backup.

Example Filter File
-------------------

If you start out exporting your existing filters from the gmail UI, the exported XML file is rather ugly and verbose, e.g. it has a lot of long/random looking ids that seem like maybe they are important.

But it turns out many of them are not needed, so eventually I removed the unnecessary cruft, and now have a fairly clean `filters.xml` file that I can easily read and maintain.

Here is a trimmed-down example of my current work-related `filters.xml`. I deleted most of the labels, and just kept a few basic examples of jira, an email list, an email list that I shouldn't be on, a few review labels, and then my last catch-all noise filter.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:apps="http://schemas.google.com/apps/2006">
  <author>
    <name>Stephen Haberman</name>
    <email>shaberman@linkedin.com</email>
  </author>

  <!-- jira -->
  <entry>
    <category term="filter"></category>
    <title>jira</title>
    <apps:property name="from" value="jirapp"/>
    <apps:property name="label" value="jira"/>
    <apps:property name="shouldArchive" value="true"/>
  </entry>

  <!-- lists -->
  <entry>
    <category term="filter"></category>
    <title>lists - support</title>
    <apps:property name="to" value="...support...@linkedin.com"/>
    <apps:property name="label" value="support"/>
    <apps:property name="shouldArchive" value="true"/>
  </entry>

  <!-- lists - trashed -->
  <entry>
    <category term="filter"></category>
    <title>trash - old support</title>
    <apps:property name="hasTheWord" value="to:...@linkedin.com -to:(me OR shaberma@linkedin.com)"/>
    <apps:property name="shouldTrash" value="true"/>
  </entry>

  <!-- reviews -->
  <entry>
    <category term="filter"></category>
    <title>reviews - team-a</title>
    <apps:property name="hasTheWord" value="subject:(&quot;review request&quot;) to:(team-a-reviewers@linkedin.com)"/>
    <apps:property name="label" value="reviews-team-a"/>
    <apps:property name="shouldArchive" value="true"/>
  </entry>
  <entry>
    <title>reviews - noise</title>
    <apps:property name="hasTheWord" value="subject:(&quot;review request&quot;) -label:reviews-team-a"/>
    <apps:property name="label" value="reviews-noise"/>
    <apps:property name="shouldArchive" value="true"/>
  </entry>

  <!-- noise -->
  <entry>
    <category term="filter"></category>
    <title>noise</title>
    <apps:property name="hasTheWord" value="label:inbox -to:(shaberma OR me OR my-team@linkedin.com)"/>
    <apps:property name="label" value="noise"/>
    <apps:property name="shouldArchive" value="true"/>
  </entry>
</feed>
```

Ease of Sharing
---------------

A final aspect of using the `filters.xml` approach is that it makes sharing filters really easy.

E.g. when a new member joins the team, you can share either your personal or a sort of "team-defaults" `filters.xml` that handles the common email lists, alert lists, code review lists, etc., that everyone on the team is on.

This way the new member will have a head start on an organized approach (assuming they want to use a label-based approach, again per personal preference), vs. dealing with a deluge of email and having to just figure it out as they go.

In this vein, if anyone at LinkedIn is interested in my full `filters.xml` file (which is engineer-biased, e.g. filters GCNs, autoalerts, etc.) feel free to reach out.

