---
layout: post
title: Variations on a State Machine
section: TypeScript
---

{{page.title}}
==============

A few days ago, raganwald posted his [2nd article on state charts](http://raganwald.com/2018/03/03/reflections.html).

I really like that raganwald is spreading knowledge about state charts, as I think they are a great, useful formalism, although ironically (and depressingly) I've personally only used them informally on projects (e.g. in documentation and reasoning), rather than via official state machine/state chart implementations.

What's also interesting is that he's covering both introduction of a (potential) new concept to the reader, as well as using, in my opinion, somewhat non-trivial JavaScript as his language of choice for the implementation.

I'm sure this will become more common (or perhaps already is), given that JavaScript is eating the world, but for me it's different than what I "grew up with", where the pedagogical languages of choice were more passe/boring languages like Java/C++/Python.

And, to a certain extent, I worry that teaching both "potentially non-trivial concept" with "potentially non-trivial implementation" will make both harder to learn, vs. separating them out and teaching the concept in a boring language, then later teaching a novel implementation in the exciting language.

That said, I could also not tell if my difficultly reading the code was due to fundamental accidental complexity within the code itself, or just my own lack of familiarity/understanding with either the problem or the language or both.

So I thought I would try to reimplement his examples, in TypeScript, to see what I could learn.

First Attempt
-------------

I'm going to cheat and assume you've read his article for a general gist of the problem/domain, and instead jump right to pasting a bunch of code:

```typescript
// define our states
type AccountState = "OPEN" | "HELD" | "CLOSED";
// and events (some events lead to transitions, e.g. placeHold,
// others do not, e.g. deposit)
type AccountEvent = "deposit" | "withdraw" | "available" | "placeHold" | "removeHold" | "close" | "reopen";

// define the shape of our config DSL
type AccountBehavior = {
  // every state must have it's behavior specified
  [key in AccountState]: StateBehavior
}
type StateBehavior = {
  // for a given state, we may have an event defined; if
  // there is no event, that means it's not a valid operation
  // or transition in the current state, and will be rejected
  [key in AccountEvent]?: EventBehavior;
}
type EventBehavior = {
  // optionally defines the next state to transition to
  nextState?: AccountState;
}

// now define our actual behavior, to match the types above
const behavior: AccountBehavior = {
  OPEN: {
    // since deposit is defined, it is a valid event within
    // the OPEN state. the empty hash means we don't have
    // a nextState to transition to next, so will stay in OPEN
    deposit: {},
    withdraw: {},
    available: {},
    placeHold: { nextState: "HELD" },
    close: { nextState: "CLOSED" },
  },
  HELD: {
    deposit: {},
    // in theory we'd like to disable/override the behavior of
    // available within the HELD state; our current DSL can't
    // support that
    available: {},
    removeHold: { nextState: "OPEN" },
    close: { nextState: "CLOSED" },
  },
  CLOSED: {
    reopen: { nextState: "OPEN" }
  }
};

// now a pretty basic class with state/operations
class Account {

  balance: number = 0;
  state: AccountState = "OPEN";

  deposit(amount: number) {
    // each of our events goes through the "perform" method, which
    // ensures: a) that event may be validly executed in the current
    // state, and b) transitions us to the next state if needed
    this.perform("deposit", () => this.balance += amount);
  }

  withdraw(amount: number) {
    this.perform("withdraw", () => this.balance -= amount);
  }

  available(): number {
    return this.perform("available", () => this.balance);
  }

  placeHold() {
    this.perform("placeHold", () => null);
  }

  removeHold() {
    this.perform("removeHold", () => null);
  }

  // allows clients to ask if a given event is allowed in our current state
  mayDo(event: AccountEvent): boolean {
    return behavior[this.state][event] != null;
  }

  private perform<T>(event: AccountEvent, logic: () => T): T {
    if (!this.mayDo(event)) {
      // not allowed, throw error
    }
    let value = logic();
    this.transitionIfNeeded(event);
    return value;
  }

  private transitionIfNeeded(event: AccountEvent): void {
    let eb = behavior[this.state][event];
    if (eb == null || eb.nextState == null) {
      // error, not allowed
    } else {
      this.state = eb.nextState;
    }
  }
}
```

There are a few things I like about this:

* The config DSL is now type-safe, by using a few nifty TypeScript features:

  One is literal types/type unions, where we declare our 3 valid states, and 8 valid events, and can use these to enforce correctness/avoid typos in our config DSL.

  E.g. the `nextState` config must be one of the three given state.

  Second is mapped types, where the 1-liner of `[key in AccountState]` will be "expanded" and mean that our config DSL needs a key for each of the 3 account states.

  These mapped types are fun, as they are great for reducing boilerplate, and keeping things automatically up-to-date (e.g. whenever a new account state is added, we don't need to change the `AccountBehavior` definition).

* The config DSL is still "looks like JSON" human-readable. These sort of builder-esque patterns are often hard to achieve in type-safe languages.

* The `deposit`/etc. business logic is not duplicated in lambdas within the config DSL (something I didn't like in raganwald's example), but instead live in the object.

That said, there are a few downsides:

* I don't have any way of changing event business logic within the config DSL.

  Instead, this would have to be accomplished by changing each business logic method, e.g. `available` (which is supposed to return $0 when in the `HELD` state), to have the state-dependent behavior (e.g. "if held, return $0") hardcoded directly in it.

  Which I go back and forth on; part of me prefers the locality of having all of the `available` business logic within a single method, vs. having it spread around in various parts of the config DSL. (This preference is likely part of what kept me from using state-machine libraries in the past.)

  That said, having easily-changable behavior is part of the state machine pattern, so that is fair enough. I'm sure there is a point in business logic complexity where this is desireable.

* I'm not a huge fan of the `perform("available", () => ...logic...)` boilerplate.

  Currently this boilerplate is necessary for the `perform` method to apply pre- and post-logic, e.g. ensure this event is valid, and then make any state machine transitions after the fact.

  I was hoping to use something like decorators to solve this, so the method could look something like `@action available() { ...logic... }`, and the `@action` annotation would apply the wrapper logic, but AFAICT the current decorator implementations in TypeScript (and ES6) can only inject metadata into the type descriptors (for later lookup at runtime), and not actually change behavior.

Second Attempt
--------------

So that was my first attempt; for my second attempt, I decided to take a shot at getting configurable event behavior within the config DSL, e.g. the `available` method would have different implementations depending on the state.

It took me a few tries to accomplish this, as initially I was having too much fun trying to get it to work with mapped types, and couldn't get anything to click.

But eventually I fell back on something more boring (subclass/visitor-ish) and it worked well:

```typescript
// To allow our DSL to override behavior without being repetitive
// (e.g. re-defining the `deposit` implementation in multiple states),
// we pull our default implementations out into a stateless "business
// logic" class.
//
// This is somewhat odd, removing behavior from the object, but we're
// doing this explicitly because the logic was (in a less trivial app)
// becoming too complicated to live within a single object/method.
//
// This is stateless so that we can define override behavior once within
// our config DSL (see below) and have it apply to multiple account instances.
class DefaultEventLogic {
  deposit(account: Account, amount: number) {
    account.balance += amount;
  }

  withdraw(account: Account, amount: number) {
    account.balance -= amount;
  }

  available(account: Account): number {
    return account.balance;
  }

  // these events don't have any logic, as they are purely transition,
  // but we define them here anyway so that they automatically become
  // part of our AccountEvent type
  placeHold() {
  }

  removeHold() {
  }

  close() {
  }

  reopen() {
  }
}

// same basic states as before
type AccountState = "OPEN" | "HELD" | "CLOSED";
// instead of re-typing the constants `deposit | withdraw | ...`,
// we can copy them out of our logic class
type AccountEvent = keyof DefaultEventLogic;

// same trio of Account/State/Event spec behavior
type AccountBehavior = {
  [key in AccountState]: StateBehavior
}
type StateBehavior = {
  [key in AccountEvent]?: EventBehavior;
}
type EventBehavior = {
  nextState?: AccountState,
  override?: DefaultEventLogic;
}

// and now the actual config DSL
const behavior: AccountBehavior = {
  OPEN: {
    // same as previous, deposit is a valid operation
    // in the OPEN state, but is not a transition
    deposit: {},
    withdraw: {},
    available: {},
    placeHold: { nextState: "HELD" },
    close: { nextState: "CLOSED" },
  },
  HELD: {
    deposit: {},
    available: {
      // now we can override the `available` method specific to
      // our HELD state. oddly, there is no override keyword in TS,
      // so the signature of `available` is not technically type
      // checked against the base class. See TypeScript issue #2000.
      override: new class extends DefaultEventLogic {
        available(account: Account) { return 0; }
      }
    },
    removeHold: { nextState: "OPEN" },
    close: { nextState: "CLOSED" },
  },
  CLOSED: {
    reopen: { nextState: "OPEN" }
  }
};

class Account {
  balance: number = 0;
  state: AccountState = "OPEN";

  deposit(amount: number) {
    // we have a perform method, just as before, but now instead always
    // call the business logic within the EventLogic class, which will
    // either be the default behavior, or the state-specific overridden
    // behavior
    this.perform("deposit", l => l.deposit(this, amount));
  }

  withdraw(amount: number) {
    this.perform("withdraw", l => l.withdraw(this, amount));
  }

  available(): number {
    return this.perform("available", l => l.available(this));
  }

  placeHold() {
    this.perform("placeHold", l => l.placeHold());
  }

  removeHold() {
    this.perform("removeHold", l => l.removeHold());
  }

  mayDo(event: AccountEvent): boolean {
    return behavior[this.state][event] != null;
  }

  private perform<T>(event: AccountEvent, callback: (e: DefaultEventLogic) => T): T {
    if (!this.mayDo(event)) {
      // not allowed, throw error
    }
    let logic = this.getLogic(event);
    let value = callback(logic);
    this.transitionIfNeeded(event);
    return value;
  }

  private transitionIfNeeded(event: AccountEvent): void {
    let eb = behavior[this.state][event];
    if (eb == null || eb.nextState == null) {
      // error, not allowed
    } else {
      this.state = eb.nextState;
    }
  }

  private getLogic(event: AccountEvent): DefaultEventLogic {
    let eb = behavior[this.state][event];
    return (eb && eb.override) ? eb.override : new DefaultEventLogic();
  }
}
```

I left plenty of comments inline which should explain how it works. Highlights are:

* We now have an `override: ...new behavior...` spot to hook in per-state logic.

  Ideally TypeScript would have the `override` keyword, as then we could be sure that the `available` method declared in our config DSL actually matched/overrode the `available` method in the base class, but for now we'll rely on a test to ensure that (which we should have anyway).

  Currently there is one anonymous class per state + event (e.g. the `override` is defined within a given event behavior), which means if we wanted `HELD` to override the behavior of every event, we would have `N(event)` anonymous classes in our `HELD` definition.

  An alternative would be one anonymous class per state (defined within the state behavior), but I liked each event's `nextState` and `override` keys being next to each other in the DSL.

  Also, the current one-subclass-per-state+event approach is potentially error-prone, because you could be in the `HELD + removeHold` spot in the config tree, and if you override the `available` method, then nothing is going to happen, because the logic instance defined at that spot in the DSL will only ever be used for `removeHold` invocations. This is a potential source of bugs, but seems easy to catch with tests/code review.

  (Avoiding this via fancier type declarations/etc. is part of what had me stuck for awhile.)

* The "default implementation" of business logic in `DefaultEventLogic` I think works well, because it balances don't-repeat-yourself (e.g. declaring the same behavior of `deposit` within each state) with the flexibility to change-if-needed.

* We get to use the cute TypeScript `keyof` operator in the `AccountEvent` declaration, so that anytime we add a method to our `DefaultEventLogic` class, it will automatically be added to our `AccountEvent` type literal union.

* There is still some boilerplate in the repetition between each event being declared once in the `DefaultEventLogic` (with its behavior) as well as in the `Account` itself (with the copy/paste forwarding logic).

  Similarily to the 1st attempt, I believe if TypeScript eventually gets design-time decorators (a form of compile-time macros), I think this boilerplate could go away with an annotation like `@statemachine(behavior=DefaultEventLogic) class Account`, which would effectively inject the `deposit`, `withdraw`, etc. methods into the `Account` class for us, but for now we have to type out the duplication.

  That said, this sort of boilerplate compromise is not new for type-safe languages: obviously it can and does get horrendous, so it's a slippery slope you need to navigate carefully, but type-safe bigots/apologists like myself are often okay with adding a smidge of duplication/non-DRY to architectures/codebases, if it means we think the trade-off in terms of simplicity and type-safety is worth it. YMMV.

Third Attempt
-------------

The third attempt is that I don't have a third attempt; in his post, raganwald goes on to expand his state machine examples (which have a single top-level flag) to state charts (which have nested flags of open/held).

I've not tried to do this yet, so I have no idea whether my current versions will adapt easily or not.

I do think raganwald's example is very apt, as I've had multiple experiences where an entity will go from a single combined state to several separate state flags, so this is an important use case to think about.

Wrap Up
-------

So, that's it. Nothing too exciting. I enjoyed working with the examples, basically as a form of kata, as I know understand the problem and requirements better.

I am biased, but I think my implementations are quite a bit simpler, but with some admitted boilerplate, and also no consideration of the nested state chart variation.

Also, perhaps obvious/disclaimer, but in a real project I would at least research existing state chart libraries/implementations before hacking on my own approach, but since this was just for fun, I've not looked around to see what there is.

If you want to play around/fork the code, here's [the repo](https://github.com/stephenh/typescript-state-machines).









