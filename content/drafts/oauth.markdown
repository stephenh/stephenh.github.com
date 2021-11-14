---
layout: draft
title: Intuitive Understanding of OAuth
section: Architecture
---

{{page.title}}
==============

I was reading OAuth specs lately and, to help me actually remember/reason about it, wanted to jot down my in-theory intuitive explanation.

Tangentially, to my recollection, OAuth2 is pretty nice/simple compared to OAuth1, since we can assume HTTPS.

So, OAuth2 is always two steps (assuming the auth code grant type, which is all I care about).

Why two steps?

(Step 1 is `https://cloud.digitalocean.com/v1/oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=CALLBACK_URL&scope=read`)

The 1st step (user's device to the user's identity server) is "only send the auth code to a trusted location".

E.g. the identity server only gives the auth code to a trusted location (the `redirect_uri`, although technically on an untrusted channel, e.g. the user's user agent) via an HTTP redirect, which is trusted b/c it was pre-registered with client id-specific redirect URI prefix.

This gives the application a chance to say "no, this wasn't me" (e.g. someone else is trying to use their client id, but can't because the redirect doesn't go to an attacker-controlled location).

(Note that technically the user's user agent sees the auth code come back, but we have to assume a trusted user agent--kind of, at least for the auth code, the token will be exchanged out-of-band, except for mobile devices, see RFC 3676.)

(Step 2 is `https://cloud.digitalocean.com/v1/oauth/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=CALLBACK_URL`)

The 2nd step (browser or client server) is "give me the token once for the auth code, once I prove I'm the client (that made the first request)". And only via a trusted back-channel, instead of directly to the user's (potentially compromised) device.

For server-based integrations, "prove I'm the same application from step 1" is a pre-shared client secret that matches the client id.

For mobile apps, "prove I'm the same application from step 1" is a once-time hash sent only with the 1st request that, even if the 1st request was observed on the mobile stack, malicious observers wouldn't know the one-time secret used to make the hash (RFC 3676).

---

JWT tokens are just signed JSON (with optional expiry in the body).

This is just like b360's secure cookies, which were signed and expired, but standardized with known key/value pairs for issuer, expiration, etc.


