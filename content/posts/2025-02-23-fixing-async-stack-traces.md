---
date: "2025-02-23T00:00:00Z"
title: Fixing Async Stack Traces
categories:
  - TypeScript
---

Given the massive improvements in Node's/JavaScript's async story since the callback-hell days of 2010 (i.e. promises and the async/await keywords), I have generally assumed things like async stack traces were a solved problem.

However, when prototyping [Joist](https://joist-orm.io/) support for the [postgres.js](https://github.com/porsager/postgres) database driver (which I hope to be faster than the old-school [pg](https://node-postgres.com/) driver due to postgres.js's statement pipelining support), I was faced with surprisingly unhelpful stack traces, like:

```
PostgresError: syntax error at or near ")"
    at ErrorResponse (/home/stephen/joist-orm/node_modules/postgres/cjs/src/connection.js:790:26)
    at handle (/home/stephen/joist-orm/node_modules/postgres/cjs/src/connection.js:476:6)
    at Socket.data (/home/stephen/joist-orm/node_modules/postgres/cjs/src/connection.js:317:9)
    at Socket.emit (node:events:507:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Socket.Readable.push (node:internal/streams/readable:390:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23)
```

This trace correctly reports the syntax error, but there is no indication of "who called this" / "who caused this", which in a large/complicated codebase or test run can be infuriating to not know where to begin debugging the issue.

I was kind of dumbfounded that such a bad DX could still happen in 2025, so I started digging.

*Disclaimer*: this is a longer post, documenting what I learned, but it **does not have any novel solutions**--I'm just explaining how prior-art fixes like [this node-pg fix](https://github.com/brianc/node-postgres/pull/2983) work, and most off-the-shelf libraries like node-pg & postgres.js already have these fixes integrated. :tada:

## Root Cause: JavaScript is Non-Blocking

Before diving into the fix, it's helpful to understand why Node/JavaScript has this quirk ("default terrible" stack traces), where the old-school Java, C#, etc. languages generally do not.

The reason is JavaScript's single-threaded, **non-blocking** programming model.

In a traditional language, as we make nested function calls, i.e. `foo` calls `bar` calls `zaz`, not only does each function get added to the stack (good), but if one of them **blocks on I/O**, i.e. `zaz` makes a call to the database that needs to wait for the response (i.e. **it pauses**), all the functions stay "on the stack"--the whole stack is kept as-is, in-memory, until the operating system
(red threads) or the language runtime (green threads) resumes the stack when the I/O is complete.

This is great, because if an error happens "after making the database call", when the `new Error("invalid sytnax")` constructor is called, the stack trace naturally has the calling methods (`foo` and `bar` and `zaz`) still on the stack--which is great for debugging!

The wrinkle for JavaScript is that term "blocking"--having been conceived in the UI world, JavaScript is fundamentally non-blocking: no function is ever allowed to pause, because a pause in a UI thread means "the UI is completely frozen", waiting for the blocking call to complete. Which is a terrible user experience.

Instead of pausing, JavaScript functions that "make a database call" are actually doing three things:

1. Telling the I/O library to make the wire call
2. Telling the run loop what to do *later* when the response comes back
3. Immediately returning

All these steps are very fast, i.e. they are **synchronous** and happen immediately (**no pauses**), which is why the async model works well for UI programming--the UI generally doesn't freeze.

However, it is this step 2 that "breaks our stack traces", because when running code like:

```ts
function foo() {
  return bar();
}
function bar() {
  return zaz();
}
function zaz() {
  return makeDatabaseCall().then(rows => {
    console.log("Got some data", rows.length)
  }).catch(err => {
    console.log("Something bad", err.message);
  });
}
foo();
```

These steps look like:

1. `foo` calls `bar` calls `zaz` calls `makeDatabaseCall`
   * This initiates a wire call to the db (but does not wait/block on it)
2. The `.then` and `.catch` callbacks are registered to "run later"
   * This is our "what to do with the good & bad responses", respectively, logic
3. `zaz` immediately returns, and `bar` and `foo` are all removed from the stack

Now, what happens when the database call fails?

Our `.catch` callback is called with the error, but **called by who?** I.e. what is the callstack?

Who called the `.catch` callback looks like:

1. The Node internal TCP library gets the DB wire response
2. The database driver recognizes this as "failed" and creates a `new Error("invalid syntax")`
3. The driver rejects the `makeDatabaseCall` promise
4. Our `.catch` callback is invoked

There's the problem: the `new Error` object was created in step 2, but none of "our code", whether `foo`, `bar`, `zaz`, or *even the `.catch` callback's lambda*, are on the stack!

This is why, without "fixups", the default state of async stack traces is "basically terrible".

So how do we fix this?

## Core Idea: Appending Stacks

We'll get to the examples section next, which will show the "default terrible" stack traces, and then progressively fix them up.

The key fix that we'll use is realizing when we "our code" is active again (i.e. we've hit a `.catch` callback, in the step 4 above), and appending "our stack" to the existing error object.

```ts
// err is the Error created by the database driver, without any of "our code" in its stack
// dummyErr is an Error created by "our code", solely to get our trace
export function appendStack(rawError, dummyErr) {
  if (err && typeof err === "object" && "stack" in err) {
    err.stack += dummyErr.stack.replace(/.*\n/, "\n");
  }
  return err;
}
```

With this `appendStack`u tility available, let's get to the examples.

## Example: allAwaitsSync

Starting with the simplest example I could think of, we're not going to even use a database driver, and instead chain a series of async functions (i.e. `foo` calls `bar` which calls `zaz`), have the 3rd one (`zaz`) fail, and see what happens:

```ts
async function allAwaitsSync() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    throw new Error("oops");
  }
  await foo();
}
```

Stacktrace:

```
Error: oops
    at zaz (file:///home/stephen/joist-orm/stacks.mjs:9:11)
    at bar (file:///home/stephen/joist-orm/stacks.mjs:6:11)
    at foo (file:///home/stephen/joist-orm/stacks.mjs:3:11)
    at allAwaits (file:///home/stephen/joist-orm/stacks.mjs:11:9)
    at file:///home/stephen/joist-orm/stacks.mjs:156:11
    at ModuleJob.run (node:internal/modules/esm/module_job:268:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:543:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)

```

This seems good! We see all three of `foo` -> `bar` -> `zaz` in the trace.

However, we're cheating by throwing the `Error` immediately within the `zaz` function--this has kept all the functions as synchronous/immediately invoked, so when `new Error` is called, of course they're all still on the stack.

Which is good to know as a baseline, but let's move on.

## Example: allPromisesSync

Before resolving our "immediately failing is kind of cheating" issue, here's an example that uses raw Promises instead of async/await:

```ts
function allPromisesSync() {
  function foo() {
    return bar();
  }
  function bar() {
    return zaz();
  }
  function zaz() {
    // Using `function handle` instead of a lambda to get "handle" in the stack trace
    return new Promise(function handle(resolve, reject) {
      reject(new Error("oops"));
    });
  }
  return foo();
}
```

Stacktrace:

```
Error: oops
    at handle file:///home/stephen/joist-orm/stacks.mjs:22:52
    at new Promise (<anonymous>)
    at zaz (file:///home/stephen/joist-orm/stacks.mjs:22:12)
    at bar (file:///home/stephen/joist-orm/stacks.mjs:19:12)
    at foo (file:///home/stephen/joist-orm/stacks.mjs:16:12)
    at allPromises (file:///home/stephen/joist-orm/stacks.mjs:24:10)
    at file:///home/stephen/joist-orm/stacks.mjs:156:11

```

This still looks good!

Initially, I was surprised Node handled this well, but in retrospect it's for the same reason--when `new Promise` is called, it *immediately* invokes the `handle` function, so again when `new Error` is called, the entire `foo` -> `bar` -> `zaz` -> `handle` chain is still on the stack.

We still don't have any async behavior, so let's introduce that next.

## Example: allAwaitsTimeout

Now, instead of *immediately* failing (i.e. synchronously calling `reject`), we'll wait to reject our promise from a "different context", specifically a `setTimeout` callback.

This is how real I/O calls work: after asking the database to "please do something" (sending the request), our app just stops for a little bit, and waits for the callback to be invoked with the database's response.

```ts
// Emulates a wire call to the database returning an error
function badDatabaseCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("oops")), 50);
  });
}

// zaz makes the wire call and returns its soon-to-be-rejected Promise
async function allAwaitsTimeout() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    return badDatabaseCall();
  }
  await foo();
}
```

Stacktrace:

```
allAwaitsTimeout
Error: oops
    at Timeout._onTimeout (file:///home/stephen/joist-orm/stacks.mjs:36:31)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
```

Oh--that's not great. This is exactly the unhelpful stack trace we're trying to prevent.

Even using `await`s for our `foo` -> `bar` -> `zaz` chain did not help.

But we've reproduced the issue, and now can work on fixing it.

## Example: allAwaitsTimeoutAppend

Here we finally use the `appendStack` utility to fixup the stack trace:

```ts
async function allAwaitsTimeoutAppend() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    // Using `function zaz` instead of a lambda to get `zaz` into the trace
    return badDatabaseCall().catch(function zaz(err) {
      // Back in "our code" so call `appendStack` to get the fixup
      throw appendStack(err, new Error());
    });
  }
  await foo();
}
```

Stacktrace:

```
Error: oops
    at Timeout._onTimeout (file:///home/stephen/joist-orm/stacks.mjs:70:31)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/joist-orm/stacks.mjs:72:30)
    at async bar (file:///home/stephen/joist-orm/stacks.mjs:66:5)
    at async foo (file:///home/stephen/joist-orm/stacks.mjs:63:5)
    at async allAwaitsTimeoutAppend (file:///home/stephen/joist-orm/stacks.mjs:75:3)
    at async file:///home/stephen/joist-orm/stacks.mjs:160:5
```

We've got it!

We can see the `foo` -> `bar` -> `zaz` -> `onTimeout` progression.

## Example: allPromisesTimeoutAppend

Since the `appendStack` worked so well for our async functions, let's try it with our raw Promises example:

```ts
function allPromisesTimeoutAppend() {
  function foo() {
    return bar();
  }
  function bar() {
    return zaz();
  }
  function zaz() {
    return badDatabaseCall().catch(function zaz(err) {
      // Back in "our code" so call `appendStack` to get the fixup
      throw appendStack(err, new Error());
    });
  }
  return foo();
}
```

Stacktrace:

```
Error: oops
    at Timeout._onTimeout (file:///home/stephen/joist-orm/stacks.mjs:3:29)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/joist-orm/stacks.mjs:119:30)
    at async file:///home/stephen/joist-orm/stacks.mjs:156:5
```

This is interesting--it's definitely better than the original `allPromisesTimeout` example, because we can see `zaz` from our `stacks.mjs` file, *but* we're missing `foo` -> `bar` -> `zaz`.

This shows an interesting wrinkle with async/await: when we capture the current stack in `function zaz`'s `new Error()`, Node/v8 can find the upstream async functions (i.e. `foo` and `bar` from the previous example), but this example's regular functions that lack the async/await keywords.

I'm curious though, is it the `async` keyword or the `await` keyword that is driving the better stack traces?

## Example: allAsyncOneMissingAwaitTimeoutAppend

Here we update the middle function `bar` to keep the `async` keyword, but remove the `await` keyword:

```ts
async function allAsyncOneMissingAwaitTimeoutAppend() {
  async function foo() {
    await bar();
  }
  async function bar() {
    // Notice we removing an `await`
    return zaz();
  }
  async function zaz() {
    return badDatabaseCall().catch(function zaz(err) {
      throw appendStack(err, new Error());
    });
  }
  await foo();
}
```

Stacktrace:

```
allAsyncOneMissingAwaitTimeoutAppend
Error: oops
    at Timeout._onTimeout (file:///home/stephen/joist-orm/stacks.mjs:3:29)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/joist-orm/stacks.mjs:134:30)
    at async foo (file:///home/stephen/joist-orm/stacks.mjs:127:5)
    at async allAsyncOneMissingAwaitTimeoutAppend (file:///home/stephen/joist-orm/stacks.mjs:137:3)
    at async file:///home/stephen/joist-orm/stacks.mjs:154:5
```

We see both `foo` and `zaz` in the stack, but not `bar`!

So even though `bar` is an `async function`, without `await` the `zaz` promise, `bar` is not making it's way into the stack trace.

## Takeaways / Recommendations

Having worked through our examples, we can come away with some recommendations:

* Consider `appendStack`-ing **raw Promise rejections** on the I/O boundaries of your application.

  Whenever you're crossing a boundary from "a raw Promise" or callback (i.e. a low-level TCP/wire call) to "your async/await business logic", consider `appendStack`-ing the error to ensure the stack trace is as helpful as possible.

  This sounds tedious, but in practice applications have **a handful of "choke points"** which the majority of I/O calls go through, and **most low-level libraries should already do this for you**.

  For example, both the node-pg and postgres.js drivers already have `appendStack`-style fixes integrated, so most applications already get this for free.

  For Joist, I happened to be using a) postgres.js's `sql.unsafe` API, and b) Facebook's dataloader auto-batching library, both of which expose raw, "not fixed up" Promises.

  Even then, Joist itself is a "choke point" for database calls, so Joist-using applications will now these fixups for free (see [this PR](https://github.com/joist-orm/joist-orm/pull/1384)).

* Prefer async/await, even if it's "more expensive", the better DX is worth it.

  At times, it can be tempting to avoid the async/await keywords and use raw Promises, with the rationale that "async/await is slow" or "creates extra/unnecessary promises".

  Unless you have benchmarks to prove otherwise, or are writing a super-low-level library like the node-pg/postgres.js drivers themselves, I would recommend using async/await for the better stack traces.

  Every `await` in your app helps v8 create better traces, and the increased DX when debugging is almost certainly worth the ROI of "a few more promises".

* Anytime you're manually creating Promises, realize this will hurt your DX, and your callers will have to `appendStack` your promises to fixup their stack traces.

  This doesn't mean "don't do it", but just be aware of the trade-off, and if possible provide applications with an API that does its own `appendStack`-style fixup.

## Bun: Still Needs Work

The examples above all used Node & v8, and unfortunately the results for Bun are honestly pretty terrible, even for the examples that "use `async/await` keywords" that, at least in Node/v8, lead to "good by default" traces.

This is already a long post, so I'll refer to [this gist](https://gist.github.com/stephenh/0b4511b8766b3ea8289312623cfb9d39) with both the Node & Bun results, and the `stacks.mjs` file used for the examples, for any Bun users that want to dig in more.

To their credit, Node & v8 have put a lot of effort into stack traces DX over the years (see the [Zero-cost async stack traces design doc](https://docs.google.com/document/d/13Sy_kBIJGP0XT34V1CV3nkWya4TwYx9L3Yv45LdGB6Q/edit?tab=t.0#heading=h.9ss45aibqpw2) which is what drives the "`await` gives you good by default traces"), and Bun and/or JavaScriptCore just don't have the same capabilities/ergonomics yet.

## Resources

If you're interested in this topic, you might enjoy:

* The v8 [Zero-cost async stack traces design doc](https://docs.google.com/document/d/13Sy_kBIJGP0XT34V1CV3nkWya4TwYx9L3Yv45LdGB6Q/edit?tab=t.0#heading=h.9ss45aibqpw2)
* The [node-pg bug fix](https://github.com/brianc/node-postgres/pull/2983) where I learned about the `appendStack` fix
  * What's surprising is that this PR didn't land until May 2023 (!)
* [Joist PR that fixes dataloader stack traces](https://github.com/joist-orm/joist-orm/pull/1384)
  * Fixing up errors that occur for Joist's "auto-batched" / N+1-prevented queries
* [postgres.js issue showing new Error is expense](https://github.com/porsager/postgres/issues/290)
  * I.e. we want to ensure the "dummy" `new Error` happens conditionally in `catch` blocks 
* [postgres.js issue reporting unfixed traces](https://github.com/porsager/postgres/issues/963)
  * I believe the reporter is using postgres.js's `sql.unsafe` API (they don't specify), which currently requires manual `appendStack`-ing
