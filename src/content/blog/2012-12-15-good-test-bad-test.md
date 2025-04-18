---
title: Good Test, Bad Test
description: ""
date: 2012-12-15T00:00:00Z
tags: ["Testing"]
---



I caught myself writing a bad test yesterday, but while setting up the code review thought, er, if I was reviewing this code, I would be less than thrilled.

So, I refactored the test and updated the code review to include it.

The difference in test quality was so much better, IMO, that I thought I'd post it here as an example.

The Code
--------

So, what I am testing is a `substringBetween` utility method, with just finds two tokens and replaces what is between them with a new string.

Note that the places we use this are very limited/special, so we're assuming the tokens will always exist, and so ignoring some boundary conditions that would otherwise need handled.

Anyway, here's the code:


```java
public static String replaceBetween(
    final String s,
    final String startToken,
    final String endToken,
    final String replacement) {
  final int i = s.indexOf(startToken);
  final int j = s.indexOf(endToken, i + startToken.length());
  return s.substring(0, i + startToken.length())
    + replacement
    + s.substring(j);
}
```

Bad Test
--------

So, this is the test I started out with:

```java
@Test
public void testReplaceBetween() {
  assertThat(
    replaceBetween("one two three four", "two", "three", "!"),
    is("one two!three four"));
  assertThat(
    replaceBetween("aaaabccaa", "b", "a", "CC"),
    is("aaaabCCaa"));
  assertThat(
    replaceBetween("starttoken ... tend", "starttoken", "t", " !!! "),
    is("starttoken !!! tend"));
}
```

This test covers 3 boundary cases that I cared about, but while setting up the review, I found several things confusing about it:

* The strings/tokens are non-sensical to each case
* The strings/tokens change arbitrarily between each case
* The strings/tokens are arbitrarily longer/shorter between each case

The result is that it's very hard to quickly glance at these tests and tell what is actually being tested.

Good Test
---------

This is what I ended up refactoring the test to:

```java
@Test
public void testReplaceBetween() {
  assertThat(
    replaceBetween("start middle end", "start", "end", "!"),
    is("start!end"));
}

@Test
public void testWhenEndTokenIsAlsoBeforeTheStartToken() {
  assertThat(
    replaceBetween("end start middle end", "start", "end", "!"),
    is("end start!end"));
}

@Test
public void testWhenEndTokenIsWithinTheStartToken() {
  assertThat(
    replaceBetween("startendstart middle end", "startendstart", "end", "!"),
    is("startendstart!end"));
}
```

I think this version is demonstrably better:

* The boundary cases are highlighted in the method names
* The strings under test and tokens are very simple and align with the concepts they are testing
* The strings under test contain minimal noise that is not directly related to the boundary cases being tested

A big improvement.

I think this is important because the function of unit tests is not just to put boundary cases under test, it's also to explain these boundary cases to future maintainers so they can understand why the code (and tests) work the way they do.

Perhaps the bad test, for this small/simple code snippet, is not going to ruin our codebase. But as the code being tested starts getting larger/more complex, and the tests start getting larger/more complex, I think the time taken to make the tests just as clean and readable as the main codebase is time well spent.

(Obviously this is not a new concept; hopefully I am preaching to the choir.)




