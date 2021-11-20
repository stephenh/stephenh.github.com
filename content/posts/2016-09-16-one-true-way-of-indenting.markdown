---
date: "2016-09-16T00:00:00Z"
categories:
  - Productivity
title: The One True Way Of Indentation
---


My preferred way of indentation is wrap-all, indent-by-one, which looks like:

```java
// method call
foo(
  param1,
  param2,
  param3,
  param4);

// method declaration
public void foo(
  String param1,
  String param2,
  String param3,
  String param4) {
  // implementation
}
```

(Pretend that the lines were long enough to need wrapping.)

"wrap-all" means, if a line passes the max line length (e.g. 120), don't just break it into only two lines, but wrap each segment of the method call/method declaration on it's own line, even if this creates more lines than necessary.

So, in our example above, we put all four parameters on their own line, taking 4 lines total, even though we could have also put `param1` and `param2` together, and then `param3` and `param4` together, and used only 2 lines (see the "wrap-when-needed" section below for an example).

"indent-by-one" means, when wrapping, start the wrapped line one indentation level (e.g. 2 spaces or whatever your project's configured indent level is) past the current line's indentation.

The reason these two styles work well is that they:

1. Minimize ugly diffs, as wrap-all + indent-by-one is very resilient to changes
2. Reduces the busywork of re-wrapping/re-indenting (which granted should be done by a formatter anyway)
3. Has the best readability/eye-friendly scanning for code reviews

Why not wrap-when-needed
========================

One alternate indentation style is wrap-when-needed, which looks like:

```java
// method call
foo(param1, param2,
  param3, param4);

// method declaration
public void foo(String param1, String param2,
    String param3, String param4) {
  // implementation
}
```

There are several problems here: one is ugly diffs, and the other is just bad readability.

Ugly diffs result because when we add/remove/reorder a parameter that is in the middle of the arguments, it's going to shift all of other parameters around. E.g. the new version might look like, adding `newParam`:

```java
// method call
foo(param1, newParam,
  param2, param3, param4);

// method declaration
public void foo(String param1, String newParam,
    String param2, String param3, String param4) {
  // implementation
}
```

Note how `param2` was shifted down onto the next line, and `param2`/`param3` shifted over.

Even with a diff/code review tool that is smart about white space, and can inner highlight changes, this is a lot of parameters moving around for no reason. This was also a very vanilla addition/shift, diffs can easily get annoying where you have to stare at each line to see which parameters moved/were added/removed.

With wrap-all, adding a new parameter to already-wrapped lines results in a very nice diff:

```diff
// method call
foo(
  param1,
+ newParam,
  param2,
  param3,
  param4);

// method declaration
public void foo(
  String param1,
+ String newParam,
  String param2,
  String param3,
  String param4) {
  // implementation
}
```

The issue with general readability is that if I have ~5-10 plus method parameters (and yes, we can talk about refactoring to parameter objects, etc., etc., but the reality is that real code looks like this), then my eye has too parse ~5-10 parameters out from a condensed line, e.g.:

```scala
// method declaration
def foo(param1: Option[String] = None, param2: Option[String] = None,
  param3: Option[String] = None, param4: Option[String] = None) {
  // implementation
}
```

I can't easily glance at that and see "okay, we have four parameters, `param1`, `param2`, `param3`, `param4`."

If this was wrapped wrap-all, it's trivial to scan:

```scala
// method declaration
def foo(
  param1: Option[String] = None,
  param2: Option[String] = None,
  param3: Option[String] = None,
  param4: Option[String] = None) {
  // implementation
}
```

Now all of the parameter names can be read with one eye sweep.

Why not indent-on-column
========================

Another option is indent-on-column, which looks like:

```java
// method call
someMethodName(param1,
               param2,
               param3,
               param4);

// method declaration
public void someMethodName(String param1,
                           String param2,
                           String param3,
                           String param4) {
  // implementation
}
```

There are several problems here: again ugly diffs, but now wasted white space, and also general inconsistency.

For diffs, when `someMethodName` is renamed, all of the wrapped parameter lines are going to shift. Which, yes, sophisticated diff/code review tools can hopefully ignore this white space-only change (although the one we use at work does not), but it's still needless noise.

For wasted white space, the wrapped lines are shifted way over to where `someMethodName` ends, which means they have less space for their own names. (Granted, if indent-on-column is used with wrap-all, this is not as bad, because each parameter get it's own (shortened) line of space. However, if you combine indent-on-column with wrap-when-needed, that space is more valuable.)

For inconsistency, if I have multiple wrapped lines, my eye now has a random place to find the wrapped parameters, e.g.:

```java
// method call
someMethodName(param1,
               param2,
               param3,
               param4);

// another method call
someNiceVariableName.withAnotherNiceName(param1,
                                         param2,
                                         param3,
                                         param4);
```

Where `param2` ends up vertically is basically random (based on the method name being called), instead of being consistent.

In contrast, indent-by-one handles all of these: nice diffs, no wasted space, and wrapping is consistent.

Indent-by-two for method declarations
=====================================

One good exception for indent-by-one is to use indent-by-two for method declarations.

This pushes the wrapped parameter declarations in another level, so that then they are not vertically aligned with the lines in the method body, and so don't accidentally blend into the method body:

```java
// method declaration
public void foo(
    String param1,
    String param2,
    String param3,
    String param4) {
  // implementation
}
```

Wrap-all for fluent call chains
===============================

Wrap-all also works really well for fluent call chains, such as a series of `map`, `filter`, etc. calls on a collection, or a series of `setFirstName`, `setLastName`, etc., calls on a builder.

For example calls on a collection with wrap-all:

```scala
someAccounts
  .filter { _.hasSomethingSpecial() }
  .flatMap { _.getTransactions() }
  .sortBy { _.getDate }
  .map { t => someFunctiont(t); }
```

Since each transformation is on it's own line, it's easy to scan down the list and track what is the current type in the collection.

With wrap-when-necessary, the transformations become jumbled together and it's hard to tease out what each separate step is. E.g. with wrap-when-necessary:

```scala
someAccounts
  .filter { _.hasSomethingSpecial() }.flatMap { _.getTransactions() }
  .sortBy { _.getDate }.map { t => someFunctiont(t); }
```

When my eye hits the `.sortBy` on the 2nd line, it's not immediately clear which steps have happened before this; I see the `filter`, but I have to parse the entire 1st line (which in this case only has two steps, but in real code could have ~3-4) to see what type the `.sortBy` will have.

I basically have to shift my thinking into mini-parser mode, and start paying (more) attention to matching `{` and `}` to see what the steps are.

Which of course I can do, and is trivial, but it subtly shifts my mind from "semantic mode" to "syntax mode", and then I'll have to shift back.

Builder call chains work similarly well with wrap-all:

```scala
new Employee()
  .setFirstName("foo")
  .setLastName("bar")
  .setAddress(
    new Address()
    .setStreet("street")
    .setCity("city")
    .build());
```

Fluent collections and builders are such a great use of wrap-all that I've noticed several times in codebases that otherwise uses wrap-when-necessary, programmers will naturally format collections/builders as wrap-all, because it works so well.

IDE format on save
==================

One potentially controversial aspect of formatting is whether it should be programmer-enforced or IDE-/formatter-enforced (whether invoked from the IDE manually or automatically on save).

There are pros/cons to each.

IDE-enforced pros/cons:

* Pro: keeps the codebase look and feel defacto consistent, because it's always kept in the formatter-dictated format
* Pro: minimizes noisy format-only changes in diffs
* Con: if you have a mixed IDE environment then, even if configured very similarily, the formatter results will be slightly different across IDEs
* Con: the formatter may pick a bad formatting choice

Programmer-enforced pros/cons:

* Pro: Gives programmers very direct/personal control over formatting
* Con: Leads to inconsistencies depending on the developer who wrote the code
* Con: Leads to noisy diffs when/if someone does decide to auto-format the code

All things considered, I think IDE-enforced formatting (via format on save) is a net win.

Today's formatters (Eclipse's Java formatter is what I have the most experience with) are, in my experience, very good if you configure them correctly.

For dealing with mixed-IDE environments, one interesting approach, for the Java/Eclipse/IntelliJ world, is that Eclipse's formatter can be used in standalone mode. So there is an [IntelliJ plugin](https://plugins.jetbrains.com/plugin/6546) that will run the Eclipse formatter, with your project's Eclipse formatter settings, from within IntelliJ. I have briefly tried it, and it was surprisingly seamless. In theory you could apply this to other IDEs, and even integrate it into vim/CLI builds.

Also, if you're in a mixed-IDE environment, two other potential options are:

1. Configure the IDE to only format changed lines

   For Eclipse, this only works in Save Actions, so if you hit `Control Shift F`, it will still format the whole file.

   But if you rely on the Save Action formatting, then you won't make noisy diffs in parts of the file you don't touch.

2. Configure the IDE to never join already wrapped lines

   This would mean IDE won't re-evaluate already-wrapped lines and so come to potentially different conclusions than whoever (person or other IDE) originally wrapped the line.

   (There is an Eclipse option for this, I don't know about IntelliJ.)

I've not personally used either of these options, and so just from experience prefer letting the IDE reformat the entire file on every save. But if that causes too many noisy diffs, I'd definitely explore using these to avoid the constant annoyance of noisy diffs.

The Heller-special formatter trick
==================================

Although IDE formatters typically make good choices, it is occasionally useful to tweak where the formatter wraps.

(Or, if you're working on a project that uses wrap-when-necessary, but you have a collection/builder call chain that would be dramatically easier to read with wrap-all...)

You can do this by using a trick a colleague of mine discovered ~10 years ago, which is using fake comment entries, `//`, to force line breaks.

When the formatter sees the start of the `//` comment, even if you don't put any text after it, it must wrap the next line, because condensing the lines means the 2nd line of code would be commented out.

So, you can do something like:

```java
someAccounts //
  .stream() //
  .filter { a -> a.hasSomethingSpecial() } //
  .flatMap { a -> a.getTransactions().stream() } //
  .sortBy { t -> t.getDate() } //
  .map { t -> someFunctiont(t) }
```

The first few times people see this, they have a very "wtf is that" reaction. And rightly so. 

This trick is not at all something I'd recommend using liberally in your codebase. If you use it all the time, it insinuates your formatter settings are wrong, or your project is using wrap-when-necessary when you really want wrap-all, or something like that.

That said, used judiciously, teams that I've worked on have had success with this.

(We have admittedly used it more than we should on projects that use wrap-when-necessary, when really we should stop beating around the bush and push for moving the projects over to wrap-all.)

Application to other languages
==============================

My examples so far have all used Java or Scala, but wrap-all and indent-by-one apply to basically all mainstream programming languages (maybe not LISPs? not sure).

For example, one of my pet peeves is SQL that is wrap-when-necessary, e.g.

```sql
SELECT first_name, last_name, street_1, street_2
  city, state, zip, phone FROM table
  WHERE first_name = '...' AND (city = '...'
  OR city = '...')
```

This is a mess to read; it has the same flaws as the wrap-when-necessary Java code: hard to see which columns are returned, ugly diffs when we add/remove columns, seemingly arbitrary wrapping (e.g. in the middle of an `OR` clause).

Using wrap-all + indent-by-one, you can format this as:

```sql
SELECT
  first_name,
  last_name,
  street_1,
  street_2
  city,
  state,
  zip,
  phone
FROM table
WHERE
  first_name = '...'
  AND (
    city = '...'
    OR city = '...')
```

Is it more lines of code? Yes. But is it also more readable and resilient to change? Definitely yes.

The one true way
================

Historically, I've considered indentation to be in the "personal preference" category of software decision making.

But now that code reviews are an integral part of software development, I think the easy readability and clean diff benefits of wrap-all, indent-by-one means it should be the standard/best practice indentation that new codebases use, and historical codebases should be migrated towards this when/if possible.

The differences seem small, but when you're reading a code review with a variety of changes, spread across several files, in code you may/may not be familiar with, then these little readability issues really add up.

Because the easier the code (and code reviews) is to read syntactically, the more thought processes you can spend on understanding the semantics, which is the most important thing.


