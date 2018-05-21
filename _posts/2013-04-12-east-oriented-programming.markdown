---
layout: post
title: East-Oriented Programming
section: Testing
---

{{page.title}}
==============

In chatting with a coworker today about mocks vs. stubs (prompted by Fowler's [Mocks Aren't Stubs](http://martinfowler.com/articles/mocksArentStubs.html)), I was reminded about the concept of ["east"-oriented programming](http://jamesladdcode.com/2011/06/12/more-east-2/).

To understand "east", think of a map, like north, south, east, west; the idea, as far as I understand, is that west-oriented is stateful (you call methods and work on the return values), while east-oriented is stateless (you pass lambdas or interface implementations). 

As an example, this is normal/stateful/return-oriented programming:

```scala
class Customer {
  val name: String
  val description: String 
}

// print a customer
println(customer.name)
println(customer.description))
```

Where as this is stateless/east-oriented programming:

```scala
class Customer {
  private val name: String
  private val description: String 
  def printOn(writer: CustomerWriter) {
    writer.printName(name)
    writer.printDescription(description)
  }
}

trait CustomerWriter {
  def printName(name: String)
  def printDescription(name: Description)
}

// print a customer
customer.printOn(new CustomerWriter() {
  override def printName(name: String) {
    println(name)
  }

  override def printDescription(desc: String) {
    println(desc)
  }
});
// could have a suite of CustomerWriter implementations,
// e.g. System.out/JSON/etc., decorators, etc.
```

The topic of east-oriented programming came up because east-oriented programming is the one style where I think you could use a mocking library extensively and not have crappy tests.

To explain, and as the [More East](http://jamesladdcode.com/2011/06/12/more-east-2/) post notes, as soon as you start wanting your program to use return values, mocking starts to suck. Each individual test needs to start anticipating ahead of time (when setting up the mock `expects`/etc. clauses) the needed return values.

Taken to an extreme, each test starts re-implementing the stateful behavior of the collaborators, but via the mocking library's DSL, and things just get verbose and ugly. In my opinion, this is when stubs start looking awfully nice (you can implement the fake stateful behavior simply/directly in the language itself, and reuse it across all of your tests).

But, if like east-orientation, your style avoids/limits return values, and uses more event-/interaction-style contracts between collaborators, then mocks aren't so bad.

I believe east-oriented programming is also the style preached (perhaps not with that name) by the [Growing Object Oriented Software with Tests](http://www.growing-object-oriented-software.com/) book, whose mock-heavy style I'm not a huge fan of, but whose authors I really respect because they write good code and are the only other people in Java land these days that eschew DI containers.

As far as my personal opinion of east-oriented programming, to me it looks like you're just moving the coupling around--instead of the coupling being in return values, the coupling is in your interface contracts.

Granted, east-orientation means you get to say nifty things like "the internal implementation details of the object are protected" (e.g. there are no getters), but is calling a getter really any different than being passed the same value as a method parameter? Especially on some object that suddenly starts looking like a visitor (translation, that is not a good thing)?

Furthermore, in the above example, the `CustomerWriter` API and is now dictating how your client code must look (it must be spread through the `printXxx` methods) instead of being arranged however naturally fits your problem (where you could call getters on a whim).

Thinking more about it, I think this "replace getters with an `XxxWriter`" example probably is not doing east-orientation justice. If I end up re-reading GooS again, I will keep an eye out for examples I can past in here.

Nonetheless, I'm left thinking that east-orientation is great *if* you really want to use a mocking library. Then it will make your tests suck less. But, in my opinion, stubs will also make your tests suck less, and not require absolving your code of return values.

(One flaw of stubs if that you have to be careful to not start having unit tests rely on having "the whole system but just with stubs" to test their individual component, and instead keep things isolated. Mocks force you to do this because mocking out this much behavior would be impossible. With stubs, it is possible, but just takes discretion to not abuse it.)

Anyway, I really enjoy reading topics like east-orientation, that try to find "a better way" of structuring systems. I'm glad it's working out for some, and since it came up again, I'm going to try and keep it in mind while I'm writing code to see if I see any patterns emerge. But, for now, I don't think it's quite the game-changing idiom that I was thinking it might be when I originally read about it.



