---
layout: post
title: Private Static Factory Method Chord
section: Productivity
---

{{page.title}}
==============

I have this notion of a "refactoring chord", which is more than a single refactoring (like [rename method](http://martinfowler.com/refactoring/catalog/renameMethod.html)), but less than a full-fledged [refactoring to a pattern](http://industriallogic.com/xp/refactoring/) that I've been meaning to post about for awhile now.

It's simple and perhaps obvious, but I think still useful to recognize when stringing together multiple single refactorings in a common way works out particularly well.

One chord that I like is what I'll call "private static factory method", which is really just about creating custom/per-use factory methods (vs. factory methods in the class itself).

This is often used for test data, e.g. if you have:

```java
Employee e1 = new Employee();
e1.setName("e1");
e1.setAge(50);
e1.setDescription("great employee");
Employee e2 = new Employee();
e2.setName("e2");
e2.setAge(51);
e2.setDescription("awesome employee");
Employee e3 = new Employee();
e3.setName("e3");
e3.setAge(52);
e3.setDescription("wtf employee");
doSomethingWith(e1, e2, e3);
```

This sort of code burns my eyes. I can't keep track of the `e1`, `e2`, `e3` variables, and often make copy/paste typos of missing a change from `e1` to `e3`.

Just grouping the assignments is a little better:

```java
Employee e1 = new Employee();
e1.setName("e1");
e1.setAge(50);
e1.setDescription("great employee");

Employee e2 = new Employee();
e2.setName("e2");
e2.setAge(51);
e2.setDescription("awesome employee");

Employee e3 = new Employee();
e3.setName("e3");
e3.setAge(52);
e3.setDescription("wtf employee");

doSomethingWith(e1, e2, e3);
```

As now each variable declaration is very close to it's use site and you can reason about `e1` for awhile, then `e2` for awhile, and finally `e3`.

However, the multiple `setName`, `setAge`, `setDescription` calls are a good candidate for [Extract Method](http://martinfowler.com/refactoring/catalog/extractMethod.html):

```java
Employee e1 = newEmployee("e1", 50, "great employee");
Employee e2 = newEmployee("e2", 51, "awesome employee");
Employee e3 = newEmployee("e3", 52, "wtf employee");
doSomethingWith(e1, e2, e3);

private static Employee newEmployee(String name, int age, String description) {
  Employee e = new Employee();
  e.setName(name);
  e.setAge(age);
  e.setDescription(description);
  return e;
}
```

Nothing ground breaking, and we're basically just adding a custom constructor/factory method for our own use. Obviously if you controlled the `Employee` source and had several clients wanting a `newEmployee` method, you could move it into the `Employee` class.

However, I typically find these private factory methods make several use-case specific assumptions, e.g. if you're in a unit test you assume a certain scenario so that the test is more succinct.

Anyway, to make this a chord instead of just a normal Extract Method, I've seen this work really well by following up with an Inline Variable:

```java
doSomethingWith(
  newEmployee("e1", 50, "great employee"),
  newEmployee("e2", 51, "awesome employee"),
  newEmployee("e3", 52, "wtf employee"));
```

The combination here (Extract Method + Inline Variable) I think results in much more readable code as we went from 13 LOC to accomplish what we really want (calling `doSomethingWith`) to 4 LOC. ~3x less.

(Yes, the `newEmployee` method's LOC still counts against our total LOC, but I'm concerned with the LOC of the current method here, e.g. if this is a `testDoSomething` method that is also doing other setup/assertions, we're less likely to get distracted by 4 LOC in the middle of the test method than the original 13 LOC.)

I often find myself using this in unit tests for constructing DTOs, e.g. when faking out DTOs coming in over the wire to the application under test.

So, that's it, nothing ground breaking, but still useful, I think.

