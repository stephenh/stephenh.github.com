---
layout: post
title: GWT Classpaths 101
---

{{page.title}}
==============

During discussions on the [ScalaGWT](https://github.com/scalagwt) mailing list, it came up a few times that GWT doesn't have a separate compiler classpath vs. user classpath. I was originally obliged to agree, but now thinking that is not quite the case.

While GWT does not have a `-user-classpath` flag, it does very much have a separate, client-side classpath, and knowing how it works (and the reason why it works) is helpful in understanding GWT.



Binary-Only Annotations
-----------------------

Why does GWT not support any random class with bytecode? Because it needs the source AST to do a meaningful translation to JavaScript.

What Java artifacts exist in bytecode form but don't have any meaningful behavior? Annotations.

GWT lets you use annotations that you don't have the source `.java` files for because it can faithfully mirror their information at compile-time and not worry about having to make runtime JavaScript for them.

This means your classpath is now effectively:

    client-side .java files + client-side super-sourced .java files + server-side binary-only annotations

Foo.

