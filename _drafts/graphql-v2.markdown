

### Not null by default

```graphql
type Author {
  firstName: String
}
```

This should be required.

I get the rationale, but most languages these days are going "not null by default is the safest". Granted, languages vs. APIs, but I like the consistency.

### Key Presence vs. Value Optional

I want to be able to represent "you don't have to include `firstName`, but if you do, it can't be null":

```graphql
input Author {
  firstName?: String
}
```

### Lean into Node Identity

It seems odd that a query like:

```graphql
query Books {
  books {
    author {
      firstName
    }
  }
}
```

Will duplicate the `Author` with `id:1` N times in the response.

Granted, gzip, and granted "but it makes JSON easier", but for clients that use Apollo/etc. anyway.

Something more like flatpack.

### Represent Bi-Directional Associations

If an offline client wants to have a subset of the graph, it'd be really convenient if it could do as many "database-like" things as possible, i.e. if I update `book1.author = author1` then `author.books` will now have `book1` in it.

Granted, you can only do this if you've fully fetched the `author.books` collection already.


