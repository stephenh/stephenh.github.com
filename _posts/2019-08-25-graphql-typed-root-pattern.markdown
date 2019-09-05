---
layout: post
title: GraphQL Typed Root Pattern
section: Favorites
---

{{page.title}}
==============

While working in a GraphQL codebase over the last year or so (specifically using Apollo Server in TypeScript), I semi-discovered a pattern for building more maintainable resolvers that I have not seen widely discussed/written about it (although both the [graphqlgen](https://github.com/prisma/graphqlgen) and [graphql code generator](https://graphql-code-generator.com) projects use them, so the pattern is more common that I'd initially realized).

I'll generally assume knowledge how of the object/field resolvers work in Apollo ([see their docs](https://www.apollographql.com/docs/graphql-tools/resolvers/)), but as a starting point, let's assume we have a schema like:

```graphql
type Employer {
  id: string
  employees: [Employee!]!
}

type Employee {
  addresses: [EmployeeAddess!]!
  name: String!
}

type EmployeeAddress {
  employee: Employee!
}

type Query {
  employer(id: string): Employer
}
```

I.e. a pretty basic model with relations: `Employer` has many `Employee`s, the `Employee` has `EmployeeAddress`s, etc.

So, again assuming some general pre-existing GraphQL knowledge, we end up needing to write a field resolver for the `Employee.name` field, with a signature like:

```typescript
const resolvers = {
  Employee: {
    name(root, args, context, info) {
      return "the name";
    }
  }
}
```

Simple enough.

So, the focus of this pattern is: **what should the type of `root` be**?

### Let's Not Use `any`

In the codebase that I inherited, the type of `root` was always `any`.

Which is very JavaScripty, and makes sense given the JavaScript origins of the Apollo project.

But, given we'd already decided "types are a good thing", and were using TypeScript, the `any` leaves a lot to be desired.

I.e. a naive implementation might look like:

```typescript
const resolvers: {
  Employee: {
    name(root: any) {
      return root.name;
    }
  }
}
```

But now anytime we refactor the upstream/downstream resolvers that interact with the `Employee` resolver (which we'll cover in a bit), there is a high risk of the `name` resolver breaking.

### First attempt, use a concrete type

So, we don't want that; let's take a first stab at a type: a `EmployeeDto` that we somehow get from a database/RPC call.

```typescript
// Somewhere in our ORM/RPC layer
interface EmployeeDto {
  id: number;
  name: string;
}

const resolvers: {
  Employee: {
    name(root: EmployeeDto): string {
      return root.name;
    }
  }
}
```

Great, this 1st step is much better (granted, simple field mappings like this don't need field resolvers, but pretend this logic is not a straight 1-to-1 mapping).

We've typed `name` field resolver, but we have to think of two other field resolvers: the `Employer.employees` and the `EmployeeAddress.employee` field resolvers.

With this first `EmployeeDto` typing approach, the full set of resolvers would look like:

```typescript
const resolvers: {
  Employer: {
    async employees(root: EmployerDto): Promise<EmployeeDto[]> {
      const employeeDtos = await dbCallForEmployees(root.id);
      return employeeDtos;
    }
  },
      
  Employee: {
    name(root: EmployeeDto): string {
      return root.name;
    }
  },

  EmployeeAddress: {
    async employee(root: AddressDto): Promise<EmployeeDto> {
      const dto = await dbCallForEmployee(root.employeeId);
      return dot;
    }
  },
}
```

The key observation is that all of:

* `Employer.employees` return type,
* `Employee.name` parameter `root`'s type, and
* `EmployeeAddress.employee` return type

Must match.

If you're in a large, complicated graph with multiple entries points to `Employee.name` like this, this can be very difficult to do and not break without realizing it.

However, now we've at least got a single type, `EmployeeDto`, to help us out.

That said, it's not entirely ideal because we've forced all of our callers to provide full `EmployeeDto`, regardless of whether: a) they have it loaded already, or b) it's required for the query.

I.e. for the `Employer.employees` resolver, with relational databases where the "many" side of a relationship is stored in the row, it probably already has the `EmployeeDto` rows pulled back from the database as a side-effect of issuing the `SELECT * FROM employee WHERE employerId = ...` query.

However, for the `EmployeeAddress.employee` resolver, it probably only has the `employeeId`, and is now coupled to knowing how to turn that into the `EmployeeDto`.

Or, for a query like `query / employeeAddress(...) / employee / id`, the client only wanted the id, which we had, but we did a throw-away lookup for the `EmployeeDto` merely to satisfy our resolver typing.

Or, for a query like `query / employeeAddress(...) / employee / fieldFromAnotherDb`, where `fieldFromAnotherDb` requires a RPC call to a separate micro-service/storage system (that is not `Employee`'s primary data store), we may have not even needed the `EmployeeDto` to fulfill the query, so again have done a throw-away lookup.

### Second attempt, a type alias

Instead of directly coupling to the `EmployeeDto`, it would be handy to have an **abstraction to specifically represent the contract** between our external resolvers (`Employer.employees` and `EmployeeAddress.employee`) and our internal field resolvers (`Employee.name`).

A type alias is a good way to represent this, i.e.:

```typescript
type EmployeeRoot = EmployeeDto;

const resolvers: {
  Employer: {
    async employees(root: EmployerRoot): Promise<EmployeeRoot[]> {
      const employeeDtos = await dbCallForEmployees(root.id);
      return employeeDtos;
    }
  },
      
  Employee: {
    name(root: EmployeeRoot): string {
      return root.name;
    }
  },

  EmployeeAddress: {
    async employee(root: AddressRoot): Promise<EmployeeRoot> {
      const dto = await dbCallForEmployee(root.employeeId);
      return dot;
    }
  },
}
```

In this incremental step, we've not really changed the semantics, but have setup the "typed root" alias that drives the name of this pattern.

### First option, a type union

Now with the abstraction away from the concrete type, we can provide more flexibility to our callers, i.e.:

```typescript
type EmployeeRoot = EmployeeDto | number;
```

Which means our `EmployeeAddress` resolver can be more agnostic about our implementation details:

```typescript
const resolvers: { 
  EmployeeAddress: {
    async employee(root: AddressRoot): Promise<EmployeeRoot> {
      return root.employeeId;
    }
  },

```

While the `Employer.employees` resolver can continue returning us the `EmployeeDto`s that it'd already happened to have.

Granted, this makes our own implementation detail more complex, because we have to check the types:

```typescript
Employee: {
  async name(root: EmployeeRoot): Promise<string> {
    if (root instanceof EmployeeDto) {
      return root.name;
    } else {
      const row = await dbCallForEmployee(root);
      return row.name;
    }
  }
},
```

Which for a lot of fields will becoming annoying, so we can introduce a helper method for the `if` check:

```typescript
Employee: {
  async name(root: EmployeeRoot): Promise<string> {
    const row = await loadIfNeeded(root);
    return row.name;
  }
},

async function loadIfNeeded(root: EmployeeRoot): Promise<EmployeeDto> {
  if (root instanceof EmployeeDto) {
    return dto;
  }
  return dbCallForEmployee(root);
}

```

### Second option, an ADT

A natural extention of the type union is to make it tagged so our `if` checks are cleaner:

```typescript
type EmployeeRoot =
  | { kind: 'dto', value: EmployeeDto }
  | { kind: 'id', value: number };
```

Which is a fairly standard convention in TypeScript.

### Won't tests cover this?

As always, I don't consider static types as a replacement for test coverage.

That said, I've found the hand-off between resolvers to be especially brittle in GraphQL codebases b/c the tendenacy is to test each resolver in isolation.

For example, if we use our 1st approach of having the `EmployeeDto` be the type root, we'd write tests for:

* Ensure `Employer.employees` returns `EmployeeDto`s
* Ensure `Employee.name` works with a `EmployeeDto`
* Ensure `EmployeeAddress.name` returns an `EmployeeDto`

Which is good for that point in time.

However, later let's say we need to refactor `Employee.name` to no longer take an `EmployeeDto`, i.e. because we're changing the source/micro-service it's coming from.

Without static types, it's hard to even realize that `Employer.employees` and `EmployeeAddress.name` needs additional test coverage: you basically need to audit your GraphQL schema and reason in your head about all of the entry points to your object type (`Employee`).

(Or else you would need to have a test that navigates `query / employeeAddress(...) / employee / name` to ensure the `EmployeeAddress.name` return type was grokked by the `name` field resolver; but are you going to do that for every field in `Employee`, for every entry point like `EmployeeAddress.employee` and `Employer.employees`? I suppose you could add an `assertValidEmployeeRoot(...)` method, which all of the tests used, but at that point you're effectively doing type checking in code.)

With the `EmployeeRoot` pattern, once we change the type alias, specifically in a breaking change way, we'll immediately be pointed to the field resolvers that: a) need to be fixed, and b) need new (or updated) unit tests which, without this compile error, probably would have kept passing by "yep, I return an `EmployeeDto`, np!".

### Won't all these ADTs be Annoying?

If all of your entities use an ADT as their type root, then yes that will probably be tedious (especially if all of your field resolvers have ~5-10 line `switch`/ADT pattern matching statements in them).

That said, I would anticipate that ~80% of the type roots in a project could/should be simple aliases, i.e. `type EmployeeRoot = EmployeeDto` or `type EmployeeRoot = EmployeeDto | number` and call that good.

The point is not to needlessly complicate your field resolver implementations for no reason (i.e. "they must _all_ be ADTs, `switch`es everywhere!").

However, by using the typed root pattern up front, from day one, you'll have the flexibility to change their definitions for service migrations or other infrastructure work that, without these types, can otherwise be extremely complicated and tedious to ensure all of the cross-resolver inputs/outputs still line up.


