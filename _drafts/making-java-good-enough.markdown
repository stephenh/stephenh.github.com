---
title: Making Java Good Enough
layout: draft
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com), we pretty much use exclusively Scala on the server-side. We're big fans.

That said, we have a few Java codebases left, either legacy server-side codebases that haven't been converted/rewritten yet, or GWT client-side webapps.

Now that Java 8 is coming out in March 2014 (don't jinx it!), I've been mulling what would make Java "good enough", e.g. for it not to be completely painful to write Java code after having been spoiled by Scala.

Obviously this would be different for everyone. But after thinking about it, I think, for me, I can distill it down to 2 syntax features, and 2 type system features, half of which are already on the way:

* Lambdas with powerful collections (Java 8)
* The `val` keyword
* Declaration-site type variance
* Traits (Java 8)

Lambdas with powerful collections
---------------------------------

Java 8 is already addressing this, of course, but it has been the biggest pain point for years.

After you've written cute code like this all day:

    val bar = foo.filter { _.getColor == "red" }
{: class="brush:scala"}

Going back to:

    List<SomeType> bar = new ArrayList<SomeType>();
    for (SomeType foo : foos) {
      if (foo.getColor().equals("red")) {
        bar.add(foo);
      }
    }
{: class="brush:java"}

Is brutal. So many Java methods are 2-4x longer than they need to be solely due to this.

But, the future is (almost) here:

    List<SomeType> bar = foos.filter(f -> f.getColor().equals("red"));
{: class="brush:java"}

I'll readily admit that I still prefer the Scala version (the `_` placeholder, no `;`, no parenthesis, etc.), but I'd still take the Java version.

The val keyword
---------------

Personally, I believe Scala has just the right mix of type inference.

You need type declarations at method boundaries (so you need to document your parameter types and return type, i.e. no program-wide inference), but within the method, most things can be inferred.

After typing:

    val bar = getSomeDataStructure();
{: class="brush:scala"}

Going back to explicit types for every single little variable:

    final Map<OneTypeThatIsReallyLong, List<SomeTypeThatIsReallyLong>> bar =
        getSomeDataStructure();
{: class="brush:scala"}

Makes my fingers cry a little each time.

I would love to have `val` in for loops as well:

    for (val foo : foos) {
      foo.whatever();
    }
{: class="brush:java"}

Unfortunately, I suspect that `val` is never going to happen in Java (aside from [Lombok](http://projectlombok.org/), those crazy, wonderful guys), because it goes against the ethos of "be boring and explicit everywhere".

Which, yeah, I understand why boring and explicit is, a lot of times, good for the long-term readability and maintenance of a codebase.

But I'd still appreciate some leeway, especially within method bodies, by having `val` available.

And, hey, C# has it (well, `var`, but close enough).

Declaration-site Type Variance
------------------------------

I'm not going to try and do a good of explanation of this, but Scala's feature where you can decide *once* for each type (like `ArrayList` or `Seq`, etc.) whether it's contra-variant is so much more succinct and DRY than Java's use-site type variance.

I'll try a small example. Here's some code in Java:

    public void processFruit(List<? extends Fruit> fruits) {
      // do something with fruits
    }

    List<Apple> apples = new ArrayList<Apple>();
    processFruit(apples);
{: class="brush:java"}

Note the really ugly `<? extends Fruit>`. In Java, you just get used to typing these all the time when you want to pass lists around with polymorphism.

Scala has a much better solution:

    def processFruit(fruits: Seq[Fruit]) = {
      // do something with fruits
    }

    val apples: Seq[Apple] = Buffer[Apple]();
    processFruit(apples)
{: class="brush:scala"}

Note we can just type `Seq[Fruit]`. How short and sweet!

This is because the `Seq` type was declared like:

    trait Set[+T] { ... }
{: class="brush:scala"}

Note that `+` before `T`. That basically tells the type system that "you can always assume the user really meant `Seq[? extends T]`" whenever they actually typed `Seq[T]`.

This is really spoiling, as it's just even less typing that you have to do.

I am not at all a type system expert, but I'd like to think that since the Java type system already has the notion of use-site variance, that declaration-site variance could be grafted on in a basically pleasant manner.

Traits
------

I was almost not going to include traits, because I only occasionally find myself missing them, vs. the previous things that I find myself cursing on a regular basis.

But, hey, Java 8 is getting [default methods](http://zeroturnaround.com/rebellabs/java-8-explained-default-methods/).

    public interface A {
      default void foo(){
        System.out.println("foo called");
      }
    }
{: class="brush:java"}

Which is the same as:

    trait A {
      def foo(): Unit = {
        println("foo called")
      }
    }
{: class="brush:scala"}

So we might as well put traits on the list.

Scala Features That Didn't Make the Cut
---------------------------------------

Contrary to some FUD, I really do think Scala is a clean, elegant language. I generally don't complain that any of the features are too complex or too unwieldy. I think it all fits nicely together.

That said, there are some Scala features that, all things considered, I don't often find myself missing in Java:

* The `object` keyword--this is nice, but really it just makes it "okay" (blessed by the language) to sprinkle singletons all over your codebase. Not something I find myself missing.

* Implicit conversions--as a framework/DSL writer, these are sexy, but not critical.

* Operator overloading--nice to have, but eh.

* Macros--this is somewhat surprising, given I am an admitted compile-time code generation junky, but so far Scala's macros haven't convinced me they're indepensible.

* Typeclasses--*maybe* if Scala eventually uses these for type-safe equality, I'd be a fan, but otherwise I don't often (ever?) find myself thinking "damn, I wish I could do type classes here".

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

* If Scala is not supported/well-supported in a given environment (embedded?, Android, GWT is important to me, etc.).

* If I knew that the codebase would eventually be 100k+ LOC. I can't imagine the Scala compiler being very pleasant on codebases over 20-30k LOC.

* If I knew that the codebase would live 5+ years. Java will definitely be around and healthy (knock on wood) in 5 years.

Peak Scala?
-----------

I cannot take credit for this, but one of my astute coworkers made this observation:

1. Anyone who is so frustrated with Java that they'd adopt Scala, probably already has.

2. With Java 8, Java is getting demonstrably more "good enough" (especially to those who have held out using it for this long), that it's actually becoming less likely that Java users will convert to Scala.

So, based on these observations, is it likely that Scala has hit peak adoption?

I was originally very skeptical of his claim, as it smacks of FUD.

But, since my static typing bias keeps me in GWT, and so Java, on a daily basis, with Java 8 coming soon and promising to usher in an era of "modern Java"...I dunno. It's interesting.

Will Oracle Build Some Momentum?
--------------------------------

It is tempting to be seduced into thinking Oracle might build some momentum here, and continue on a road to a modern Java that is not embarrassing for programmers to admit is their primary/preferred language.

That said, I have not been super-impressed with the post-Java 8 road maps. The Jigsaw/OSGI thing in particular seems like a large distraction, IMO. Dunno, I could very well end being wrong on Jigsaw, but personally I'd prefer more Java-the-language focus.

If Oracle did happen to get serious about making the modern Java (basically catching up/passing C#), I think it would be a huge dent in the adoption of the various "Java Next" contenders (Scala, Ceylon, Fantom, etc.).

Perhaps this is an obvious assertion, but I think it's much more realistic now than it has been in the past.

Disclaimer
----------

I know several of my coworkers will heavily object to the idea that "Java + a few fixes" would ever be as sexy as Scala.

And they're right. Scala is always going to be the sexier language when compared to Java.

I highly doubt that at Bizo I'll ever lobby to start a new server-side project in Java. Even if it was super-high performance/whatever. For us, Scala has won.

But an industry standard language doesn't necessarily have to be (and almost always isn't) the sexiest. It just needs to GSD.

So, I guess I'm saying to Oracle, Java will never be Scala, but, realistically, that's fine, you could win me back. Java 8 isn't enough. But it's much closer. Please don't fuck it up. :-)




