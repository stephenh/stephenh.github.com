---
title: JavaFX Decompiled
description: ""
date: 2009-01-18T00:00:00Z
---


While lamenting the lack of BGGA closures in Java, I came across a [poll][1] that had some interesting JavaFX comments from a guy named Bryan: 

<blockquote>
    JavaFX Script is Java++ ... as general purpose as Java itself ... type inference ... closures ...

    The primary language on the JVM in the future will be JavaFX Script. New language features will go there. Java will not accept new features.
</blockquote>

Okay, my interest was piqued. Besides JavaFX being a UI toolkit, turns out JavaFX Script is a new programming language as well. Would Sun really choose an entirely different language to evolve Java? They've done sillier things, I suppose, so, maybe?

Looking through some tutorials, JavaFX seems like it might actually work--it even has a crazy `bind` keyword for data binding. Given my [bindgen][2] hobby project, I was very interested to see how they implemented first-class data binding.

Tutorials only go so far though, so I downloaded the JavaFX SDK, made sure I still had the very handy [Jad][3] decompiler around, and thought I'd see what was really going on.

After a few tests, I ended up with `foo.fx`:

```plain
var num = 1;
var x = bind f(num);

println("num={num}, x={x}");

num = 3;
println("num={num}, x={x}");

function f(arg:Integer) {
    return arg + 1;
}
```

Running `javafxc foo.fx` to compile it and then `javafx foo` to run it produces this output:

```plain
num=1, x=2
num=3, x=4
```

Okay, cool, the `f(num)` function is being lazily bound to `x`, such that `x` changes with `num`.

How'd they do that?

Run `jad foo.class` and we get:

```java
import com.sun.javafx.runtime.*;
import com.sun.javafx.runtime.location.*;
import com.sun.javafx.runtime.sequence.Sequence;
import javafx.lang.Builtins;

public class foo implements Intf, FXObject {
    public static final IntVariable $num = IntVariable.make();
    public static final IntVariable $x = IntVariable.make();

    public static Object javafx$run$(Sequence sequence) {
        $num.setAsInt(1);
        $x.bind(IntVariable.make(false, new IntBindingExpression() {
            private IntLocation arg$0;
            { arg$0 = foo.$num; }
            protected Location[] getStaticDependents() {
                return (new Location[] { arg$0 });
            }
            public int computeValue() {
                return foo.f(arg$0.getAsInt());
            }
        }, new Location[0]));
        Builtins.println(String.format("num=%s, x=%s", new Object[] {
            Integer.valueOf($num.getAsInt()), Integer.valueOf($x.getAsInt())
        }));
        $num.setAsInt(3);
        Builtins.println(String.format("num=%s, x=%s", new Object[] {
            Integer.valueOf($num.getAsInt()), Integer.valueOf($x.getAsInt())
        }));
        return null;
    }

    public static int f(int i) {
        return i + 1;
    }

    public void initialize$() {
        addTriggers$(this);
        userInit$(this);
        postInit$(this);
        InitHelper.finish(new AbstractVariable[0]);
    }

    public static void addTriggers$(Intf intf) {
    }

    public foo() {
        this(false);
        initialize$();
    }

    public foo(boolean flag) {
    }

    public static void userInit$(Intf intf) {
    }

    public static void postInit$(Intf intf) {
    }

    public static void main(String args[]) throws Throwable {
        Entry.start(foo, args);
    }
}
```

A *lot* of syntactic sugar is going on here.

The biggest surprise is that variables in JavaFX are not variables in Java, but instead are wrapper objects, e.g. `IntVariable`.

This allows the binding to work, where `x` is not set to a value, but instead set to an anonymous inner class that holds the reference to `num` for late-binding `x`.

Coincidentally, this is similar to [bindgen][2]'s approach--it also uses anonymous inner classes that are initialized with references to late-bind the evaluation.

What is also surprising is all of the `addTriggers`, `postInit`, `userInit`, etc. in the output.

I'm not sure what to make of this. This is where I start doubting JavaFX Script as the next general purpose language.

This is a bit hypocritical of me--I pine for the "good" magic of extension methods, local variable type inference, and BGGA closures, but I start to cringe and label it "bad" magic when `int` is now an `IntVariable` and my class has a bunch of cruft it in. It seems like meta-level semantics that I was not expecting.

I trust these meta-level semantics are perfect for leveraging JavaFX Script in the JavaFX UI framework, but to me it disqualifies JavaFX as a "Java++" contender.

It seems like all of the "Java++" contenders (JavaFX, Groovy, and Scala) add their own meta-level semantics on top of Java. They need the meta-level to do the dynamic, trait, etc., cool features, but, to me, it just adds complexity and a leaky abstraction that I'd rather not deal with.

Enterprise software is hard enough and bad enough as it is--I can't imagine the average programmer also having to deal with, say, Scala's case classes, or traits, or whatever other nifty tricks the current "Java++" contenders layer on top of Java.

The simplicity of Java is a real virtue. I assert that any language that adds its own "meta-level semantics" on top of Java is not going to replace it.

My current rule of thumb: if you can decompile a "Java++" contender's code into the regular Java syntax, and have it look pretty darn close to what you'd type out by hand, then you've found your true "Java++" language.

[1]: http://java.net/pub/pq/242
[2]: http://github.com/stephenh/bindgen
[3]: http://www.kpdus.com/jad.html

