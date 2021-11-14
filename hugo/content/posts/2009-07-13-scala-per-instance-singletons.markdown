---
date: "2009-07-13T00:00:00Z"
section: Scala
title: Scala Per-Instance Singletons
---

Scala Per-Instance Singletons
=============================

I was reading about [Lift](http://liftweb.com) and came across a funky scala syntax:

```scala
class Foo {
  object bar {
    val name = "bob"
  }
}
```

This:

1. Declares a `Foo.bar` field
2. Declares a `bar` inner class
3. Adds a `Foo.bar()` method that lazy-instantiates a single instance of the `bar` inner class for each `Foo` instance

Looking at the decompiled code, it makes more sense:

    import java.rmi.RemoteException;
    import scala.ScalaObject;

    public class Foo implements ScalaObject {
        private bar. bar$module;

        public Foo() {
        }

        public final bar. bar() {
            class bar. implements ScalaObject {
                private final String name = "bob";
                public bar.() {
                    super();
                }
                public String name() {
                    return name;
                }
                public int $tag() throws RemoteException {
                    return scala.ScalaObject.class.$tag(this);
                }
            }
            if(bar$module == null)
                bar$module = new bar.();
            return bar$module;
        }

```java
    public int $tag() throws RemoteException {
        return scala.ScalaObject.class.$tag(this);
    }
}
```

My one curiosity is the lack of synchronization in the lazy initialization. I don't know about the official Scala docs, but Lift insinuated an "inner object" declaration was a singleton, not a singleton-unless-you-have-lots-of-threads.

If you use top-level `object` declarations, it seems to make more sense:

```scala
object Bar {
  def zaz() = {
    println("hi")
  }
}
```

As this is decompiled to:

    public final class Bar {
      public static final void zaz() {
        Bar..MODULE$.zaz();
      }

      public static final int $tag() throws RemoteException {
        return Bar..MODULE$.$tag();
      }
    }

    public final class Bar$ implements ScalaObject {
      public static final Bar$ MODULE$;

      static {
        new Bar$();
      }

      public Bar$() {
        MODULE$ = this;
      }

      public void zaz() {
        Predef..MODULE$.println("hi");
      }

```java
  public int $tag() throws RemoteException {
    return ScalaObject.class.$tag(this);
  }
}
```

This uses the `Bar$` static initializer to ensure there is just one instance of `Bar$`. Which works great.

"Inner" object declarations not being true singletons is probably not a big deal, it was just something I was curious about.

