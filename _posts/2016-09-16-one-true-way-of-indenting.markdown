---
title: The One True Way Of Indentation
layout: post
---

{{page.title}}
==============

My preferred way of indentation is wrap-all, indent-by-one, which looks like:

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
{: class="brush:java"}

(Pretend that the lines were long enough to need wrapping.)

The reason this works well is that it minimizes ugly diffs and busywork moving fields around.

Why not wrap-when-needed
======================

For example, one alternate indentation is wrap-when-needed, so:

    // method call
    foo(param1, param2,
      param3, param4);

    // method declaration
    public void foo(String param1, String param2,
        String param3, String param4) {
      // implementation
    }
{: class="brush:java"}

There are several problems here, one is ugly diffs, and the other is just bad readability.

Ugly diffs result because when we add/remove/reorder a parameter that is in the middle of the arguments, it's going to shift all of other parameters around. E.g. the new version might look like, adding `newParam`:

    // method call
    foo(param1, newParam,
      param2, param3, param4);

    // method declaration
    public void foo(String param1, String newParam,
        String param2, String param3, String param4) {
      // implementation
    }
{: class="brush:java"}

Note how `param2` was shifted down onto the next line, and `param2`/`param3` shifted over.

Even with a diff/code review tool that is smart about white, and can inner highlight changes, this is a lot of parameters moving around for no reason. This was also a very vanilla addition/shift, diffs can easily get annoying where you have to stare at each line to see which parameters moved/were added/removed.

With wrap-all, adding a new parameter to already-wrapped lines results in a very nice diff:

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
{: class="brush:java"}

The issue with general readability is that if I have ~5-10 plus method parameters (and yes, we can talk about refactoring to parameter objects, etc., etc., but the reality is that real code looks like this), then my eye has too parse ~5-10 parameters out from a condensed line, e.g.:

    // method declaration
    def foo(param1: Option[String] = None, param2: Option[String] = None,
      param3: Option[String] = None, param4: Option[String] = None) {
      // implementation
    }
{: class="brush:java"}

I can't easily glance at that and see "okay, we have four parameters, `param1`, `param2`, `param3`, `param4`."

If this was wrapped wrap-every, it's trivial to scan:

    // method declaration
    def foo(
      param1: Option[String] = None,
      param2: Option[String] = None,
      param3: Option[String] = None,
      param4: Option[String] = None) {
      // implementation
    }
{: class="brush:java"}

Easy, obvious to read, all the parameter names can be read with one eye sweep.

Why not indent-on-column
========================

Another option is indent-on-column, which looks like:

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
{: class="brush:java"}

There are several problems here; ugly diffs, wasted white space, and general inconsistency.

For diffs, when `someMethodName` is every renamed, all of the wrapped parameter lines are going to shift. Which, yes sophisticated diff/code review tools can hopefully ignore this, but it's still needless noise

For wasted white space, the wrapped lines are shifted way over to where ever `someMethodName` ends, which means they have less space for their own names, and all of the white space before them is wasted. (Granted, if indent-on-column is used with wrap-every, this is not as bad, because in theory each wrapped line should itself be short. However, if you combine indent-on-column with wrap-when-needed, that space is more valuable.)

For inconsistency, if I have multiple wrapped lines, my eye now has a random place to find the wrapped parameters, e.g.:

    // method call
    someMethodName(param1,
                   param2,
                   param3,
                   param4);

    // antoher method call
    someNiceVariableName.withAnotherNiceName(param1,
                                             param2,
                                             param3,
                                             param4);

{: class="brush:java"}

Where `param2` ends up is basically random (based on the method name being called), instead of being consistent.

In contrast, indent-by-one handles all of these; nice diffs, no wasted space, and wrapping is consistent.

Indent-by-two for method declarations
=====================================

One good exception for indent-by-one is to use indent-by-two for method declarations.

This pushes the wrapped parameter declarations in another level, which is because then they are not aligned with the implementation code:

    // method declaration
    public void foo(
        String param1,
        String param2,
        String param3,
        String param4) {
      // implementation
    }
{: class="brush:java"}

One true way
============

Historically I've put indentation in the "personal preference" category, but now code reviews are such an integral part of software development, that I think the clean diff benefits of wrap-all, indent-by-one is basically a defacto best practice that new codebases should always use, and historical codebases should be migrated towards when/if possible.

The differences seem small, but when you're reading a code review with a variety of changes, spread across files, in code you may/may not be familiar with, these little readability issues really add up, as the easier the code is to read syntactically, the more thought processes you can spend on understanding the semantics, which is the most important thing.



