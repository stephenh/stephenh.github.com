---
layout: draft
title: Spark Report Patterns
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com), we've been writing a lot of [Spark](https://spark.incubator.apache.org/) jobs lately.

We are big fans of Spark, as it's basically a faster, testable, type-safe alternative to Hive.

Over the course of writing many jobs, we've established a few patterns that have been working well.

Separate Job vs. Report Classes
-------------------------------

Unit testing our reports is a big reason we like Spark, and being able to unit test Spark logic relies on feeding your logic "fake" RDDs, instead of real "tons of real data from the cluster" RDDs.

So, while a naive Spark report might look like:

    class SomeReport {
      def main(args: Array[String]) {
        val sc = ...
        // load data from cluster/S3
        val rdda = sc.textFile("s3n://bucket/input/")

        // apply report logic
        val rddb = ...

        // now save the result
        rddb.saveAsTextFile("s3n://bucket/output/")
      }
    }
{: class="brush:scala"}

The code above is actually reminiscent of Hive code: some S3/HDFS URLs with input, interspersed with some logic, followed up by more S3/HDFS URLs for output.

It is short and sweet, but extremely untestable.

Spark allows you to create "fake" RDDs quite easily, and so what we'd really like to do is divorce the notion of "where the data in an RDD exists" from "what logic we apply to the RDD".

So, we settled onto having a "Job" class, which handles loading/saving RDDs, and a "Report" class, which is just the logic:

    class SomeJob {
      def main(args: Array[String]) {
        val sc = ...
        // load data from cluster/S3
        val rdda = sc.textFile("s3n://bucket/input/")

        // apply report logic
        val rddb = new SomeReport(...).run(rdda)

        // now save the result
        rddb.saveAsTextFile("s3n://bucket/output/")
      }
    }

    class SomeReport {
      def run(rdda: RDD[String]): RDD[String] = {
        rdda.filter { _.contains("user1") }
      }
    }
{: class="brush:scala"}

The upshot is that `SomeReport` now only takes and returns RDDs, without any cluster/S3 coupling.

This allows us to write a unit test:

    class SomeReportTest {
      val sc = new SparkContext("local", "SomeReportTest")
      val report = new SomeReport(...)

      @Test
      def shouldFindUser1() {
        // given we saw user1 and user2 in the logs
        val input = Seq("line1 user1 ...", "line2 user2 ...")

        // then only user1 is in the output
        val result = run(input)
        result.size shouldBe 1
      }

      private def run(fakeInput: Seq[String]): Seq[String] = {
        val input: RDD[String] = sc.parallelize(fakeInput)
        val result: RDD[String] = report.run(input)
        result.collect().toList.sorted
      }
    }
{: class="brush:scala"}

Looking at `shouldFindUser1`, the idea is that we want a really easy to read test:

* Given this really small input/boundary case
* When the report runs
* Then we should see a really small/easy to verify result

The test accomplishes this by having the `run` method translate the lists of fake log lines (`Seq[String]`) into Spark's RDD data structure, and then back again.

The beauty of Spark's RDD is that, since it models report steps as mutating every line in a collection by applying some closure/logic (`map`, `filter`, `reduce`, etc.), Spark will hide the details of whether this happens on these 2 test lines all in memory, or 100 million lines loaded from S3.

Specifically for our unit test, with Spark in local mode, this means our test runs in Eclipse/ant/etc. in seconds and will not touch any external data.

As any TDD/etc. zealot will tell you, this is a huge boon for developer productivity, as we can ruthlessly refactor our Spark jobs, and have confidence that we're not breaking existing functionality.

Log Line Case Classes
---------------------

After getting the job/report separation in place, we wanted to make both the report and the unit tests even easier to write.

In the example above, `SomeReport` was taking an `RDD[String]`, where each string is a raw line from the log file. This means two things:

1. `SomeReport` is responsible for parsing the raw string into meaningful values.

   This means `SomeReport` is concerning itself with implementation details (the format of the logs), instead of the business logic around their content.

2. `SomeReportTest` must synthesize valid raw strings for `SomeReport` to parse.

   This can get especially ugly if, say, your log line is a 50 column tab-separated file, when really each test is hopefully only filling into 2-3 columns that are specific to its boundary case.

   Since `SomeReport` is still going to do a `.split("\t")(x)` for each column, the test needs to fill in 45+ dummy values.

To better encapsulate the log implementation details, we started using "Line" case classes. The report and unit test then concern themselves with the Line, instead of Strings. This would look like:

    /** Line for our "request" logs. */
    case class RequestLine(line: String) {
      def timestamp: Long = parse(0).toLong
      def userId: String = parse(1)

      private def parse(index: Int) = {
       // Do some smart/efficient parsing of line; e.g. if it's
       // tab-separated, lazily pull out columns, instead of
       // creating 50-some substrings when 48 end up unused. 
       // For now, being naive:
       return line.split("\t")(index)
    }

    // now the report codes against the case class
    class SomeReport {
      def run(rdd: RDD[RequestLine]) = {
        rdd.filter { _.userId == "user1" }
      }
    }
{: class="brush:scala"}

This is better, as we've moved any notion of parsing out of `SomeReport`, and it just calls type-safe methods (`userId`, `timestamp`) on our `RequestLine`.

So, now our testing, we usually define a companion object for `RequestLine` to make constructing fake test lines super easy:

    object RequestLine {
      def apply(
        userId: String = "user1",
        timestamp: Long = 1L) = {
        new RequestLine(Seq(timestamp, userId).mkString("\t"))
      }
    }
{: class="brush:scala"}

Using method parameter default values, this allows the test case to only fill in the columns it cares about. When there are 50 columns, and your boundary case only covers 2, this is very handy. The test then looks like:

    class SomeReportTest {
      val sc = new SparkContext("local", "SomeReportTest")
      val report = new SomeReport(...)

      @Test
      def shouldFindUser1() {
        // given we saw user1 and user2 in the logs
        val input = Seq(
          RequestLine(userId = "user1"),
          RequestLine(userId = "user2"))

        // then only user1 is in the output
        val result = run(input)
        result.size shouldBe 1
      }

      private def run(fakeInput: Seq[RequestLine]):
          Seq[RequestLine] = {
        val input: RDD[RequestLine] = sc.parallelize(fakeInput)
        val result: RDD[RequestLine] = report.run(input)
        result.collect().toList.sorted
      }
    }
{: class="brush:scala"}

Since we have the `RequestLine` object already, we also go ahead and add factory methods for the real data:

    object RequestLine {
      def newRDD(
          sc: SparkContext,
          range: CalendarInterval): RDD[RequestLine] = {
        val paths = range.map { day =>
          "s3n://bucket/input/year=...,month=...,day=.../"
        }.mkString(",")
        sc.textFile(paths).map { RequestLine(_) }
      }
    }

    // now various ReportJob classes can reuse `newRDD`:
    class SomeReport {
      def main(args: Array[String]) {
        val sc = ...
        val range = // parse from args

        // load data from cluster/S3
        val rdda = RequestLine.newRDD(sc, range)

        // apply report logic
        val rddb = ...

        // now save the result
        rddb.saveAsTextFile("s3n://bucket/output/")
      }
    }
{: class="brush:scala"}

The `newRDD` method here is fairly trivial, but the encapsulation becomes nice as it becomes more sophisticated (e.g. we have a generic "repartition data loaded from S3" routine that our `newRDD` methods reuse to try to jockey our data into the right partition sizes).

So, the upshots of the Log Line pattern are:

1. Gives the report class type-safe getters (`.userId`) that hide the log format
2. Gives the report tests type-safe way of creating test data (`userId = ...`), with default values for what they don't care about
3. Moves the S3/cluster path location out of job classes, into a single `newRDD` method

We use this pattern for basically all of our log files now.

Type Aliases for Everything
---------------------------

A lot of times in Spark, you'll read in some raw log lines, and then throw away 90% of the columns, because you only care about one or two.

This is fine, and the initial way we did this was pretty simple:

    val input: RDD[RequestLine] = ...
    val idAndTime: RDD[(String, Long)] = input.map { line =>
      (line.userId, line.timestamp)
    }

    // later on call a helper method
    doSomeMoreWith(idAndTime)

    def doSomeMoreWith(idAndTime: RDD[(String, Long)] = {
      ... 
    }
{: class="brush:scala"}

The problem with this is, after passing around `idAndTime` as just a `RDD[(String, Long)]`, it can become really, really easy to forget what exactly that `String` is. Was it...user id? Client id? Browser id?

Readers may see where this is going; the underlying problem is [Primitive Obsession](http://c2.com/cgi/wiki?PrimitiveObsession), which is nothing new. We're using the type `String` when really we mean "User Id".

That said, in most systems I've worked on, primitive obsession has not historically been a big deal to me. Yes, there is usually a `Money` type, or a `Dollars` type, and probably a `CalendarDate`. But I don't usually go so far as to have `UserId` types, `Email` types, or `PhoneNumber` types, as usually the overhead of making the type outweighs the benefit.

With Spark reports, we've found the opposite is true; with Scala type aliases (which really easy to declare), and lots of `RDD[...]` type parameters floating around, using type aliases for basically everything is very handy.

So, our type alias might look like:

    // in the com/bizo/types/package.scala file
    package com.bizo {
      package object types {
        type UserId = String
        type Timestamp = Long
        type ClientId = String
      }
    }
{: class="brush:scala"}

Then we'll use these aliases in our report:

    val input: RDD[RequestLine] = ...
    val idAndTime: RDD[(UserId, Timestamp)] = input.map { line =>
      (line.userId, line.timestamp)
    }

    // later on call a helper method
    doSomeMoreWith(idAndTime)

    def doSomeMoreWith(idAndTime: RDD[(UserId, Timestamp)] = {
      ... 
    }
{: class="brush:scala"}

And, wow, look at how much more readable that `doSomeMoreWith` signature is. Applied across larger Spark reports, it has dramatically increased their readability.

My only (minor) complaint here is that Scala's type aliases are just symbolic, in that if both `UserId` and `ClientId` are really strings, you can pass in a `UserId` variable where the type signature is actually `ClientId` and the compiler will not complain. They probably have a good reason for this, but it actually surprised me--I would have assumed it would not be allowed.

Liberal use of `collect`
------------------------

One of my few criticisms of Spark is that it heavily relies on Scala's tuples whenever you change the "shape" of your data.

This is what we were doing in the previous example, by only keeping user id and timestamp:

    val input: RDD[RequestLine] = ...
    val idAndTime: RDD[(UserId, Timestamp)] = input.map { line =>
      (line.userId, line.timestamp)
    }
    // later on...
    idAndTime.filter { l => l._1 == "user1" }
{: class="brush:scala"}

When we select just the user id and timestamp, we use the Scala syntax of `(line.userId, line.timestamp)`. This is just syntax sugar for `new Tuple2(line.userId, line.timestamp)`. (If we were selecting three things, it would be a `Tuple3`.)

So, the type of our RDD is `RDD[(UserId, Timestamp)]`, which is again just syntax sugar for `RDD[Tuple2[UserId, Timestamp]]`.

Because the `Tuple2` class is generic, the methods for accessing the user id is not `l.userId`--it's `l._1`. And for timestamp, it's not `l.timestamp`--it's `l._2`.

So, if you look at our filter, this is obviously not very readable: `l._1 == "user"`.

What we usually try and do, and I think is a common Scala idiom, is use pattern matching to re-introduce meaningful variable names. So, instead of `filter`, we'd write:

    idAndTime.collect { 
      case (userId, _) => userId == "user1"
    }
{: class="brush:scala"}

This uses Scala's pattern matching to "match" against the `Tuple2` (it again uses the parens as syntax sugar), and introduces `userId` as a variable that is equivalent to `_1`. And since we aren't using `_2`, we just use `_` to mean "we don't care about this one".

This has actually served as pretty well, and we continue to use it.

Pedantically, it's not perfect--the `case (userId, _)` could say `case (foo, _)` and Scala would not care. Accessing `userId` (or `foo`) would still be type-safe (the type would be `UserId`), but the `userId` in the pattern match is just a variable name. If we were to rename type type to `Username` or something, nothing would force us to go back and change `userId` to `username` in our case statement.

In contrast, C# can actually handle this scenario by using [Anonymous Types](http://geekswithblogs.net/BlackRabbitCoder/archive/2012/06/21/c.net-little-wonders-the-joy-of-anonymous-types.aspx). It allows LINQ to do very similar things as `map`, but to introduce mini-classes along the way (from previous link):

    transactions
      .GroupBy(tx => new { tx.UserId, tx.At.Date })
      .OrderBy(grp => grp.Key.Date)
      .ThenBy(grp => grp.Key.UserId);
{: class="brush:java"}

You can use that, after doing the `new { tx.UserId, tx.At.Date }`, LINQ has "kept" the `Date` and `UserId` accessors for use later in the query.

Perhaps Scala macros will eventually do this (or perhaps already do?), but for now we have `collect`.









