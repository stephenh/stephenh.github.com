
1. Avoid Local Variables
------------------------

E.g.

    String foo = ...;
    nowDoSomeWork(foo);

    // instead:
    nowDoSomeWork(...);

* Reduce mental overhead of 
* Unless `foo` is a very descriptive name that makes the code more readable, e.g. an intermediate result

2. Declare Local Variables Close to their Usage
-----------------------------------------------

3. Prefer Methods with no Blank Lines
-------------------------------------

E.g.:

    public int foo() {
      int i;

      for (thing : things) {
        i++;
      }

      return i;
    }

     // instead:
    public int foo() {
      int i;
      for (thing : things) {
        i++;
      }
      return i;
    }

* Makes methods easier to visually chunk
* Makes jumping through code with { and } move by methods
* Doesn't work for larger methods (avoid larger methods if possible) 

4. Field Ordering
-----------------

    public class Foo {
      public static final f1;
      public static final f2;
      private static final f3;

      public final String f4;
      private final String f6;

      public String f5;
      private String f7;

      public void doFoo() {
      }

      private void doBar() {
      }

      public static class Foo {
      }

      private class Bar {
      }
    }

5. DTO Best Practices
---------------------

* Prefer final fields
* Use constructors arguments for all instantiations
  * Means callers will break when new fields are added
  * Clients expect a fully-populated DTO, that is the essence of DTOs
  * Makes it clear what is/is not going over the wire
  * Clarity is worth the extra field/constructor parameter/assignment dance.

6. Abbreviations
----------------

* Prefer spelled out, as long as it's not too long, unless clarity is really important
* Use a single-char abbreviation (e.g. `p` for Partner), but only when it's incredibly clear what `p` is and it isn't used for more than 3-4 lines of code after it's declaration
* Use `FooBarZaz` -> `fbz` abbreviation as a last resort.



1. Avoid Local Variables
------------------------

E.g.

    String foo = ...;
    nowDoSomeWork(foo);

    // instead:
    nowDoSomeWork(...);

* Reduce mental overhead of 
* Unless `foo` is a very descriptive name that makes the code more readable, e.g. an intermediate result

2. Declare Local Variables Close to their Usage
-----------------------------------------------

3. Prefer Methods with no Blank Lines
-------------------------------------

E.g.:

    public int foo() {
      int i;

      for (thing : things) {
        i++;
      }

      return i;
    }

     // instead:
    public int foo() {
      int i;
      for (thing : things) {
        i++;
      }
      return i;
    }

* Makes methods easier to visually chunk
* Makes jumping through code with { and } move by methods
* Doesn't work for larger methods (avoid larger methods if possible) 

4. Field Ordering
-----------------

    public class Foo {
      public static final f1;
      public static final f2;
      private static final f3;

      public final String f4;
      private final String f6;

      public String f5;
      private String f7;

      public void doFoo() {
      }

      private void doBar() {
      }

      public static class Foo {
      }

      private class Bar {
      }
    }

5. DTO Best Practices
---------------------

* Prefer final fields
* Use constructors arguments for all instantiations
  * Means callers will break when new fields are added
  * Clients expect a fully-populated DTO, that is the essence of DTOs
  * Makes it clear what is/is not going over the wire
  * Clarity is worth the extra field/constructor parameter/assignment dance.

6. Abbreviations
----------------

* Prefer spelled out, as long as it's not too long, unless clarity is really important
* Use a single-char abbreviation (e.g. `p` for Partner), but only when it's incredibly clear what `p` is and it isn't used for more than 3-4 lines of code after it's declaration
* Use `FooBarZaz` -> `fbz` abbreviation as a last resort.



1. Avoid Local Variables
------------------------

E.g.

    String foo = ...;
    nowDoSomeWork(foo);

    // instead:
    nowDoSomeWork(...);

* Reduce mental overhead of 
* Unless `foo` is a very descriptive name that makes the code more readable, e.g. an intermediate result

2. Declare Local Variables Close to their Usage
-----------------------------------------------

3. Prefer Methods with no Blank Lines
-------------------------------------

E.g.:

    public int foo() {
      int i;

      for (thing : things) {
        i++;
      }

      return i;
    }

     // instead:
    public int foo() {
      int i;
      for (thing : things) {
        i++;
      }
      return i;
    }

* Makes methods easier to visually chunk
* Makes jumping through code with { and } move by methods
* Doesn't work for larger methods (avoid larger methods if possible) 

4. Field Ordering
-----------------

    public class Foo {
      public static final f1;
      public static final f2;
      private static final f3;

      public final String f4;
      private final String f6;

      public String f5;
      private String f7;

      public void doFoo() {
      }

      private void doBar() {
      }

      public static class Foo {
      }

      private class Bar {
      }
    }

5. DTO Best Practices
---------------------

* Prefer final fields
* Use constructors arguments for all instantiations
  * Means callers will break when new fields are added
  * Clients expect a fully-populated DTO, that is the essence of DTOs
  * Makes it clear what is/is not going over the wire
  * Clarity is worth the extra field/constructor parameter/assignment dance.

6. Abbreviations
----------------

* Prefer spelled out, as long as it's not too long, unless clarity is really important
* Use a single-char abbreviation (e.g. `p` for Partner), but only when it's incredibly clear what `p` is and it isn't used for more than 3-4 lines of code after it's declaration
* Use `FooBarZaz` -> `fbz` abbreviation as a last resort.

At some point, nouns get long enough that just using the type as a variable name becomes unwieldy. Mark will know what I mean, given the previous system we worked on together had some annoying long table/entity names. That is there my "LinkedInAdVariation"->"liav" (or just "av" if you want to drop the LI prefix) naming convention developed, and I think it does make code more readable, with the caveat that the variable name is only used within 2-3 lines of being declared. 

E.g. if you have a 30 line method, yeah, seeing "av" 20 lines after it's declared, is going to suck; but within short/tight code like this, I think short/abbreviated variable names actually help readability because the eye/mind can match "av" in the 3-4 surrounding lines much easier than "linkedInAdVariation" especially when there is also "linkedInCampaign" and "getLinkedInAdVariations", etc., there is too many "inkedIn"s that my eye can't immediately just to it anymore. 

It's kinda the same with Scala closures...e.g.
 map _.toString 
; using "_" (or "i" or whatever) is a horrible idea over 20-30 lines of code ... but within 1 line, the variable name goes away, and your mind just kinda knows what it means, such that less is actually more/better. 


