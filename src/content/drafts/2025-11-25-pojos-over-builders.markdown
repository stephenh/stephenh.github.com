---
date: "2025-11-25T00:00:00Z"
categories:
  - Architecture
title: Building DSLs with POJOs instead of Builders
draft: true
---

Having used TypeScript for awhile, I've developed a preference for building DSLs around "just data" POJOs (Plain Old JavaScript Objects) instead of builders.

As an example, I'll use Knex as a canonical "builder-based" API where you start with some top-level object and then make fluent method calls:

```ts
// repeated method chaining
await knex("users")
  .where({ first_name: "Test", last_name: "User" })
  .select("id");
```

Other "builder" examples in the TypeScript community include Zod, Kysely, Primsa.

And by POJO-based DSLs, I mean something like Joist's `em.find` that takes "just an object literal":

```ts
// just an object literal
await em.find(User, {
  firstName: "test",
  lastName: "User",
  publisher: { name: "LargeCo" },
});
```

There are pros/cons to each of these DXs, which is, generally/imo, for builders:

- Pro: Builders generally are more discoverable b/c the fluent methods show up immediately in auto-complete
- Pro: Builders are generally able to "build custom types as you go"
- Con: Builders kinda suck at making dynamic structures (we'll see later)

And for POJO DSLs it's basically the opposite:

- Con: POJOs are somewhat less discoverable b/c you'll get type-checking but not as immediate auto-complete within object literals
- Pro: POJOs are great at being dynamic (both JS & TS excel at creating "just data")

## Dynamic Structures

Cutting to the chase, dynamic structures is where I think builders struggle, i.e. creating queries that have multiple `AND` or `OR` conditions, but conditionally based on input args.

For example this query with builders is very straightforward if all filters will always be set, i.e. the structure is static:

```ts
function findUsers(filter: UserFilter) {
  const { id, firstName, lastName } = filter;
  return knex("users")
    .whereIn("id", id)
    .where("firstName", firstName)
    .where("lastName", lastName);
}
```

But once we need it to be more complex (first name & last name should be `OR`-d, and all filters are optional), it gets more clunky:

```ts
function findUsers(filter: UserFilter) {
  const { id, firstName, lastName } = filter;
  return knex("users").where((builder) => {
    if (id !== undefined) {
      builder.whereIn("id", id);
    }
    const hasFirstName = firstName !== undefined;
    const hasLastName = lastName !== undefined;
    if (hasFirstName || hasLastName) {
      builder.andWhere(function () {
        if (hasFirstName) {
          this.where("firstName", firstName);
        }
        if (hasLastName) {
          this.orWhere("lastName", lastName);
        }
      });
    }
  });
}
```

The core issue is that builders defacto use method calls, and the only way of "dynamically calling methods" is `if`s clauses.

Contrast this with Joist's `em.find`:

```ts
function findUsers(filter: UserFilter) {
  const { id, firstName, lastName } = filter;
  const u = alias(User);
  return em.find(
    User,
    { as: u },
    {
      conditions: {
        and: [
          ...(id ? [u.id.eq(id)] : []),
          ...(firstName && lastName
            ? {
                or: [{ firstName }, { lastName }],
              }
            : []),
        ],
      },
    },
  );
}
```

Which is leveraging the built-in "just data" features of JavaScript:

- Using Object spread `...` to conditionally include conditions
- Using "just lists" for `AND`s and `ORs
