---
date: "2017-11-28T00:00:00Z"
section: Testing
title: Using Given/When/Then For Tests
---

{{page.title}}
==============

One of my favorite patterns for writing tests is the Given/When/Then style of Behavior Driven Development.

The pattern is pretty simple: for each test case, you think through:

* Given "the state of the world is X"
* When "something happens"
* Then "the state of the world now looks like Y"

This pattern focuses each test on a specific boundary (ideally business) case, e.g. you can imagine iterating through boundary conditions like:

* Given the form input is valid, When ..., Then ...
* Given the form input is invalid, When ..., Then ...
* Given the address is already entered, ...
* Given ...

Granted, real-world boundary conditions would be more specific (e.g. what form, how was it invalid, etc.), but that is the basic template.

In the world of requirements, e.g. Product Requirements Documents (PRDs), UML diagrams, and use cases, the Given/When/Then pattern is basically a user scenario (user does this, system does that) turned into a test.

G/W/T Leads to More Resilient Tests
-----------------------------------

One of the biggest advantages of this style is that it guides the tests to be miniature *executable* articulations of the requirements.

Without this guide, I've noticed that it's easy for tests to become too much about the implementation details, e.g. "make sure this method does this", or "this esoteric method should have that esoteric behavior", or the worst is "make sure this method calls that method" (which says nothing about a business requirement, and is solely a brittle implementation detail).

Instead, if all of our tests are worded as Given/When/Then, and are based around the requirements/language of our system (see [ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) from Evan's Domain Driven Design), it's extremely likely that these test cases will remain valid over the entire life cycle of the system.

Or more concretely, using our form example, if your requirement is "given invalid form input, when the user clicks submit, we show validation errors", it's unlikely that, while implementing some other feature, this business case will become invalid. You may break the test due to an implementation bug or regression, but the test itself should never become worthless.

(Unless the requirements *do* change, at which point it's perfect that tests fail for requirements-change reasons and not unrelated-technical reasons.)

For an example of what this avoids, I remember in the early ~2000s, there were several reports from Extreme Programming projects that "we wrote a ton of unit tests, a la TDD, but now they're slowing us down, because they fail all the time when we refactor things".

I find reports like this extremely puzzling, because to me it's not an indication that you shouldn't write unit tests, or not do TDD, it's an indication you're writing bad unit tests, that are severely coupled to the internal structure of your system, and not to the real-world requirements you are fulfilling.

Tangentially, this is one of my few criticisms of [Growing Object-Oriented Systems Guided By Tests](http://www.growing-object-oriented-software.com/) (which is otherwise great) is that over-reliance on role interfaces means tests can become more based around "this is how layer X of my system interacts with layer Y" (brittle, will change with refactorings), instead of "this is how my systems fulfills each business/boundary cases" (robust and resilient, will live forever).

(There is a place for role interfaces, specifically at the boundaries of systems where it is too expensive/too coupled to call external libraries, but internally within a single codebase, I think overuse of them is an anti-pattern.)

Granted, my assertion of robust tests does not mean "if you write tests this way, you'll never have to touch them again". Invariably things will come up, and yes, you'll have to refactor your tests, e.g. you might change something about your UI widgets, and so a lot of tests might have to be updated to assert against the UI behavior in a different way.

However, the point is that these technical changes should not *invalidate* the test case, as the test cases map to business cases, and business cases rarely change/go away.

G/W/T Leads to More Readable Tests
----------------------------------

Besides guiding the tests to be requirements, I love the readability that comes from using Given/When/Then, e.g. using a flat example (see the next section for a description of flat vs. nested):

```java
public void testFoo() {
  // given the account is in this state
  ...
  // when we get a request to do x
  ...
  // then the account is canceled
}
```

To me, this fulfills my gold-standard/1st principle for tests (whether unit tests or acceptance tests or what not): they should be readable by your product manager.

Depending on the project, this can be either theoretical or very practical, e.g. one of my career highlights was sitting next to a product manager and collaboratively writing test cases for some non-trivial business cases, with him reading and understanding the tests as I wrote them, as we worked through what the system should do.

Nonetheless, even if your product manager is not going to actively read your tests, having that goal in mind is great to strive for, because it also means your fellow engineers will have incredibly readable tests to help them review and maintain the system.

Specifically for code reviews, it might seem like a small thing, but even with well-written tests (e.g. that already have good levels of abstraction in creating the test data, invoking the system under test, and doing assertions), with Given/When/Then comments I can do code reviews much, much quicker.

This is because it's immediately obvious what business case we're testing, so my job as a code reviewer changes from "guess/reverse engineer what business case this test method cares about" to "verify this test method exercises the business case it says it does".

And then I can use the mental cycles saved from "guess what business case this test method cares about" to invest in even more important things, like "think about business cases are not covered in this test".

What about DRY/Needless Comments?
---------------------------------

Granted, having Given/When/Then comments that at each step say "here is *what* this test is doing" raises a red flag for violating the DRY and "code should be self-describing" rules of thumb.

Both of these are great rules, but, yes, I am advocating purposefully violating them for tests, specifically for Given/When/Then comments.

This can be a slippery slope, as my colleague pointed out that ~10-20 years ago, tests were often a 2nd-class citizen in codebases, and so very crufty. They were not refactored or maintained. And so there was a legitimate push in the industry in the ~early-2000s for applying all of the same care and craftsmanship that we (hopefully) exercise over production code to our test code.

Which I definitely agree with: test code should be beautiful code.

That said, I rationalize Given/When/Then comments, even though they duplicate the *what* because I purposefully want my tests to be as stupidly simple as possible.

So, in terms trade-offs, I will purposefully sacrifice otherwise best-practice rules of thumb to gain simplicity. Within reason.

(Other examples of this first principle, for me, are avoiding `for` loops and random numbers in tests; see [Obsessively Simple Test Values](/2017/01/07/obsessively-simple-test-values.html) for more.)

Basically, I don't want to expand any mental energy while reading tests; I want all of my mental energy reserved for reading and debugging the production code. I shouldn't have to juggle abstractions on both sides.

What About DSLs?
----------------

So, that's fine, I want simple tests, but another assertion would be to continue refactoring the test code until it meets the goal of being self-describing, but sans comments.

However, in practice I think it's hard for this "no comments" ideal to play out.

For example, to really achieve no comments and still have product manager-readable tests, e.g. "reads like English", we'd need an extremely high-level DSL, which could do something like:

```java
public void testInvalidForm() {
   givenOurFormHasInvalidInput();
   whenTheUserClicksSubmit();
   thenWeShowAnErrorMessage();
}
```

Or maybe a little less high-level:

```java
public void testInvalidForm() {
   givenOurFormHasInput(name = "invalid");
   whenTheUserClicksSubmit();
   thenWeShowAnErrorMessage(message = "fix your name");
}
```

However, these like-English methods are so high-level that, to me, it's unlikely they'll actually be reused across test methods.

And, since they are not generic, it means to understand the test, I'll likely have to read the helper method anyway (since it's not from a set of reusable methods I'm already familiar with), at which point to me it's actually hurting readability by having to jump back/forth from the test to its used-once/bespoke/high-level methods to see what they're actually doing.

The challenge of a beautiful "reads like English" DSL is that you need a set of core primitives that are both very generic and very composable.

And this is just a very hard problem to solve, so I'm accepting the trade-off of Given/When/Then being less DRY, but overall very simple and easy to implement and understand.

What About Cucumber/Gherkin?
----------------------------

So that is internal DSLs, but there are also external DSLs for BDD, specifically [Cucumber](https://cucumber.io)/Gherkin style tests, which are similarly extremely high level:

```txt
Scenario: Jeff returns a faulty microwave
   Given Jeff has bought a microwave for $100
   And he has a receipt
   When he returns the microwave
   Then Jeff should be refunded $100
```

Because Gherkin is an external DSL, it can avoid the constraints of a general purpose programming language, and focus specifically on the goal of being "reads like English".

However, my concern for Gherkin is very similar to the internal DSL approaches: that the fixtures we have to write (which are the glue that translates the "And he has a receipt" into code for the test to run) are going to be a very large and very intricate set of primitives that are, I worry/assert, not worth the cost of their abstraction.

And for Gherkin in particular, since the fixtures are essentially a library of regular expressions that must uniquely and deterministically parse our 100s/1000s of plain-text, "reads like English" tests, it just seems like building on quicksand. The fixtures seem like they would hard to maintain, hard to refactor, hard to discover what your existing/valid DSL language is, etc.

(E.g. when a new person sits down, and they copy/paste a Gherkin test, and want to change "And he has a receipt" to "And he has a ...", how do they know which statements are currently supported? How do they know when they write a new statement, it won't accidentally parse an existing statement?)

If there was more tooling behind Gherkin, e.g. avoiding regular expressions, and auto-completion/type checking around statements, which is basically exactly what the now-defunct [ThoughtWorks Twist](https://support.thoughtworks.com/hc/en-us/community/posts/213262186-A-Farewell-to-Twist) product provided, I could see this being a better idea.

...which, now that I go looking for it, it looks like both Twist's replacement, [Gauge](https://docs.getgauge.io/language.html#language-steps), as well as Cucumber itself, have "like an IDE" tooling available: [gauge-vscode](https://github.com/getgauge/gauge-vscode) and [VSCode cucumber](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete).

Which is great; if you're using either Cucumber/Gauge, I think leveraging this tooling support would be great.

So I must soften my stance here, since there is tooling available for these external BDD DSLs; but in general my bias and preference is still on the side of just inlining the intent of your BDD scenarios into your tests themselves.

(Tangentially, it's amazing how Visual Studio Code's [language server protocol](https://github.com/Microsoft/language-server-protocol) has democratized IDE building by making it API-/protocol-based instead of GUI-/language-based.)

G/W/T Flat vs. Nested Approaches
--------------------------------

On a more technical level, there are also two general ways of writing Given/When/Then style of tests: flat and nested.

Flat is where each test method has its own Given/When/Then right after each other, e.g.:

```java
public void testFoo() {
  // given ...
  ...
  // when ...
  ...
  // then ...
  ...
}
```

Whereas nested is where a DSL is used to nest whens and thens, e.g.:

```js
describe("foo", function() {
  describe("given ...", function() {
    describe("when ...", function() {
      it("then ...", function() {
        // assert
      });

      it("then ...", function() {
        // assert
      });
    });

    describe("when ...", function() {
      it("then ...", function() {
        // assert
      });
    });
  });
});
```

The nested style seems enticing, as it has a purported benefit of being able to nest multiple Whens in a single Given, and multiple Thens in a single When.

However, I personally find the nested style to be overly cute, and in the end not worth the added complexity.

In terms of complexity, there is just execution complexity, e.g. I'm never 100% sure how the data/objects setup within the outer blocks are shared/reused within the inner? Each `it` block probably gets its own copy, to ensure isolation? Granted, this is just matter of learning the framework.

More abstractly, to me a key point of test readability is having the Given/When/Then triple of "input data", "execution", "output data" as close together as possible.

With a nested style, my 10th `it` block is using input data and execution steps from lines ~10-50 lines above where the `it` block itself is defined.

To me this hurts both readability and maintainability. E.g. for readability, I now need to scan (potentially many) more LOCs to fully comprehend a single `it` block (e.g. skip over all of the `it` blocks above it), and then for maintainability, if I need to change this `it` blocks input conditions, I have to extract it from the tree of given/when/thens.

I prefer the simplicity of the flat approach, where ideally each test method is as standalone as possible, so it's both extremely easy to read (just read it linearly) and easy to move/change (changing one test's given does not change all the other tests).

Use Abstractions to Keep Given Section Short
--------------------------------------------

While I avoid trying to craft the Given/When/Then statements themselves into a DSL, I do like using DSLs for setting up test data, so that tests can succinctly recreate the input conditions necessary for exercising their boundary case.

Specifically what we want to avoid is having 20-30 line "Given" sections, e.g.:

```java
public void testFormInput() {
  // given a valid account exists
  Account a = new Account();
  a.setName("a");
  a.setAddress(123);
  a.setOtherThings(...);

  User u = new User();
  u.setName("u");
  u.setEmail("u@u.com");
  u.setOtherThings(...);

  // hook up account to user
  a.setUser(a);

  // other ugly persistence details
  accountService.save(a);
  userService.save(u);

  // when the user enters an invalid name
  ...
  // then we show a validation error
  ...
```

I'm 15+ lines into the test and am still only setting up the "given" section.

If our form is going to have ~5-10 boundary cases to test, this is going to get very verbose (and I can see as valid motivation for "let's build a DSL for given statements").

So, I'm all for using abstractions and DSLs for creating test data, e.g.:

```java
public void testFormInput() {
  // given a valid account exists
  AccountBuilder a = aAccount().withAdmin().withDefaults();
  setupForm(a);
  // when the user enters an invalid name
  form.type("invalidName");
  form.submit();
  // then we show a validation error
  assertValidationError(form, "asdf");
```

The builder pattern I use here is not the canonical builder pattern (which focuses more on creating immutable DTOs in a fluent matter) and instead is Fowler's [Object Mother](https://martinfowler.com/bliki/ObjectMother.html) pattern, which is about having helper classes (he calls them object mothers) for creating objects *specifically for tests*.

Because the use case for these builders/mothers is solely tests, they can make a lot of assumptions, e.g. filling in defaults that don't matter, that would not be appropriate for a builder that was used in production code.

The builder/mother pattern is worth exploring separately, but basically you should strive for each of your sections, and particularly the "given" section, to be relatively short and easy to set up.

It will take an upfront investment to create these abstractions, but it will quickly pay off as your test suite grows from 10s to 100s to 1000s of tests.

And, just to explicitly address my dichotomy of "don't build a DSL for given/when/then" but "do build a DSL for test data", in my experience building a DSL for test data is a much more tractable problem: you typically have one `FooBuilder` for each entity in your system, and it's generally pretty easy to see what the defaults should be/what helper methods would make sense. So, to me, it's just not the same challenge as building the "reads like English" DSL for Given/When/Then.

One Assertion Per Test or One Case Per Test?
--------------------------------------------

One stylistic issue for Given/When/Thens is how to hold multiple assertions.

For example, our form validation might entail both showing an error message as well as disabling the form button.

One way of doing this is having 1 assertion per test, e.g.:

```java
public void shouldShowValidationErrorOnInvalidInput() {
  // given a valid account exists
  AccountBuilder a = aAccount().withAdmin().withDefaults();
  // when the user enters an invalid name
  openApp(a.getAdminUser());
  form.type("invalidName");
  form.submit();
  // then we show a validation error
  assertValidationError(form, "asdf");
}

public void shouldDisableButtonOnInvalidInput() {
  // given a valid account exists
  AccountBuilder a = aAccount().withAdmin().withDefaults();
  // when the user enters an invalid name
  openApp(a.getAdminUser());
  form.type("invalidName");
  form.submit();
  // then we disable the submit button
  assertFalse(button.isEnabled());
}
```

As you can see, this effectively copy/pastes the first ~6 lines of the given/when statement.

To me, while the rule of thumb "one assertion per test" is well meant to keep test methods from getting out of hand, in this case it's more pragmatic, and have one test method per When, and have multiple Then statements:

```java
public void shouldHandleInvalidName() {
  // given a valid account exists
  AccountBuilder a = aAccount().withAdmin().withDefaults();
  // when the user enters an invalid name
  openApp(a.getAdminUser());
  form.type("invalidName");
  form.submit();
  // then we show a validation error
  assertValidationError(form, "asdf");
  // and disable the submit button
  assertFalse(button.isEnabled());
}
```

Perhaps it is what I'm used to, but being able to scan methods by "here are the business conditions handled" instead of "here are the business conditions handled + each thing we do for that condition", is just easier to follow.

Granted, maybe my anti-nesting bias is showing, as that would admittedly allow following the "one assertion per test" rule, by putting "show a validation error" and "disable the submit button" in their own "it" blocks.

More Than One When?
-------------------

The canonical form of Given/When/Then has only one of each term, however I've found there are cases where multiple Whens can be nice, e.g.:

```java
public void shouldHandleInvalidName() {
  // given a valid account exists
  AccountBuilder a = aAccount().withAdmin().withDefaults();

  // when the user enters an invalid name
  openApp(a.getAdminUser());
  form.type("invalidName");
  form.submit();

  // then we show a validation error
  assertValidationError(form, "asdf");
  // and disable the submit button
  assertFalse(button.isEnabled());

  // when they correct the error
  form.type("validName");
  form.submit();

  // then we submitted the form
  assertTrue(form.isSubmitted());
}
```

This is a fuzzy line, and usually only worthwhile in more expensive or elaborate integration tests, where it takes a bit of setup (even with your DSL), to get to the 2nd When condition.

Because if it's super easy to setup the 2nd When's input data, without going through the 1st Given/When/Then, then you should prefer that, as it makes the 2nd When's test more isolated, so easier to read and more maintainable.

So, 90% of the time, you should have only a single When per test, but occasionally having two is fine.

Using G/W/T for Unit Tests
--------------------------

The Given/When/Then idiom is generally used in acceptance tests, e.g. it came out of BDD/customer acceptance tests, where it's purposefully abstracted from the system's implementation details, and solely about "what" happens instead of "how" it happens.

Which is great, but personally I think that robustness of "what should happen"-style tests should be applied to unit tests as well.

Granted, depending on your unit tests, this can feel odd, e.g. a unit test like:

```
public void testCallingFoo() {
  // given the foo method is called
  resource.foo();
  // then the service bar method was called
  verify(resource).bar();
}
```

This seems like an odd test to write with Given/When/Then statements, because "then the service bar method was called" does not seem like a "what"; it's very much a "how".

But that oddness is actually a good thing, because it's a hint/smell that the test, as-is, is just a brittle repetition of our implementation details: "make sure layer X calls layer Y."

So, even for unit tests, you should try to write unit tests as much like integration tests as possible: assert against input state and output state, as the output state will be the closest to "what business case I'm trying to solve".

Draconian Formatting
--------------------

Besides just using Given/When/Then statements, I also like to encourage tests to be very strict about their use/ordering of each statements.

Specifically, the order should always be "Given", "When", "Then", and always include each one, e.g. no skipping Given or skipping When.

Note that "Ands" are allowed, so it can technically be:

* "Given ..."
* Zero or more "And ..."
* "When ..."
* Zero or more "And ..."
* "Then ..."
* Zero or more "And ..."

Based on this, we can then have fun being pedantic about new lines.

The ideal test, in my opinion, is 6 lines, with zero new lines:

```java
public void testFormInput() {
  // given a valid account exists
  whenSomething();
  // when the user enters an invalid name
  doSomething();
  // then we show a validation error
  assertSomething();
}
```

This is effectively 3 real lines of code, if you leave out the G/W/T statements, and so for me qualifies for condensed/no-newline formatting.

I like this (a small method with no newlines), and set it as my ideal, because when you have ~10 or 20 or 30 test methods in a class, it becomes really easy to scan the test methods if each one is visually chunked into a single visual chunk per test. And needless newlines breaks the visual flow into multiple visual chunks.

And, as a bonus when achieving no-newline methods, if you use vim bindings, the `{` and `}` movements, which move to the previous/next empty line, now happen to map to previous/next method, so it makes it extremely quick to navigate around the test cases (you basically get a "next test case" short cut for free).

Personally, I think this no-newline ideal can scale to ~3 lines of real code per section, e.g.:

```java
public void testFormInput() {
  // given a valid account exists
  whenSomething();
  whenSomething2();
  whenSomething3();
  // when the user enters an invalid name
  doSomething();
  doSomething2();
  doSomething3();
  // then we show a validation error
  assertSomething();
  assertSomething2();
  assertSomething3();
}
```

Would still be acceptably/preferably formatted as no-newlines/a single visual chunk.

When you get more than ~3-4 lines per section, I think it makes sense to add a space between each section, e.g:

```java
public void testFormInput() {
  // given a valid account exists
  whenSomething();
  whenSomething2();
  whenSomething3();
  whenSomething3();
  whenSomething4();

  // when the user enters an invalid name
  doSomething();
  doSomething2();
  doSomething3();
  doSomething4();

  // then we show a validation error
  assertSomething();
  assertSomething2();
  assertSomething3();
  assertSomething4();
}
```

One wrinkle is what do with Ands. I again trend towards condensing visual chunks, and would prefer them included with their parent section, e.g.:

```java
public void testFormInput() {
  // given a valid account exists
  whenSomething();
  whenSomething2();
  whenSomething3();
  // and something else
  fooBar();

  // when the user enters an invalid name
  doSomething();
  doSomething2();
  doSomething3();
  // and something else
  fooBar();

  // then we show a validation error
  assertSomething();
  assertSomething2();
  assertSomething3();
  // and something else
  assertSometing4();
}
```

But, again, if you reach more than ~3-4 lines for a given "And", promoting it to its own visual chunk makes sense.

Conclusion
----------

I think I've exhaustively covered all my thoughts on Given/When/Then.

Basically, I think they are a best practice that can be applied to all tests in a codebase, both unit and acceptance.

And, despite the initial inclination of seeming un-DRY, in the end the readability and "reviewability" of your tests will be worth it.

