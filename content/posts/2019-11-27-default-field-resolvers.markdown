---
date: "2019-11-27T00:00:00Z"
categories:
  - TypeScript
title: Teaching TypeScript about GraphQL Default Resolvers
---


When implementing GraphQL resolvers in Apollo, it is common to lean on the Apollo/graphqljs behavior of default field resolvers.

I.e. if you have a GraphQL schema like:

```graphql
type Author {
  firstName: String
  lastName: String
}
```

It gets tedious to write an `Author` object resolver that has boilerplate `firstName` and `lastName` field resolvers, i.e.:

```typescript
const AuthorResolver = {
  firstName: (author: Author) => author.firstName;

  lastName: (author: Author) => author.lastName;
}
```

To avoid this tedium, Apollo/graphqljs lets us just skip defining those field resolvers, and if your `AuthorResolver` does not implement a `firstName` field resolver method, it will just call `author.firstName` for you.

This is great for boilerplate reduction, but is usually not represented in the type system, so if your GraphQL schema defines a field, like `Author.middleInitial`, but that's not defined on your `Author` DTO, then you'll get a runtime error instead of a compile time error.

I really like using the [graphql-code-generator](http://www.graphql-code-generator.com) project to bring type safety to our resolver implementations, but by default it also represents field resolvers as optional keys, i.e. if you're using their generated types, you can do the same "do not manually define `firstName` and `lastName` behavior", i.e.:

```typescript
const AuthorResolver: AuthorsResolvers = {
  // ...other non-firstName/non-lastName resolvers if you have them ...
}
```

Where `AuthorResolvers` is their generated interface/contract for your `Author` type, which has its the field resolvers as optional by default:

```typescript
export type AuthorResolvers<...> = {
  firstName?: Resolver<...>,
  lastName?: Resolver<...>,
  middleInitial?: Resolver<...>,
}
```

Which does correctly mirror the Apollo/graphql "well, you don't need them if they match up" behavior, and so works great for our 1-to-1 fields of `firstName` and `lastName`.

However, it won't (by default) cause a compile error if we miss defining our custom `middleInitial` field resolvers.

Thankfully, if you're OCD about type safety, they have a configuration flag, `avoidOptionals`, which turns the `AuthorResolvers` type definition into:

```typescript
export type AuthorResolvers<...> = {
  firstName: Resolver<...>,
  lastName: Resolver<...>,
  middleInitial: Resolver<...>,
}
```

Ah great, we're forced to implement these methods now.

However, we're back to "well, that's going to be a lot of boilerplate for the x% of fields that really just 1-to-1 mappings".

Ideally we'd like to still get those default resolvers for free, but also have the TypeScript type system know that they are there, such that we're only forced to implement our truly custom field resolvers (like `middleInitial`).

A cute way of doing this is leveraging TypeScript's ability to "lie" to the type system, which needs to be used cautiously, but is a form of meta-programming that can come in handy.

Specifically, we can use a method like:

```typescript
function defaultResolver<T>(): { [K in keyof T]: Resolver<T[K], T, {}, {}> } {
  return {} as any;
}

// Used in defining our resolver map:
const resolvers: Resolvers = {
  Author: defaultResolvers<Author>,

  ...
}
```

The way this works is that the return type of `defaultResolver` says "yes, I take responsibility for implementing a field resolver for every key in `T`, and that resolver will return `T[K]`, i.e. exactly that fields type".

An initial implementation of `defaultResolver` might return a proxy that does this, i.e. if the proxy's getter is called with the key `firstName` (i.e. Apollo is looking for the `firstName` field resolver), the proxy could return a function that calls `author.firstName`. I.e. basically a reimplementation of Apollo/graphql's default behavior.

The cute aspect of this alternative implementation is to realize that we "know" (admittedly as an implementation detail) that the Apollo/graphql's behavior will kick in if the `resolver.firstName` key is undefined, so we can simplify return `{}` as our resolver implementation, which will have no keys and so invoke the Apollo/graphql default behavior for anything that is resolved.

It might seem like this is missing the point, i.e. we're back to the dynamic Apollo behavior we were trying to get away from; but not really, we were technically fine with that behavior, we just wanted it represented in the type system, which is what we've accomplished with our `defaultResolver` method's return value.

Note that, right now my example/usage is very basic because my root/parent entities (i.e. `Author`) are also generated by graphql-code-generator and so effectively forced to map 1-to-1 to the GraphQL type anyway; so this is primarily effective for basic DTOs (like mutation return payloads/etc.), and more complicated parent/root objects (especially those driven by ADTs) will need per-field specific behavior, which is actually fine/and now the type system will tell us when those are needed.

That said, the type system will resolve the contract across object spread notation, so something like:

```typescript
const AuthorResolver: AuthorResolvers = {
  ...defaultResolver<AuthorEntity>,

  middleInitial: (author: AuthorEntity) => {
    return customLogic;
  }
}
```

Will allow you to mix both the "any field on `AuthorEntity` can map 1-1 to the `Author` GQL type", as well as provide one-off behavior, and have the type system think that you've got a fully implemented object resolver for every GraphQL field, without actually providing that boilerplate.






