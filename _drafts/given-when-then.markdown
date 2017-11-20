---
layout: draft
title: Using Given/When/Then For Tests
---

{{page.title}}
==============

One of my favorite patterns for writing tests is the Given/When/Then style of Behavior Driven Development.

The pattern is pretty simple: for each test case, you think through:

* Given "the state of the world is X"
* When "something happens"
* Then "the state of the world now looks like Y"

This pattern focuses each test on a specific boundary case, e.g. you can imagine iterating through boundary conditions like:

* Given the form input is invalid
* When the user clicks submit
* Then we show the correct validation errors

Or:

* Given the form input is valid
* When the user clicks submit
* Then we take them to the next page

Granted, real-world boundary conditions would be more specific (e.g. what form, how was it invalid, etc.), but that is the basic template.

In the world of requirements, e.g. Product Requirements Documents (PRDs), UML diagrams, and use cases, the Given/When/Then pattern is basically a user scenario (user does this, system does that) turned into a test.

G/W/T Leads to More Robust Tests
--------------------------------

One of the biggest advantages of this style is that it guides the tests to be miniature *executable* articulations of the requirements.

Without this guide, I've noticed that it's easy for tests to become too much about the implementation details, e.g. "make sure this method does this", or "this esoteric method should have that esoteric behavior", or the worst is "make sure this method calls that method" (which says nothing about a business requirement, and is solely a brittle implementation detail).

Instead, if all of our tests are worded as Given/When/Then, and are based around the requirements/language of our system (see [ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) from Evan's Domain Driven Design), it's extremely likely that these test cases will remain valid over the entire life cycle of the system.

Or more concretely, using our form example, if your requirement is "given invalid form input, when the user clicks submit, we show validation errors", it's unlikely that, while implementing some other feature, this business case will become invalid. You may break the test due to an implementation bug or regression, but the test itself should never become worthless.

(Unless the requirements *do* change, at which point it's perfect that tests fail for requirements-change reasons and not unrelated-technical reasons.)

For an example of what this avoids, I remember in the early ~2000s, there were several reports from Extreme Programming projects that "we wrote a ton of unit tests, but now they're slowing us down, because they fail all the time when we refactor things". I find reports like this extremely puzzling, because to me it's not an indication that you shouldn't write unit tests, it's an indication you're writing bad unit tests, that are severely coupled to the internal structure of your system, and not to the real-world requirements you are fulfilling.

Tangentially, this is one of my few criticisms of [Growing Object-Oriented Systems Guided By Tests](http://www.growing-object-oriented-software.com/) (which is otherwise great) is that over-reliance on role interfaces means tests can become more based around "this is how layer X of my system interacts with layer Y" (brittle, will change with refactorings), instead of "this is how layer X of my systems fulfills each business/boundary cases" (robust, will live forever).

(There is a place for role interfaces, specifically at the boundaries of systems where it is too expensive/too coupled to call external libraries, but internally within a single codebase, I think overuse of them can become an anti-pattern.)

Granted, my assertion of robust tests does not mean "if you write tests this way, you'll never have to touch them again". Invariably things will come up, and yes, you'll have to refactor your tests, e.g. you might change something about your UI widgets, and so a lot of tests might have to be updated to assert against the UI behavior in a different way.

However, the point is that these technical changes should not *invalidate* the test case, as the test cases map to business cases, and business cases rarely change/go away.

G/W/T Leads to More Readable Tests
----------------------------------

Besides guiding the tests to be requirements, I love the readability that comes from using Given/When/Then, e.g. using a flat example (see down below for flat vs. nested):

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

Depending on the project, this can be either theoretical or entirely practical, e.g. one of my career highlights was sitting next to a product manager, and collaboratively writing test cases for some non-trivial business cases, with him reading and understanding the tests, as we worked through what the system should do.

Nonetheless, even if your product manager is not going to actively read your tests, having that goal in mind is great to strive for, because it also means your fellow engineers will have incredibly readable tests to help them review and maintain the system.

Specifically for code reviews, it might seem like having Given/When/Then comments is a small thing, but even with well-written tests (e.g. that already have good levels of abstraction in creating the test data, invoking the system under test, and doing assertions), I can do code reviews much, much quicker for tests that have these comments.

This is because it's immediately obvious what business case we're testing, so my job as a code reviewer changes from "guess/reverse engineer what business case this test method cares about" to "verify this test method exercises the business case it says it does".

And then I can use the mental cycles saved from "guess what business case this test method cares about" to invest in even more important things, like "think about business cases are not covered in this test".

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

Isn't This Too Many Comments?
-----------------------------

One criticism of Given/When/Then statements (when implemented as in-source comments) is that it seems to add unnecessary verbosity to your tests.

Specifically, it seems contrary to the "code should be self-describing" rule of thumb, which if taken to the extreme (which new adherents of the rule typically do), can be taken as "your code should never have comments".

However, in practice I think it's hard for this "no comments" ideal to play out. E.g. to really achieve no comments and still have product manager-readable tests, we'd need an extremely high-level DSL, which could do something like:

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

This trends towards [Cucumber](https://cucumber.io)/Gherkin style tests, which are similarly extremely high level:

```txt
Scenario: Jeff returns a faulty microwave
   Given Jeff has bought a microwave for $100
   And he has a receipt
   When he returns the microwave
   Then Jeff should be refunded $100
```

My concern for both approaches, either an internal DSL or an external DSL like Gherkin, is that we have to put a non-trivial amount of effort into crafting the DSL. And crafting "reads like human language" DSLs is just a hard thing to do. I don't trust myself to do it well.

For Cucumber/Gherkin in particular, we also have to maintain a library of regular expressions to uniquely/deterministically parse our 100s/1000s of plain-text tests. Which just seems like a horrible idea: hard to maintain, hard to refactor, hard to discover what your existing/valid DSL language is, etc.

So, to me, cheating by punting on "build a human-readable DSL that is still 100% deterministic and executable", and instead taking the dumb/simple approach of interspersing in-source comments with the test code is the right trade off between effort and results.

Use Abstractions to Keep Given Section Short
--------------------------------------------

While I dislike putting Given/When/Then statements themselves into a DSL, I do like using DSLs for setting up the "given" conditions.

An *ideal* test case should be 6 lines, 1 comment and 1 LOC per Given/When/Then section, e.g.:

```java
public void testFormInput() {
  // given a valid account exists
  ...
  // when the user enters an invalid name
  ...
  // then we show a validation error
  ...
}
```

Unfortunately this is rarely the case, e.g. especially for the given section. What we don't want to have is:

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

If our form is going to have ~5-10 boundary cases to test, this is going to get very verbose.

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

The builder pattern I use here is not the canonical builder pattern, which focuses more on creating immutable DTOs in a fluent matter, and instead is Fowler's [Object Mother](https://martinfowler.com/bliki/ObjectMother.html) pattern, which is about having helper classes (he calls them mothers, but for whatever reason it seems odd to have classes called `AccountMother`, `UserMother`, etc.) for creating objects *specifically for tests*.

Because the use case is specifically tests, the mothers/builders can make a lot of assumptions, e.g. filling in defaults that don't matter, that would not be appropriate for a builder that was used in production code.

The mother/builder pattern is worth exploring separately, but basically you should strive for each of your sections, and particularly the "given" section, to be relatively short and easy to set up.

It will take an upfront investment to create these abstractions, but it will quickly pay off as your test suite grows from 10s to 100s to 1000s of tests.

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

To me, while the rule of thumb "one assertion per test" is well meant to keep test methods from getting out of hand, in this case it's more pragmatic, and have a test method per When, and have multiple Then statements:

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

Draconian Formatting
--------------------

Besides just using Given/When/Then, I typically like to encourage tests to be very strict about their approach.

Specifically, the order should always be Given, When, Then, and always include each one, e.g. no skipping Given or skipping When.

Note that Ands are allowed, so it can technically be:

* "Given ..."
* Zero or more "And ..."
* "When ..."
* Zero or more "And ..."
* "Then ..."
* Zero or more "And ..."

Based on this, we can then have fun being pedantic about new lines.

Per above, the ideal test IMO is 6 lines, with zero new lines:

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

This is effectively 3 real lines of code, if you leave out the comments, and so for me definitely qualifies for a condensed/no-newline formatting.

I like this, and set it as my ideal, because when you have ~10 or 20 or 30 test methods in a class, it becomes really easy to scan the test methods if each one is visually chunked into 1 visual chunk per test.

And, as a bonus, if you use vim bindings, the `{` and `}` movements will move to the previous/next empty line, which makes it extremely quick to navigate around the test cases (it basically becomes a "next test case" short cut).

Personally, I think this no-newline condensation can scale to ~3 lines of real code per section, e.g.:

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

Would still be acceptably/preferably formatted as no newlines/a single visual chunk.

When you get more than one, I think it makes sense to add a space between each section, e.g:


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

