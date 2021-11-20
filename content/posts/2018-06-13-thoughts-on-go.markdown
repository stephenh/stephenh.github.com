---
date: "2018-06-13T00:00:00Z"
categories:
  - Languages
title: Thoughts on Go (from a JVM Programmer)
---


These are my notes/thoughts while reading [The Go Programming Language](http://www.gopl.io/), from the lens of a long-time JVM programmer.

Note that I don't make constant Java comparisons to seem competitive, anti-Go, and pro-Java; instead I think mapping new concepts (e.g. Go syntax/features) onto your known/existing concepts (which for me is generally Java/JVM things), and then realizing how they are either slightly or significantly different from each other is just a good way to learn.

This is not meant as a Go tutorial, so I assume familiarity with Go, although I'll try and explain things here and there.

Wtf `GOPATH`
------------

It took me awhile to figure out the `GOPATH` thing.

My usual approach is to checking out code is have a top-level home directory, like `~/code` or `~/company`, and then clone projects into `~/code/project` or `~/company/project`.

Simple and it works for every language/project I've ever tried to build.

In Go, this is the Wrong Thing To Do.

The Go tooling, e.g. `go build` and `go test`, will refuse to work on any project that is cloned like this.

Instead, it expects a `GOPATH` to own all of your Go code, e.g. `~/go` by convention, and you use `go get github.com/org/project` to have the project automatically cloned in `~/go/src/github.com/org/project`.

And *then* the builds will work.

Bizarre.

I'm not sure why Go needs to be opinionated about this, especially when having a single `~/go` `GOPATH` (as recommended by convention) is committing the same "single/global package namespace" fiasco that many other languages have learned the hard way to avoid, as per-project versioning is necessary on basically any non-toy project.

Which, granted, sounds like `govendor` and similar tools now exist (post-Go 1.6), with first-class support for a per-project `vendor/` directory in the Go tooling (where you can put specific versions of dependencies that are scoped to your project), but the legacy `GOPATH` still being around seems super-odd and, AFAICT?, doesn't provide any value?

If it does, let me know in the comments.

Pointers Are A Thing Again?
---------------------------

Pointers seems like a step backwards, but I read a good [SO post](https://stackoverflow.com/questions/1863460/whats-the-point-of-having-pointers-in-go) that it allows efficient memory layout.

E.g. structs are created contiguously in memory, including any fields that are nested structs. E.g. you can have an `Employee` struct with a field `Address` struct inside of it, and they'll be contiguous memory, not just the `Employee`'s primitives + a pointer for `Address` at some random spot on the heap (which is what Java ends up with).

To get the contiguous memory, assigning values to the structs/nested-structs needs to be by-value/copy, so that those physical memory locations are actually populated.

Which is great, but as GOPL points out, you don't always want that (e.g. for cyclic structures like tree nodes), and so pointers let you opt out of that.

Fair enough, but it seems odd that structs are call-by-value *by default*, so in the majority of cases (I assert) where you really want call-by-reference, you have to *opt-in* via the boilerplate of pointers.

Also, maps and channels (and slices!) are actually call-by-reference (okay, call-by-reference-[ish](https://dave.cheney.net/2017/04/29/there-is-no-pass-by-reference-in-go)), because, yes, that "makes sense" as to what you usually want (I agree!), but it's not consistent with how structs are handled, where I also assert "by reference by default" makes the most sense.

I believe GOPL explained this (that maps/channels/slices are references) as a historical inconsistency, which is fair, but GOPL also had a blurb about "the strict `gofmt` rules allow deterministic AST parsing for source code transformations", so maybe they should just change it with a [codemod](https://github.com/facebook/codemod) (tongue in cheek). :-)

Also, IANAE, but I've read that C# and Swift have solved this value/stack vs. reference/heap issue without pointers, which seems preferable.

E.g. I know Scala/the JVM have considered allowing the stack vs. heap decision to be made at type declaration time, which generally seems less boilerplately than having to decide, at each usage site, which semantics you want. This is similar to how, IMO, Scala's declaration-site variance is preferable/less boilerplately than Java's usage-site variance.

So, dunno, I'm sure I would get used to pointers and could live with them, but seems like an odd choice.

"No Generics"
-------------

Go doesn't have generics "because you don't need them"...except for maps and channels...and arrays/slices...

Basically, the language designers get generics, but you don't.

Which is generally the opposite direction of "allow user code to have as much power as the compiler" that other new/advanced languages like Rust, Scala, etc. are going with macros/meta-programming.

Maps have a syntax of `map[key]value`, e.g. `map[string]int`, which is odd as the trailing `value` type is outside the last `]`...this is very special-cased for "the last type parameter is a return type" and doesn't seem like it would generalize well to `N`-arity generics.

I suppose you can treat `map[key]value` as a "built-in syntax", similar to arrays, and no one complains about arrays having a built-in syntax, e.g. `int[]` in C/C++/Java/etc.

However, arrays are fundamentally tied to memory layout, vs. just being a batteries-included data structure, so I'm not sure `map` is *that* special. Also, I did really like Scala's consistency of going the other way, and modeling arrays as "just another generic", e.g. `Array[Int]`.

Channels also have their own one-off generic syntax of `chan string`, which is odd as it has no brackets at all, which is fine/Haskell-like, but again seems hard to eventually generalize into first-class generics.

"No Inheritance"
----------------

Go structs don't have inheritance because "inheritance is evil"...and yet you can embed structs in another to get basically the same effect, e.g.

```go
struct Employee {
  SSN string
}

struct Account {
  // note there is no field name here
  Employee
}
```

Having only the `Employee` type, with no explicit field name, means all of `Employee's` fields become auto-aliased and can be referenced like `account.SSN`...hey look, we "inherited" the `SSN` field from `Employee`.

(Disclaimer: `Account` and `Employee` are really bad examples here.)

My understanding is the `Account.employee` field still exists under the covers, and `account.SSN` is just compiler syntax sugar that expands into `account.Employee.SSN`.

I need to learn more about this, but my initial reaction is that this seems similar to the JS proclamations of "prototypes are superior to classes", when, at the end of the day, they're so similar that most people solve/models problems the same way anyway.

My assumption is that struct embedding would end up being the same "everyone uses it as faux inheritance", at which point does it really matter whether it's inheritance or not?

E.g. Go seems to assert "structs must always be 'has a'", and "only interfaces can do 'is a'"...but at the end of the day, you often need to your data (structs) to model "is-a" relationships...so...

I'm not sure yet.

Seems somewhat similar to Protobuf/GRPC (which is another Google project) "not supporting inheritance", but really it just means people model inheritance in an informal, adhoc way anyway.

(Can I claim a Greenspun-style law? "Any language/framework that doesn't support inheritance, will see its users implement adhoc, informally-specified, bug-ridden approaches of half of proper inheritance?")

Upper Case for Public Access
----------------------------

In Go, the `Employee` type is exported from its package, because of the upper-case `E`, but the `employee` type is not. Same with functions/methods like `Name` vs. `name`.

Using upper case for `public` access is cute, admittedly very succinct, and I think I could like it.

However, one major downside is that interferes with the nearly-ubiquitous "type names are upper case, variable names are lower case" idiom from other languages.

E.g. in Go you might have `type foo struct { ... }` to represent a package-internal type, and so have methods like `func add(f foo)` , which, dunno seems weird to me.

I'm not sure the succinctness is worth giving up the type/variable name convention, vs. just having something like default-public + a `private` keyword.

Field Tags are Annotations
--------------------------

Field tags in Go are ways to add metadata to structs/fields, which is great, I like metadata, e.g.:

```go
struct Employee {
  FirstName string `json:first_name`
}
```

The `json:first_name` string is the field tag (which the JSON library will pick up to customize its handling of the `FirstName` field).

Field tags are dramatically simpler than annotations, as they are just key-value pairs, and even that is only by convention/encoding the key/value pair in a string. Which seems maybe a little too reductionist.

That said, I get using "it's just a string" likely dramatically simplifies (and speeds up) the compiler, because it does not have to go find and type-check a user-supplied annotation type, e.g `@MyAnnotation("foo_bar")`, and make sure the annotation type parameters are appropriate.

Which is slower, but checking those things is generally the point of a type-safe language/compiler.

"No Exceptions"
---------------

Go's approach to errors/exceptions seems reasonable; I was initially thrown off by the "no exceptions" label, but it does have panics which are extremely similar (e.g. panics unwind the stack, can be caught (in a `defer` function), etc.), so much so that I'd be tempted to just call them the same thing (from a **mechanism** perspective, I get the convention is different).

(Although note that in Go truly bad things like OOMEs are not panics, they are just exits, which I think is nice/fine, as the JVM mixing `java.lang.Error` into `java.lang.Throwable` can occasionally cause confusion, granted most of that was Scala specific.)

Per GOPL, the biggest difference between exceptions and panics is that Go has stronger conventions around when to use/not use panics (e.g. in the JVM, catching exceptions is common, in Go catching panics should be rare).

Specifically, the convention is that error codes are similar to (well-used) checked exceptions in Java: only for "expected errors" like I/O.

Panics are reserved for "unexpected errors", e.g. bugs, e.g. runtime exceptions in Java.

So, while Java has been all over the place in its conventions (started out with lots of checked exception abuse, and has retreated to runtime exceptions for all things), Go is starting out with strong conventions on "expected errors == codes vs. unexpected errors == panics", which to me is more important than the semantics of exceptions vs. return values.

For example, a common complaint about checked exceptions is that they "litter" the call chain up the stack until they are handled; however, Go's error codes would similarly need to be percolated up the call chain until they are handled (e.g. if you're 5 methods deep, and now make a call that returns `error`, you likely need to change your own return type, and all the return types above you, to pass the `error` up the stack). And, if anything, in a more verbose way since this percolation is not handled by stack unwinding.

So, at that point, whether your method has `throws FooException` or `return (... error)` seems somewhat of a wash, at least in terms of boilerplate/annoyance.

That said, while Java's checked exceptions are "must always be handled" enforced, you can opt-out of this with Go's error codes by just ignoring the 2nd/error code return value. So that is nice.

Anyway, my simplistic view for JVM programmers: error codes are checked exceptions (they're documented/percolated in the API), while panics are runtime exceptions (they're unpredictable).

And, again, the technical distinction is somewhat moot, IMO, vs. the bigger factor that Go has had strong/consistent conventions applied from day 1.

So, seems fine, and I do like how the convention handles layering of error code information as it manually unwinds the stack.

Method Declarations
-------------------

Go has methods, e.g. you can do `employee.Name()` (where `employee` is an `Employee` struct instance), but methods are just special function declarations that are not enclosed within the traditional `Employee` class or struct block.

E.g. the definition for `Name()` that allows `employee.Name()` is:

```go
func (e *Employee) Name() string { ... }
```

This is cute because it highlights that methods are just functions with a special 1st argument (similar to Python's `self` argument), called the receiver.

And it also highlights that structs are open, e.g. anyone can add their own new methods to existing structs. Which I think in traditional OO is not considered kosher, but since you're limited to the external/public API anyway, I don't mind the syntax sugar. E.g. extension methods in C# are similar and nifty.

However, I wonder whether the boilerplate of writing `(e *Employee)` over and over, for each method declaration, is worth the cuteness vs. just giving a syntax sugar for:

```go
class Employee {
  func Name() string { ... }
}
```

Okay, I get it, `class` is a dirty word, how about:

```go
methods Employee {
  func Name() string { ... }
}
```

Granted, the notation needs to handle pointers vs. values, but dunno, just seems repetitive to re-type that first `(e *Employee)` each time (especially as type names get longer, which they invariably do in large/complex project).

But perhaps the mental clarity is worth it.

Odd `interface{}` syntax
------------------------

In Go, you can accept `interface{}` as a type, and it basically means "this interface could be anything", e.g.:

```go
func doSomething(foo interface{}) string {
  ...
}
```

Which, I get it, `interface{}` means "the empty interface", but other languages give their similar top types a dedicated name like `any` or `Object`.

Granted, this is slightly different as it's not actually the top type, as interfaces lives in a different namespace than types themselves (e.g. there is no object hierarchy between `int` and `float` and `struct Employee`, this is only for interfaces).

Dunno, just seems worth a keyword to avoid the `{}` after the type name. Who knows, maybe you'll want to use `{}` for generics someday. :-)

Structural Typing
-----------------

Similar to TypeScript, Go's interfaces are structurally matched, e.g. a struct `Employee` doesn't have to have an `implements Printable` in its declaration to be cast/accepted as the `Printable` type.

Instead, Go just needs to be able to match the `Employee` shape to the `Printable` shape (e.g. they both have the `PrintOut()` method).

Furthermore, per earlier, since you can declare your own methods for structs, you can retrofit existing/3rd-party structs into whatever interface/shape you want.

Which I think is great; initially I was skeptical that "interfaces are not just shape, they are semantics", but I've come around, it's really handy to adapt 3rd-party/uncontrolled objects to your own abstractions.

There was a proposal to add something similar to the JVM, [interface injection](http://openjdk.java.net/projects/mlvm/subprojects.html#InterfaceInjection), granted as a tool for language implementors, and not as part of the Java language proper.

And, of course, it's not implemented yet.

But, a win for Go here, I like it.

Type Switches
-------------

Go allows switching on the concrete type of an interface, similar to `instanceof` in Java, e.g.:

```go
func doSomething(foo: interface{}) {
  switch foo.(type) {
    case int: ...
    case string: ...
  }
}
```

And within each case statement, the `foo` variable will be implicitly cast to the matching type. Which is handy.

This seems like a useful language constructor.

That said, I'll nit pick :-) that the GOPL book asserted this allows Go to have discriminated unions/ad hoc polymorphism (which is where instead of handling polymorphism through "different behavior is in different methods in my centralized class hierarchy", you handle polymorphism by "different behavior is in different case statements throughout my user program"; there are trade-offs to each).

Definitely agreed this allows ad-hoc polymorphism, but IMO it's not discriminated unions, because there is no way to restrict the `foo` type to only the subset of types we actually handle (e.g. `int` and `string` in this case).

In other languages, again picking TypeScript, discriminated unions are modeled like `foo: int | string`.

Go's approach is basically passing around `java.lang.Object`, and so not type-safe.

Which is fine, it's what you'd do to achieve ad hoc polymorphism in Java as well, but Java doesn't claim to have discriminated unions.

(Admittedly, this was just one sentence in GOPL, and not the Go marketing website or what not.)

Go Channels
-----------

Perhaps simplistic, but go channels are just queues: either unbuffered (e.g. Java's [SynchronousQueue](https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/SynchronousQueue.html) or [LinkedTransferQueue](https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/LinkedTransferQueue.html)) or buffered (e.g. Java's [LinkedBlockingQueue](https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/LinkedBlockingQueue.html)).

A quick example:

```go
words := make(chan string)
// fire up a new goroutine to read words
go func() {
  // read/process a word
  word := <-words
}()
// write some words
words <- "first"
words <- "second"
```

My initial skepticism is that go routines/collections should be a library rather a platform feature.

However, that is likely (okay, definitely) wrong, because the crux of goroutines is not thread-safe collections, it's high-volume scheduling (e.g. `N` fibers running on `M` threads where `N >> M`), which is inherently a platform/runtime feature.

I'm not sure the latest/best way to do this on the JVM; [Quasar](http://docs.paralleluniverse.co/quasar/) looks dead, Clojure has a new [core.async](https://github.com/clojure/core.async) but I haven't found what it uses for underlying scheduling.

I suppose [Akka](https://akka.io/) is most likely the JVM equivalent, but it assumes actors, which is a slightly different model than typed queues.

The runtime support aside (haha, that is a big disclaimer), I don't see anything that makes currency from a language/type-system perspective easier to do in Go.

E.g. the one-way channel syntax (which you can use to pass around read-only or write-only channel variables, to prevent code from accidentally reading from something it's only supposed to write to) , `<-chan int` and `chan<- int`, again seems like a cute language-specific syntax hack for what generics would handle with a `WriteOnlyChannel[int]` or what not.

Hm, well, I might be wrong: the `select` that blocks on `N` channels looks unique/can't do that with a library:

```go
// waits for either channelOne or channelTwo
select {
  case <-channelOne: ...
  case <-channelTwo: ...
}
```

Doing a blocking read from two queues like this is hard in vanilla Java. However, it is pretty close to an actor responding to `N` messages.

Granted, the channels are typed, and communication is more about "publishing to a queue" than "publishing to an actor", which personally I prefer.

So, nit picking their special syntax status aside, channels look nice/well done. 

Other interesting notes:

* Every channel operation (read/write) flushes memory barriers, so you can use them as synchronization primitives.
* Channel scheduling is done via language/runtime hooks, e.g. waking up from a blocked read on a channel doesn't require a hardware interrupt, instead the channel that you're blocking on knows via bookkeeping that you're waiting for it, so you'll get implicitly/automatically scheduled, all in-process (I think).

Other Misc Pros
---------------

Things I like:

* Static binaries are great.

  I like deploying as static binaries. I wish Java's GraalVM would have come out ~5+ years ago.

  Given my previous nitpicks with the language above, I can see deployment simplicity being a large factor in why it's become popular, especially in the cloud tooling world.

* The compiler speed/productivity is amazing.

  I made a quick VS Code project for an existing, medium-ism Go project, and it had all of the nice IDE features with little hassle (`GOPATH` aside) and very quick, very solid.

  That's great.

  Obviously a huge win, albeit the "speed is non-negotiable" stick is also what they beat down features like generics with. But at least it really is fast.

Other Misc Cons
---------------

Things I don't like:

* Unlikely to have cross-platform ambititions.

  Go seems unashamedly a server-side language + runtime. Which is fine, specialization is good, although as a nit-pick I think it's only really necessary for the runtime requirements of goroutines (e.g. the `m:n` scheduling infrastructure). (E.g. if you gave up goroutines, the rest of the language could be cross-platform.)

  But, in a perfect world, I'd prefer using the same language on mobile, web, and server. It just lessens the cognitive overhead vs. a team/org having to support `N` platforms with `N` distinct super-unique codebases.

  Note, I said "perfect world", as we're not always there yet, but I think languages that move us closer to that (primarily TypeScript via JavaScript eating the world, but also Kotlin via JVM/JS tranpilation, and others) are great to see.

* No functional programming.

  I like the OO/FP blend of Scala, and attempts to do similar in other languages, e.g. `map` and `filter` show up everywhere these days (not to insinuate Scala invented them, it's just where I was exposed to them first).

  However, Go sucks for functional collections, e.g. they're not built-in, nor can you roll-your-own due to the lack of generics.

  Also, the community, [at least in 2014](https://groups.google.com/forum/#!topic/golang-nuts/RKymTuSCHS0), seemed borderline rude about it: "Newbies should learn the language they're trying to learn".

  I get that FP-a-la Java Streams is way more expensive than `for` loops, and Scala had it's fair share of "oops, rewrite the slow FP as fast imperitive", but seems like that should be a challenge to solve, not dismiss as "if you want/like FP, you must be using Go wrong".

Conclusion
----------

So, those are my notes/thoughts.

I don't think I personally would choose Go for a new personal project; to me there are enough language warts that are not offset by enough "only available in Go" features.

But I also don't think I'd hate working on a Go codebase, as, to their credit, the stake-in-the-ground around compiler performance and associated developer and tooling productivity is very nice.

I good see that ending up changing my mind.

Fast feedback loops can make up for a lot of deficiencies.

And the opposite is not true, e.g. perfection with a slow feedback loop is not actually perfection, and can actually be dramatically worse.


