function badDatabaseCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("oops")), 50);
  });
}

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

function allPromises() {
  function foo() {
    return bar();
  }
  function bar() {
    return zaz();
  }
  function zaz() {
    return new Promise(function handle(resolve, reject) {
      reject(new Error("oops"));
    });
  }
  return foo();
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

function allPromisesTimeout() {
  function foo() {
    return bar();
  }
  function bar() {
    return zaz();
  }
  function zaz() {
    return badDatabaseCall();
  }
  return foo();
}

async function allAwaitsTimeoutCatch() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    return badDatabaseCall().catch(function zaz(err) {
      throw appendStack(err, new Error());
    });
  }
  await foo();
}

async function allAwaitsTimeoutLambdaCatch() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    return badDatabaseCall().catch((err) => {
      throw appendStack(err, new Error());
    });
  }
  await foo();
}

async function allAwaitsTimeoutCause() {
  async function foo() {
    await bar();
  }
  async function bar() {
    await zaz();
  }
  async function zaz() {
    return new badDatabaseCall().catch((err) => {
      throw new Error(err.message, { cause: err });
    });
  }
  await foo();
}

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

async function allAsyncOneMissingAwaitTimeoutCatch() {
  async function foo() {
    await bar();
  }
  async function bar() {
    return zaz();
  }
  async function zaz() {
    return badDatabaseCall().catch(function zaz(err) {
      throw appendStack(err, new Error());
    });
  }
  await foo();
}

for (const fn of [
  allAwaits,
  allPromises,
  allAwaitsTimeout,
  allPromisesTimeout,
  allAwaitsTimeoutCatch,
  allAwaitsTimeoutLambdaCatch,
  allPromisesTimeoutCatch,
  allAsyncOneMissingAwaitTimeoutCatch,
  allAwaitsTimeoutCause,
]) {
  console.log("");
  console.log(fn.name);
  try {
    await fn();
  } catch (err) {
    console.log(err);
  }
}
export function appendStack(err, dummy) {
  if (err && typeof err === "object" && "stack" in err) {
    err.stack += dummy.stack.replace(/.*\n/, "\n");
  }
  return err;
}
