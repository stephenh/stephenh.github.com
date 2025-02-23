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
    at ErrorResponse (/home/stephen/other/joist-orm/node_modules/postgres/cjs/src/connection.js:790:26)
    at handle (/home/stephen/other/joist-orm/node_modules/postgres/cjs/src/connection.js:476:6)
    at Socket.data (/home/stephen/other/joist-orm/node_modules/postgres/cjs/src/connection.js:317:9)
    at Socket.emit (node:events:507:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Socket.Readable.push (node:internal/streams/readable:390:5)
    at TCP.onStreamRead (node:internal/stream_base_commons:189:23)
```

This trace is correctly reporting the SQL syntax error, but there is zero indication of "who called this" / "who caused this", which in a large/complicated codebase or test run can be infuriating to not know where to begin fixing the issue.

I was kind of dumbfounded that such a bad DX could still happen in 2025, so I started digging.

## Root Cause: The Run Loop

Stepping back a bit, understandable why node does this -- run loop with a collection of lambdas.

Example of program broken up into tiny lambda, with "invoke next", "invoke next".

So, in a traditional frames on the imperative call stack it's right

## Transporting Errors Across Contexts

When the error happens in 1 context, and it invalidates other contexts.

```ts
// 
// Usage: 
//
// function makeDbCall(): Promise<unknown> {
//   return someIoPromise.catch(function makeDbCall(err) {
//     throw appendStack(err, new Error());
//   });
// }
export function appendStack(err, dummy) {
  if (err && typeof err === "object" && "stack" in err) {
    err.stack += dummy.stack.replace(/.*\n/, "\n");
  }
  return err;
}
```

## Example: allAwaits

Starting with the simplest example I could think of, I wanted to chain a series of `async` functions (i.e. `foo` calls `bar` which calls `zaz`), have the 3rd one (`zaz`) fail, and see what happens:

```ts
async function allAwaits() {
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
    at zaz (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:9:11)
    at bar (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:6:11)
    at foo (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:3:11)
    at allAwaits (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:11:9)
    at file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:156:11
    at ModuleJob.run (node:internal/modules/esm/module_job:268:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:543:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)

```

This seems good! We see all three of `foo` -> `bar` -> `zaz` in the trace.

However, we're cheating a little bit by throwing the `Error` immediately within the `zaz` function.

## Example: allPromises

Before resolving our "cheating" issue, here's an example uses raw Promises instead of async/await:

```ts
function allPromises() {
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
    at handle file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:22:52
    at new Promise (<anonymous>)
    at zaz (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:22:12)
    at bar (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:19:12)
    at foo (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:16:12)
    at allPromises (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:24:10)
    at file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:156:11

```

Initially, I was surprised Node handled this well, b/c I assumed the `await` keyword was helping keep our previous stacktrace intact (which, as we'll see later, can be the case in other scenarios).

However, in retrospect, the `foo` -> `bar` -> `zaz` -> `handle` functions are all immediately invoked (within the same invocation of the run loop calling `foo`), so the stack "just works" for free.

## Example: allAwaitsTimeout

Now, to resolve the cheating issue, instead of *immediately* failing (within the `handle` function), we'll wait to reject our promise from a "different context", specifically a `setTimeout` callback, which will emulate "the database response callback coming back":

```ts
// Emulates a wire call to the database returning an error
function badDatabaseCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("oops")), 50);
  });
}

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
    at Timeout._onTimeout (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:36:31)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
```

Oh--that's not great. This is exactly the unhelpful stack trace we're trying to prevent.

Even using `await`s for our `foo` -> `bar` -> `zaz` chain did not help.

But we've reproduced the issue, and now can work on fixing it.

## Example: allAwaitsTimeoutCatch

This example using the "catch + append stack" pattern:

```ts
async function allAwaitsTimeoutCatch() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    // Using `function zaz` instead of a lambda to get `zaz` into the trace
    return badDatabaseCall().catch(function zaz(err) {
      throw appendStack(err, new Error());
    });
  }
  await foo();
}
```

Stacktrace:

```
Error: oops
    at Timeout._onTimeout (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:70:31)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:72:30)
    at async bar (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:66:5)
    at async foo (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:63:5)
    at async allAwaitsTimeoutCatch (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:75:3)
    at async file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:160:5
```

We've got it!

We can see the `foo` -> `bar` -> `zaz` -> `onTimeout` progression.

## Example: allPromisesTimeoutCatch

Since the `appendStack` worked so well for our async functions, let's try it with our raw Promises:

```ts
function allPromisesTimeoutCatch() {
  function foo() {
    return bar();
  }
  function bar() {
    return zaz();
  }
  function zaz() {
    return badDatabaseCall().catch(function zaz(err) {
      throw appendStack(err, new Error());
    });
  }
  return foo();
}
```

Stacktrace:

```
Error: oops
    at Timeout._onTimeout (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:3:29)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:119:30)
    at async file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:156:5
```

This is interesting--it's definitely better than `allPromisesTimeout` (we can see `zaz` from our `stacks.mjs` file), *but* we're missing `foo` -> `bar` -> `zaz`.

This shows an interesting wrinkle with async/await: when we capture a new stack in `function zaz`'s `new Error()`, Node/v8 is can find the `async` functions (i.e. `foo` and `bar` from the previous example), but not regular functions that lack the async/await keywords.

I'm curious though, is it the `async` keyword or the `await` keyword that is driving the better stack traces?

## Example: allAsyncOneMissingAwaitTimeoutCatch

Here we update `bar` to keep the `async` keyword, but remove the `await` keyword:

```ts
async function allAsyncOneMissingAwaitTimeoutCatch() {
  async function foo() {
    await bar();
  }
  async function bar() {
    // Notice we'remissing an `await`
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
allAsyncOneMissingAwaitTimeoutCatch
Error: oops
    at Timeout._onTimeout (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:3:29)
    at listOnTimeout (node:internal/timers:614:17)
    at process.processTimers (node:internal/timers:549:7)
    at zaz (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:134:30)
    at async foo (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:127:5)
    at async allAsyncOneMissingAwaitTimeoutCatch (file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:137:3)
    at async file:///home/stephen/other/joist-orm/packages/orm/src/stacks.mjs:154:5
```

We see both `foo` and `zaz` in the stack, but not `bar`!

So even though `bar` is an `async function`, without `await` the `zaz` promise, `bar` is not making it's way into the stack trace.

## Takeaways / Recommendations

* Consider `appendStack`-ing errors on the I/O boundaries of your application.

  Whenever you're crossing a boundary from "a raw Promise" or callback (i.e. a low-level TCP/wire call) to "your async/await business logic", consider `appendStack`-ing the error to ensure the stack trace is as helpful as possible.

  Initially this seems very tedious, but I think in practice most applications have only a handful of "choke points" through which the majority of I/O calls go, and hand-instrumenting these should be doable.

  For example, both the node-pg and postgres.js drivers already `appendStack`-style fixes integrated, so most applications already get this for free--for Joist, I happened to be using a) postgres.js's `sql.unsafe` API, and b) Facebook's dataloader for auto-batching database queries, both of which use raw Promises and so needed manual fixups.

  But, given that Joist is itself a "choke point" for an application's database calls, the applications themselves get these fixups for free.

* Prefer async/await, even if it's expensive, the better DX is worth it

  At times, it can be tempting to purposefully eschew the async/await keywords and use raw Promises, with the rationale that "it's faster".

  Unless you have benchmarks to prove otherwise, or are writing a super-low-level library like the node-pg/postgres.js drivers themselves, I would recommend using async/await for the better stack traces.

* Anytime you're manually creating Promises, realize this will hurt your DX, and your callers will have to `appendStack` your promises to fixup their stack traces.

  This doesn't mean "don't do it", but just be aware of the trade-off, and if possible provide applications with an API that does its own `appendStack`-style fixup.

* Link to node-pg fix & kudos
* Disclaimer that postgres.js issue only happens for `sql.unsafe` API
