---
date: "2012-12-26T00:00:00Z"
section: Testing
title: High Level Assertions
---

{{page.title}}
==============

It is often said that we should treat test code like production code, and have it be DRY, readable, well refactored, etc.

But I think, compared to production code, there is generally less discussion about how to actually do this within test code. (Well, maybe not, if you count all of the TDD/BDD posts, but those tend to be more process oriented that code oriented.)

Anyway, the pattern I strive for with most tests is (ha) BDD inspired:

```java
public void someTest() {
  // given <some business condition>
  setupTheBusinessCondition();

  // when <some business event happens>
  invokeTheEvent();

  // then <some business artifact is observable>
  assertSomething();
}
```

Where ideally the comments of "given, when, then" document the why, the meaning of what's going on, so that 6 months from now, any programmer, yourself included, could glance at the comments and follow what is going on.

(Unfortunately I don't know any programming language that is so fluent/high-level that comments are unnecessary; given that mainstream programming languages always instruct "how", I think comments of "why" will always have their place.)

Okay, to the point, within this idiom, it's import for each step (given, when, then) to be as small as possible, so that the reader only has to deal with [7+/-2](http://en.wikipedia.org/wiki/The_Magical_Number_Seven,_Plus_or_Minus_Two) lines of code to comprehend the test.

Of course, this 7+/-2 limitation is hard to accomplish.

Approach for Assertions
-----------------------

One trick I've occasionally used, specifically within the "then" assertion section, is to make custom, higher-/business-level assertions.

E.g. often you'll see code that wants to assert "there are two $50 credit transactions", but it takes 5 lines of code to accomplish:

```java
assertThat(txns.getSize(), is(5));
assertThat(txns.get(0).getAmount(), is(Money.dollars(50.00));
assertThat(txns.get(0).getType(), is(CREDIT));
assertThat(txns.get(1).getAmount(), is(Money.dollars(50.00));
assertThat(txns.get(1).getType(), is(CREDIT));
```

We just ate more than half of our 7 LOC budget.

So, in thinking how we can make this assertion simpler, and more direct, I've wound up occasionally using strings (gasp) to encode a high-/business-level meaning, e.g.:

```java
assertTxns(txns, "1/1 $50 CREDIT", "1/1 $50 CREDIT");
```

Or, if you have attributes about an account (like overpaid or overdue), you might do:

```java
// then the 1st account is bad
assertAccount(account1, "#1234 CHECKING (overpaid, overdue)");
// and the 2nd account is okay
assertAccount(account2, "#5678 CHECKING");
```

Note how ideally information you normally wouldn't care about, like an account being overpaid (which is hopefully unusual), is not included in the default description, as it would be noise that most test cases don't care about.

Pros
----

I think the benefit of this approach is that you're able to pack a lot of information into a single LOC. It's like making a mini-DSL for your assertions.

It is similar to [FIT](http://fit.c2.com/) table-based assertions, where the assertions are declarations of desired output that a business person would understand, and not manual, imperative checks.

I think these high-level assertions can be very nice to read, which is useful especially if you're quickly scanning tests, trying to understand each boundary condition.

Cons
----

Granted, there are some things to watch out for:

1. You have to carefully pick and choose what the relevant information you include in the description.

   If you choose too little information, the `assertAccount` will not be useful, and tests will have to fall back to low-level assertions.

   If you choose too much information, then each `assertAccount` call has a lot of extra noise, which is distracting to read ("Do we really care about attribute X for this test case? Or is it just in the description by default?").

   You also risk having a whole lot of assertions fail if they include information they don't technically care about, but somehow changes due to an otherwise unrelated change.

2. These are strings, so are hidden from refactoring and "find caller" references, and can generally be a pita to update if they have to change.

   (As a minor justification for this, I can at least know that all of these strings are evaluated at test time.)

3. Making a DSL has a cost that will only pay off if you have a lot of similar assertions.

   This likely means it's only worthwhile for larger, more complex projects that have many use cases for the same entities. E.g. a banking system would surely have an awful lot of assertions against account balances/attributes.

Potential Alternative
---------------------

I haven't tried it yet, but I could see addressing the cons with an assertion method that used optional parameters, e.g. in Scala:

```scala
assertAccount(account1, id = 1234, type = Checking);

// here's the custom assertion method:
def assertAccount(
  account: Account,
  id: Int = 0,
  type: AccountType = null,
  overpaid: Boolean = null) {
  // only assert against parameters that were provided
  if (overpaid != null) {
    assertThat(account.getOverpaid, is (overpaid))
  }
}
```

This way each test method could opt-in to only asserting the attributes it cares about. ...although this sounds very similar to the imperative approach, and is just kind of hacking it to be one 1 line.

I'm also not sure how this would work with multiple entities (like asserting against a list of accounts), although maybe the compromise is that you just have to have 1 assertion per entity.

Conclusion
----------

Anyway, my basic thought is that "then" assertion sections of tests can easily become too many lines of code, with too many repetitive, imperative assertions, and so it's worth keeping in mind how/when you could switch over to a more declarative DSL-/FIT-style approach, even within the confines of regular xUnit tests.


