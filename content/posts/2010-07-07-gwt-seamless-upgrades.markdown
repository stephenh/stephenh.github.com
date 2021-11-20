---
date: "2010-07-07T00:00:00Z"
categories:
  - GWT
title: GWT Seamless Deployments
---

I'm deploying a GWT app on Amazon's EC2 architecture behind an ELB and wanted to ensure the best experience for users while pushing out new code updates.

This is a short review of my most-likely-accurate findings. It is not well organized and basically a public mind dump vs. a private mind dump to my other team members.

RPC Key Points
--------------

I'm not going to review GWT RPC in detail, but the basic points for us are:

* GWT automatically serializes Java objects to/from JavaScript objects
* GWT on the server-side will serialize/deserialize:
  1. Anything that implements GWT's `IsSerializable` marker interface
  2. Anything that implements Java's `Serializable` *and* is in a serialization policy file (see this [faq entry](http://code.google.com/webtoolkit/doc/latest/FAQ_Server.html#Does_the_GWT_RPC_system_support_the_use_of_java.io.Serializable) for more details)
* GWT on the client-side will serialize/deserialize any type it knew about at compile-time

A Typical RPC Request
---------------------

Here's what a typical RPC request might look like:

```plain
POST https://app.com/gwtapp/dispatch
Content-Type: text/x-gwt-rpc; charset=UTF-8
Origin: https://app.com
Referer: https://app.com/gwtapp/361924868514EB67231B0C48DC4B136A.cache.html
X-GWT-Module-Base: https://app.com/gwtapp/
X-GWT-Permutation: 361924868514EB67231B0C48DC4B136A

<serialized-objects-here>
```

The interesting thing to notice is the `X-GWT-Permutation` header--this is the strong name (hash) of the browser/locale/etc. code base the client is currently running.

Case 1: Old Client, New Server
------------------------------

When an old client sends an RPC request to a new server, we would ideally like to fulfill it as long as we haven't changed the contract of the RPC service it's interacting with.

GWT's deserialization execution flow for an old request is something like:

1. Read in the `X-GWT-Permutation` header
2. Try to load the serialization policy file based on the permutation header--*however,* this will fail because this is a new server that does not have the old serialization policy file
3. Fall back on `LegacySerializationPolicy` where only `IsSerializable` can be deserialized

For this reason, it's important to still use the old `IsSerializable` marker interface even though GWT now supports Java's `Serializable`.

Also, type name elision cannot be used because it also relies on the serialization policy file.

Then, assuming the RPC contract is the same, everything should still work.

If the RPC contract does change, i.e. the old client tries to use changed/removed functionality, they will get an [IncompatibleRemoteServiceException](http://google-web-toolkit.googlecode.com/svn/javadoc/2.0/com/google/gwt/user/client/rpc/IncompatibleRemoteServiceException.html) which the GWT client-side code should handle and prompt the user to reload the application.

One additional wrinkle is code split points. If an old client tries to load part of the application it does not have yet, it will use the old code base name, which is no longer on the new server. The client-side `GWT.runAsync` will fail with a 404 and the application should prompt the user to reload. (See [AsyncSplit](https://android.git.kernel.org/?p=tools/gerrit.git;a=blob;f=gerrit-gwtui/src/main/java/com/google/gerrit/client/Dispatcher.java;h=7db92ad17911eb52e9b078c127906adaaa74f3dc;hb=HEAD#l375) for how gerrit handles this.)

Case 2: New Client, Old Server
------------------------------

The same scenario above can happen here, when the client has a newer serialization policy strong name than the old server, so the old server falls back to the `LegacySerializationPolicy`.

However, an added wrinkle is the application bootstrapping process.

A client might:

1. Request `/app.html` and get served by either a new or old server (fine so far)
2. Request `/app/module.nocache.js` and get served by a new server--this is the GWT bootstrapping code and, based on the user's browser/locale/etc. combination, it tells the browser to load `new-permutation-name.cache.html`
3. Request `/app/new-permuation-name.cache.html`, *however*, this request gets served by an old server that only has the old application files
4. Client gets a `404` and the application bootstrapping stops

I currently know of no way to recover from this scenario. Because the error happens in between the GWT bootstrapping code and your application code, there is not a way for your application code to detect what has happened and recover.

**Update:** Thanks for Sripathi Krishnan for pointing out the [`gwt:onLoadErrorFn`](http://groups.google.com/group/google-web-toolkit/browse_thread/thread/2dafc6fd50e622a4) function where you can prompt the user to reload their browser to recover from this scenario.

For this reason, it's very important to have a clean switch from old to new versions--no old servers should be serving requests once new servers have come online.

Summarizing
-----------

Based on my current understanding, to service both old and new clients during a GWT upgrade as elegantly as possible, you should:

* Use `IsSerializable` and no type name elision in the RPC DTOs
* Handle `IncompatibleRemoteServiceException` in the RPC `AsyncCallback`s
* Handle 404's in the `runAsync` `onFailures`
* Minimize/eliminate the window when both old and new servers are available

Any corrections, feedback, etc., is appreciated.

