---
date: "2022-01-17T00:00:00Z"
title: Can and Should Instead of Is and Get
categories:
  - Architecture
---

When implementing software systems, behavior is often derived from expressions that are based on the domain model's current state.

For example:

* Do not show "pending" accounts in the navbar
* When an account has more than $100 in it, allow the user to upgrade it

Usually it's tempting to build this logic directly into clients/UIs by directly accessing the underlying data (i.e. the account status, the account balance), i.e. in a React component or JSX:

```typescript
// using getState/getStatus directly
const navbarAccounts = accounts.filter(account => {
  return account.getStatus === "pending";
});

// using is accessors
const navbarAccounts = accounts.filter(account => {
  return account.isPending
});

// allow conditional behavior
if (account.getBalance > 100) {
  showUpgradeAccountButton();
}
```


This solves the requirement in the short-term, but these conditions are a form of tech debt, because they spread the business logic for an entity kinda willy/nilly around the application. 

My assertion is that these expressions, which are using `get`s (`getStatus`, `getBalance`, `getState`) and `is`s (`isPending`), should be written as `can`s and `should`s that formally define and name the result they are calculating:

```typescript
const navbarAccounts = accounts.filter(account => {
  return account.shouldBeInNavbar;
});

if (account.canUpgradeAccount) {
  showUpgradeAccountButton();
}
```

Which restricts the client-side logic to only `if` checks against binary (only `true` or `false`) outcomes, and keeps the underlying expressions abstracted/centralized in the domain model. 

### Rationale 1: DRYer When You have Multiple Clients

One of the most common places where putting `get`-based expressions directly into clients becomes messy is with multiple clients, i.e. the prototypical Koltin Android app + Swift iOS app + TypeScript webapp trifecta.

Granted, our example expressions are small, but repeating each of the above expressions across each client codebase is increasing the potential for bugs and maintenance burden.

And, more often than not, real-world expressions are much complex, which makes the duplication across clients more unappealing.

### Rationale 2: Easier to Add New States

Particularly for logic that checks `getState` or `getStatus` fields, when you add a new status field, it can be tedious and error-prone to manually audit the codebase to find all of the conditions that _might_ need to be updated to include or exclude the new state.

However with the `can` or `should` approach, those conditions are generally in a single spot in the codebase (in the entity's primary file, or its backend-for-frontend API), and so are much easier to find, audit, and update if needed. 

#### What about ADTs?

A potential mitigation to the "new state" problem is to use [ADT](https://dev.to/mikeskoe/algebraic-data-type-adt-with-typescript-f3p)s which can leverage TypeScript's [exhaustiveness checks](https://basarat.gitbook.io/typescript/type-system/discriminated-unions#exhaustive-checks) to cause compile errors when new conditions are added.

For example (using just enums, but it would be similar with full-fledged ADTs), the client-side UI could be written as:

```typescript
function shouldBeInNavbar(status: AccountStatus) {
  switch (status) {
    case AccountStatus.OPEN: return true;
    case AccountStatus.CLOSED: return false;
    case AccountStatus.DRAFT: return false;
    default: assertNever(status);
  }
}
```

Where the `assertNever` (see [an example impl](https://github.com/aikoven/assert-never)) will throw a compile error when we introduce a new `AccountStatus.REVIEWING` state.

This is good and an improvement; my hestitation is that:

1. It is tedious to type out exhaustive checks and really easy for engineers to just slip in an `.isDraft`, so it's often not done.

   (Granted, this is not a great rationale, b/c the same exhaustive check would ideally be typed out within the domain's `should` method.)

2. It only handles single-condition checks

   Unfortunately, TypeScript does not have full-fledged pattern matching built-in, so `assertNever` only works for checking a single condition (i.e. `status`). If the expression relies on both `status` as well as `balance`, then an ADT cannot exhaustively check that.

   (Granted, there are libraries like [ts-pattern](https://github.com/gvergnaud/ts-pattern) that address this; unfortunately/admittedly I've not had a chance to use them yet, and I'm unclear how it'd handle non-boolean checks, i.e. `.getBalance > 100` I don't think either TypeScript or `ts-pattern` will be able to check "make sure they also check less than $100".)

3. Doesn't address client-side duplication/implementation considerations

   ADTs are definitely better than inline `getState` checks, but I think overall not a solution in-and-of themselves to the other pros/cons of putting business logic expressions on the client-side.

### Rationale 3: Faster Client-Side Implementation

To my general chagrin, most of the development time, at least in projects I've been involved in for the last ~5-8 years, is on the frontend. The bar for frontend UX is very high these days, and even with mature frameworks and component libraries like React/et al, it just takes longer to deliver frontend code.

Given this, allowing the client implemention to be as simple as possible, by leveraging dead-simple boolean conditions (`can`s and `should`s), is a small-but-measurable way of speeding up/simplifying the client.

Especially for testing, with `can`/`should` the UI tests have only two binary outcomes of `true` and `false` to cover, and then the complexity and nuance of writing test cases to cover the actual calculation of the expression can be written on the backend.

### Wrinkle 1: Isn't this Leaking UI Concerns into the Domain?

Granted, it can seem kind of silly to "dirty" the domain layer with UI concerns about navbars and which buttons to enable.

However, I think this can be mitigated two ways:

1. Choose names that are as domain-driven as possible, i.e. instead of `showInNavbar` use `isPrimaryAccount`, or instead of `showUpgradeAccountButton` use `canUpgradeAccount`.

2. Add the most extreme "just a UI concern" expressions to a backend-for-frontend API layer like GraphQL instead of the core domain entities.

### Wrinkle 2: Real-time/Offline Updates

One constraint of "keep expressions on the server-side within the domain model" is that it requires the server to both initially calculate, as well as update, the expression.

Most of the time this is fine, but if you have a specific UI screen that needs to _immediately_ react to an expression's new value, you can try to quickly calc/refresh the value from the backend (which hopefully is acceptable most of the time). But, if not, then coding the expression's logic on the frontend, where it can immediately access the latest values, can be the most pragmatic/necessary approach.

Also, if your client app is offline, the server's non-presence becomes ubiqutious and you almost certainly have to code expressions on the client. Although, you could still apply this pattern by having the `can` and `should` implementations not literally "on the server", but abstracted within your client-side domain model, instead of having them inlined directly into the UI rendering code.

### Wrinkle 3: Needs a Responsive Full Stack Team

One context where this pattern would not work well is very decoupled frontend & backend teams, i.e. where a frontend engineer might end up blocked for days/weeks waiting for a backend engineer to expose the appropriate `can` or `should` method they need for the UI.

Ideally the team is full-stack and can internally prioritize adding the backend `can`/`should` method when the frontend engineer needs it.

Note that a way to move faster here, even for full stack teams, is to first define the contract, i.e. release a backend PR with the `can` or `should` method added but it always returns `false`. This should be very quick to implement, and should unblock the frontend engineer by letting them writes tests and stories against the new API contract, while the backend engineer in parallel actually implements the expression.

### Bonus: Use Potential Operations to say "Why Not"

Recently the project I'm working on has doubled down on `can` methods creating a type in our GraphQL API called `PotentialOperation`:

```graphql
type PotentialOperation {
  allowed: Boolean!
  disabledReasons: [String!]!
}

# Used in Account
type Account {
  canUpgradeAccount: PotentialOperation!
}
```

This allows the backend to not only say "yes or no" on whether an operation is allowed, but "why" it's not allowed as well.

For the `canUpgradeAccount` example, a return value might be:

```json
{
  "id": "account:1",
  "canUpgradeAccount": {
    "allowed": false,
    "disabledReasons": [
      "The account balance is below $100"
    ]
  }
}
```

This allows the client UX to be much more helpful to the user, by providing a reason why/why not an operation can be performed (via a tooltip over the "Upgrade" button, or other inline text), but still avoids implementing the expression itself on the client-side.

### Musing: Taking This to an Extreme

As a disclaimer, I've not actually tried this musing, but one could imagine: what if all domain model getters were inaccessible to any code except for displaying the literal value to the user?

I.e. for the `Account` CRUD screen, and the `Account`s listing screen, it's obvious the frontend would need to be able to call `account.getName`, `account.getBalance`, to show those literal values to the user. And also to have setters, like `account.setName` (or the `SaveAuthorInput.name` GraphQL equivalent), for the CRUD form to update the name.

But, outside of those "the user is viewing/updating this literal value", what if no other code in the system was allowed access to the `Account`'s data?

I have a funny feeling that I've seen this approach before; it reminds me of [east-oriented programming](/2013/04/12/east-oriented-programming.html/) and maybe stricter practitioners of Domain Driven Design / CQRS, where all mutations are command pattern-d.

My hesitancy to the east, CQRS, and other "getter-/setter-less" approaches I've historically seen is that, I think realistically the majority of systems' screens and APIs really are "just CRUD for the end-user", where it seems like overkill and needless complexity. I want to make CRUD as easy as possible.

...but, outside of CRUD, I do generally buy into "eschew getters and setters, and use encapsulation".

I think the main challenge is that I've not found a way, in a codebase or API or type system, to sufficiently deliniate the "just CRUD" code paths, which are allowed to use getters and setters, from the "deriving / invoking behavior" behavior, which ideally would use higher-level abstractions like `can` and `should`.

So, for now I've just relied on engineers to know about the `can` and `should` pattern, and know/choose when to use it on a case-by-case basis.

### Disclaimer: Use as a Rule of Thumb

While we've had a lot of success with `PotentialOperation` and `can`/`should` methods in our current project, I will be clear/honest that we've not enforced it for literally every UI condition, from day one.

Most of this is probably that, when starting, I'd just kinda forgot about this pattern (we'd used a version of it on a previous team, circa 2015-ish); but also maybe it would actually be overwhelming to do for literally every UI condition, I'm not sure.

So I do think this approach is a great rule of thumb, especially for complex, domain-heavy expressions, but I've not seen it applied "for literally everything".

