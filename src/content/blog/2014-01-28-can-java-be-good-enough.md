---
title: Can Java Be Good Enough?
description: ""
date: 2014-01-28T00:00:00Z
tags: ["Languages"]
---



At [Bizo](http://www.bizo.com), we use basically exclusively Scala on the server-side. We're big fans.

That said, we have a few Java codebases left, either legacy server-side codebases that haven't been converted/rewritten yet, or GWT client-side webapps.

Now that Java 8 is coming out in March 2014 (don't jinx it!), I've been mulling what would make Java "good enough", e.g. for it not to be completely painful to write Java code after having been spoiled by Scala.

Obviously this would be different for everyone. But after thinking about it, I think, for me, I can distill it down to 2 syntax features, and 1 type system feature, half of which are already on the way:

* Lambdas with powerful collections (Java 8)
* The `val` keyword
* Declaration-site type variance

Lambdas with powerful collections
---------------------------------

Java 8 is already addressing this, of course, but it has been the biggest pain point for years.

After you've written cute code like this all day:

```scala
val bar = foo.filter { _.getColor == "red" }
```

Going back to:

```java
List<SomeType> bar = new ArrayList<SomeType>();
for (SomeType foo : foos) {
  if (foo.getColor().equals("red")) {
    bar.add(foo);
  }
}
```

Is brutal. So many Java methods are 2-4x longer than they need to be solely due to this.

But, the future is (almost) here:

```java
List<SomeType> bar = foos.filter(f -> f.getColor().equals("red"));
```

I'll readily admit that I still prefer the Scala version (the `_` placeholder, no `;`, no parenthesis, etc.), but I'd still take the Java version.

The val keyword
---------------

Personally, I believe Scala has just the right mix of type inference.

You need type declarations at method boundaries (so you need to document your parameter types and return type, i.e. no program-wide inference), but within the method, most things can be inferred.

After typing:

```scala
val bar = getSomeDataStructure();
```

Going back to explicit types for every single little variable:

```scala
final Map<OneTypeThatIsReallyLong, List<SomeTypeThatIsReallyLong>> bar =
    getSomeDataStructure();
```

Makes my fingers cry a little each time.

I would love to have `val` in for loops as well:

```java
for (val foo : foos) {
  foo.whatever();
}
```

Unfortunately, I suspect that `val` is never going to happen in Java (aside from [Lombok](http://projectlombok.org/), those crazy, wonderful guys), because it goes against the ethos of "be boring and explicit everywhere".

Which, yeah, I understand why boring and explicit is, a lot of times, good for the long-term readability and maintenance of a codebase.

But I'd still appreciate some leeway, especially within method bodies, by having `val` available.

And, hey, C# has it (`var`).

Declaration-site Type Variance
------------------------------

I'm not going to try and do a good of explanation of this, but Scala's feature where you can decide *once* for each type (like `ArrayList` or `Seq`, etc.) whether it's contra-variant is so much more succinct and DRY than Java's use-site type variance.

I'll try a small example. Here's some code in Java:

```java
public void processFruit(List<? extends Fruit> fruits) {
  // do something with fruits...
}

List<Apple> apples = new ArrayList<Apple>();
processFruit(apples);
```

Note the really ugly `<? extends Fruit>`. In Java, you just get used to typing these all the time when you want to pass lists around with polymorphism.

(Pedantically, the `?` keeps `processFruit` type-safe; because `processFruit` has no idea what the `?` type actually is, it can never call `fruits.add`. This is actually good, because calling `fruits.add(banana)` would be bad when the caller had passed in an `List<Apple>`.)

Scala has a much better solution:

```scala
def processFruit(fruits: Seq[Fruit]) = {
  // do something with fruits
}

val apples: Seq[Apple] = Buffer[Apple]();
processFruit(apples)
```

Note we can just type `Seq[Fruit]`. How short and sweet!

This is because the `Seq` type was declared like:

```scala
trait Set[+T] { ... }
```

Note that `+` before `T`. That basically tells the type system that "you can always assume the user really meant `Seq[? extends T]`" whenever they actually typed `Seq[T]`.

(Pedantically, again, the reason this works is that `Seq` *has no add method*. Because it has no mutating methods, it basically doesn't matter if `processFruit` treats `Seq[Apple]` as if it was a `Seq[Fruit]`. It can never accidentally add a `Banana`, so it is still, like the Java version, type-safe.)

The rub is that, in in Scala, the *type* declared it's variance type-safety *just once*, and now every single method parameter or local variable that wants to generically accept the type does not have to repeat the `? extends Fruit` incantation. This is really nice.

I am not at all a type system expert, but I'd like to think that since the Java type system already has the notion of use-site variance, that declaration-site variance could be grafted on in a basically pleasant manner.

Traits
------

I almost did include traits, and it's not on my official list, because I only occasionally find myself missing them, vs. the previous things that I find myself cursing on a regular basis.

But, hey, Java 8 is getting [default methods](http://zeroturnaround.com/rebellabs/java-8-explained-default-methods/).

```java
public interface A {
  default void foo(){
    System.out.println("foo called");
  }
}
```

Which is the same as:

```scala
trait A {
  def foo(): Unit = {
    println("foo called")
  }
}
```

So we might as well mention it.

Scala Features That Didn't Make the Cut
---------------------------------------

Contrary to some FUD, I really do think Scala is a clean, elegant language. I generally don't complain that any of the features are too complex or too unwieldy. I think it all fits nicely together.

That said, there are some Scala features that, all things considered, I don't often find myself missing in Java:

* The `object` keyword--this is nice, but really it just makes it "okay" (blessed by the language) to sprinkle singletons all over your codebase. Not something I find myself missing.

* Implicit conversions--as a framework/DSL writer, these are sexy, but not critical.

* Operator overloading--nice to have, but eh.

* Macros--this is somewhat surprising, given I am an admitted compile-time code generation junky, but so far Scala's macros haven't convinced me they're indepensible.

* Typeclasses--*maybe* if Scala eventually uses these for type-safe equality, I'd be a fan, but otherwise I don't often (ever?) find myself thinking "damn, I wish I could do type classes here".

* Pattern matching--I use pattern matching all the time in Scala (especially with `Option`), but I rarely feel the twinge "man I wish I had that" when in Java. I think pattern matching is very nicely integrated into the Scala language, but I don't think that means that Java (or other languages) must automatically copy it.

These all fit nicely into the Scala language, but I don't think any of them would have to be shoved into Java to consider Java a "good enough" language.

Java Strengths That I Personally Still Enjoy
--------------------------------------------

Despite the lagging reputation, Java still has a lot of strengths:

* The compile speed! I had not realized how spoiled Eclipse's `ecj` and Oracle's `javac` had made me, in making compile time basically never noticable.

  I don't think Scala is bad enough to allow chair-jousting time, but, yeah, it's not great.

* The Java IDEs "just work". The Eclipse Scala IDE has gotten an awful lot better, but the polish just isn't there yet.

* The Java IDEs have refactorings that are actually implemented. I know Scala has a toolset in place for this, but whenever I try refactorings in the IDE, they still don't do anything.

* Java is the lowest common denominator of the JVM--you can write a library or framework, and not worry about other JVM languages have difficulty consuming your work.

When Would I use Scala vs. Java?
--------------------------------

At this point, Scala is my default language. It's just that nice. That said, I'm not a zealot, and could see myself opting for Java:

* If Scala is not supported/well-supported in a given environment (embedded?, Android?, GWT is important to me, etc.).

* If I knew that the codebase would eventually be 50k+ LOC. I can't imagine the Scala compiler being very pleasant on codebases over 20-30k LOC.

* If I knew that the codebase would live 5+ years. Java will definitely be around and healthy in 5 years. What about Scala? The VCs will have wanted TypeSafe flipped by then, so perhaps it ends up at VMWare, or, well, VMWare, and they're continuing to invest it. Which, who knows, an even larger break from academia might be good for Scala in the long run.

To these last two points, perhaps the answer is to just avoid 50k+ LOC/5+ year systems in the first place. Which I know to many is just naive, but I've been surprised at how well Bizo has managed to evolve as "100s of small codebases" rather than "1-2 huge codebases".

Peak Scala?
-----------

I cannot take credit for this, but one of my astute coworkers made this observation:

1. Anyone who is so frustrated with Java that they'd adopt Scala, probably already has.

2. With Java 8, Java is getting demonstrably more "good enough" (especially to those who have held out using it for this long), that it's actually becoming less likely that Java users will convert to Scala.

So, based on these observations, is it likely that Scala has hit peak adoption? Who's left to switch?

I was originally very skeptical of his claim, as it smacks of FUD.

And, personally, I know I constantly underestimate "how many people are out there", be it as customers of online retail, brick and mortar retail, or even just users of programming languages. My weakness is always assuming that the current state is a steady state, and not still a transition.

So, yes, there are probably many, many programmers out there who will still switch to Scala. I hope they do. It's a great language.

But, since my static typing bias keeps me in GWT, and so Java, on a daily basis, with Java 8 coming soon and promising to usher in an era of "modern Java"...I dunno. It's interesting.

Can Oracle Pull Off a Modern Java?
----------------------------------

It is tempting to be seduced into thinking Oracle might build some momentum here, and continue on a road to a modern Java that is not embarrassing for programmers to admit is their primary/preferred language.

That said, I have not been super-impressed with the post-Java 8 road maps. The Jigsaw/OSGI thing in particular seems like a large distraction, IMO. Dunno, I could very well end being wrong on Jigsaw, but personally I'd prefer more Java-the-language focus.

If Oracle did happen to get serious about making modern Java (basically catching up/passing C#), I think it would be a huge dent in the adoption of the various "Java Next" contenders (Scala, Ceylon, Fantom, etc.).

Perhaps this is an obvious assertion, but I think it's much more realistic now than it has been in the past.

So, Can Java Be Good Enough?
----------------------------

I know several of my coworkers will heavily object to the idea that "Java + a few fixes" would ever be as sexy as Scala.

And they're right. Scala is always going to be the sexier language when compared to Java.

And, to their credit, I highly doubt that, while at Bizo, I'll ever lobby to start a new server-side project in Java. Even if it was super-high performance/whatever. For us, Scala has won.

But an industry standard language doesn't necessarily have to be (and almost always isn't) the sexiest language on the block. It just needs to GSD.

So, I guess I'm saying to Oracle, Java will never be Scala--but that's fine, you could still win me back.

Java can be good enough. And Java 8 is much closer. Keep it up!


