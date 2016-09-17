---
layout: post
title: Spark Test
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com) we're currently evaluating [Spark](http://www.spark-project.org) as a replacement for Hive for reporting.

So far we're still in the prototype stage, but it's looking promising.

As an example of some Spark code, I thought I'd copy/paste one of my "let's try Spark" unit tests:

    object SparkTest {
      val sc = new SparkContext("local", "unit test")
    }

    class SparkTest extends ShouldMatchers {
      import SparkTest._
      import SparkContext._

      @Test
      def test() {
        // make collection (table) a, with 3 rows, each
        // row is a tuple of (key, value), or (Int, String)
        val a = sc.parallelize(List((1, "a"), (1, "b"), (2, "c")))

        // make collection (table) b, also with 3 rows
        val b = sc.parallelize(List((1, 5.00), (1, 6.00), (3, 7.00)))

        // typical join, all that match in both a and b
        a.join(b).collect() should be === Array(
          (1, ("a", 5.00)),
          (1, ("a", 6.00)),
          (1, ("b", 5.00)),
          (1, ("b", 6.00)))

        // typical left join, include all from a
        a.leftOuterJoin(b).collect() should be === Array(
          (1, ("a", Some(5.00))),
          (1, ("a", Some(6.00))),
          (1, ("b", Some(5.00))),
          (1, ("b", Some(6.00))),
          (2, ("c", None)))

        // typical right join, include all from b
        a.rightOuterJoin(b).collect() should be === Array(
          (3, (None, 7.00)),
          (1, (Some("a"), 5.00)),
          (1, (Some("a"), 6.00)),
          (1, (Some("b"), 5.00)),
          (1, (Some("b"), 6.00)))

```scala
    // cogroup, which is the primitive, and returns each
    // key with the key's elements from both a and b
    a.cogroup(b).collect() should be === Array(
      (3, (Seq(), Seq(7.00))),
      (1, (Seq("a", "b"), Seq(5.00, 6.00))),
      (2, (Seq("c"), Seq())))
  }
}
```

A few things to note:

1. Spark's primary API is a Scala DSL, with a collection-like [`RDD`](http://www.spark-project.org/docs/0.6.0/api/core/index.html#spark.RDD) type, so our reports are mostly `map`, `filter`, and `join` calls.

2. Holy shit this is a unit test--completely unlike Hive, Spark can run locally (see the `"local"` parameter to `SparkContext`) very trivially, by being embedded in a unit test.

   The above test takes ~2 seconds to spin up Spark in local mode (which is not actually in-process) and execute the tests. Amazing!

   This is a *huge* reason as to why I am liking Spark much more than Hive, where our reports were basically not under test.

3. The above test is just kicking the tires of `cogroup`, `join`, `leftOuterJoin`, and `rightOuterJoin`.

   While the `join` flavors are recognizable from SQL, it is interesting that `cogroup` is actually the primitive operation, and the `join` operations are implemented as secondary reorganizations of the data (via `map`/`flatMap` calls) returned from `cogroup`.

   Refreshingly, you can read the Spark implementation of the various `join` operations, and they really are just 4-5 lines of very readable Scala code.

This is obviously a small example, where I was just loading some very small, hard-coded data into Spark (via the `parallelize` calls). Eventually I hope to post more Spark-related techniques/results as the report we're working on gets more flushed out.
