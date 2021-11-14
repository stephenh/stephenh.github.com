---
date: "2014-02-12T00:00:00Z"
section: Scala
title: Spark Report Patterns
---


At [Bizo](http://www.bizo.com), we've been writing a lot of [Spark](https://spark.incubator.apache.org/) jobs lately.

We are big fans of Spark, as it's basically a faster, testable, type-safe alternative to Hive.

Over the course of writing many jobs, we've established a few patterns that have been working well.

Separate Job vs. Report Classes
-------------------------------

Unit testing our reports is a big reason we like Spark, and being able to unit test Spark logic relies on feeding your logic "fake" RDDs, instead of real "tons of real data from the cluster" RDDs.

So, while a naive Spark report might look like:

```scala
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
```

The code above is actually reminiscent of Hive code: some S3/HDFS URLs with input, interspersed with some logic, followed up by more S3/HDFS URLs for output.

It is short and sweet, but extremely untestable.

Spark allows you to create "fake" RDDs quite easily, and so what we'd really like to do is divorce the notion of "where the data in an RDD exists" from "what logic we apply to the RDD".

So, we settled onto having a "Job" class, which handles loading/saving RDDs, and a "Report" class, which is just the logic:

```scala
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
```

The upshot is that `SomeReport` now only takes and returns RDDs, without any cluster/S3 coupling.

This allows us to write a unit test:

```scala
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
```

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

```scala
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
```

This is better, as we've moved any notion of parsing out of `SomeReport`, and it just calls type-safe methods (`userId`, `timestamp`) on our `RequestLine`.

So, now our testing, we usually define a companion object for `RequestLine` to make constructing fake test lines super easy:

```scala
object RequestLine {
  def apply(
    userId: String = "user1",
    timestamp: Long = 1L) = {
    new RequestLine(Seq(timestamp, userId).mkString("\t"))
  }
}
```

Using method parameter default values, this allows the test case to only fill in the columns it cares about. When there are 50 columns, and your boundary case only covers 2, this is very handy. The test then looks like:

```scala
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
```

Since we have the `RequestLine` object already, we also go ahead and add factory methods for the real data:

```scala
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
```

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

```scala
val input: RDD[RequestLine] = ...
val idAndTime: RDD[(String, Long)] = input.map { line =>
  (line.userId, line.timestamp)
}

// later on call a helper method
doSomeMoreWith(idAndTime)

def doSomeMoreWith(idAndTime: RDD[(String, Long)] = {
  ... 
}
```

The problem with this is, after passing around `idAndTime` as just a `RDD[(String, Long)]`, it can become really, really easy to forget what exactly that `String` is. Was it...user id? Client id? Browser id?

Readers may see where this is going; the underlying problem is [Primitive Obsession](http://c2.com/cgi/wiki?PrimitiveObsession), which is nothing new. We're using the type `String` when really we mean "User Id".

That said, in most systems I've worked on, primitive obsession has not historically been a big deal to me. Yes, there is usually a `Money` type, or a `Dollars` type, and probably a `CalendarDate`. But I don't usually go so far as to have `UserId` types, `Email` types, or `PhoneNumber` types, as usually the overhead of making the type outweighs the benefit.

With Spark reports, we've found the opposite is true; with Scala type aliases (which really easy to declare), and lots of `RDD[...]` type parameters floating around, using type aliases for basically everything is very handy.

So, our type alias might look like:

```scala
// in the com/bizo/types/package.scala file
package com.bizo {
  package object types {
    type UserId = String
    type Timestamp = Long
    type ClientId = String
  }
}
```

Then we'll use these aliases in our report:

```scala
val input: RDD[RequestLine] = ...
val idAndTime: RDD[(UserId, Timestamp)] = input.map { line =>
  (line.userId, line.timestamp)
}

// later on call a helper method
doSomeMoreWith(idAndTime)

def doSomeMoreWith(idAndTime: RDD[(UserId, Timestamp)] = {
  ... 
}
```

And, wow, look at how much more readable that `doSomeMoreWith` signature is. Applied across larger Spark reports, it has dramatically increased their readability.

My only (minor) complaint here is that Scala's type aliases are just symbolic, in that if both `UserId` and `ClientId` are really strings, you can pass in a `UserId` variable where the type signature is actually `ClientId` and the compiler will not complain. They probably have a good reason for this, but it actually surprised me--I would have assumed it would not be allowed.

**Update 2/15/2014:** Josh Carver, another Bizo dev, pointed at using [this type tag approach](https://gist.github.com/jcarver989/2fbb1ee926f57373aac5) as a more type-safe way of doing aliases. We are probably going to try it out and see how it goes.

Liberal use of `collect`
------------------------

One of my few criticisms of Spark is that it (understandably) heavily relies on Scala's tuples whenever you change the "shape" of your data.

This is what we were doing in the previous example, by only keeping user id and timestamp:

```scala
val input: RDD[RequestLine] = ...
val idAndTime: RDD[(UserId, Timestamp)] = input.map { line =>
  (line.userId, line.timestamp)
}
// later on...
idAndTime.filter { l => l._1 == "user1" }
```

When we select just the user id and timestamp, we use the Scala syntax of `(line.userId, line.timestamp)`. This is just syntax sugar for `new Tuple2(line.userId, line.timestamp)`. (If we were selecting three things, it would be a `Tuple3`.)

So, the type of our RDD is `RDD[(UserId, Timestamp)]`, which is again just syntax sugar for `RDD[Tuple2[UserId, Timestamp]]`.

Because the `Tuple2` class is generic, the methods for accessing the user id is not `l.userId`--it's `l._1`. And for timestamp, it's not `l.timestamp`--it's `l._2`.

So, if you look at our filter, this is obviously not very readable: `l._1 == "user"`.

What we usually try and do, and I think is a common Scala idiom, is use pattern matching to re-introduce meaningful variable names. So, instead of `filter`, we'd write:

```scala
idAndTime.collect { 
  case (userId, _) => userId == "user1"
}
```

This uses Scala's pattern matching to "match" against the `Tuple2` (it again uses the parens as syntax sugar), and introduces `userId` as a variable that is equivalent to `_1`. And since we aren't using `_2`, we just use `_` to mean "we don't care about this one".

This has actually served as pretty well, and we continue to use it. We also use it a lot for joins:

```scala
logFooByUserId.cogroup(logBarByUserId).collect { 
  case (userId, (foos, bars)) => ...
}
```

Technically, this "use `collect`" idiom is not perfect--it is more verbose as we have to re-introduce `userId`, etc. as more variables.

C# actually handles this scenario better than Scala by using [Anonymous Types](http://geekswithblogs.net/BlackRabbitCoder/archive/2012/06/21/c.net-little-wonders-the-joy-of-anonymous-types.aspx). It allows LINQ to do very similar things as `map`, but to introduce mini-classes along the way (from previous link):

```java
transactions
  .GroupBy(tx => new { tx.UserId, tx.At.Date })
  .OrderBy(grp => grp.Key.Date)
  .ThenBy(grp => grp.Key.UserId);
```

This means that, after the `new { tx.UserId, tx.At.Date }` line, LINQ has "kept" the `Date` and `UserId` accessors for use later in the query.

You could do kind of the same thing in Scala, but you'd have to write a new case class for each intermediate "shape", which is basically what LINQ is doing automatically.

Perhaps Scala macros will eventually do this (or perhaps already do?), but for now we have `collect`. And it's really not too bad.

For Comprehensions for Filtering Logs
-------------------------------------

Another construct we use quite a bit, although more an idiom than a pattern, is Scala's for compressions for applying multiple filters to log files. For example:

```scala
val lines: RDD[RequestLine] = ...

val views: RDD[(UserId, ClientId, Domain, Timestamp)] = for {
  line <- lines
  clientId <- line.clientId if activeClientIds.contains(clientId)
  domain <- parseDomain(line.url)
  userId <- line.userId
  timestamp <- line.timestamp
} yield (userId, clientId, domain, timestamp)

// this assumes a slightly different RequestLine:
case class RequestLine(...)
  def clientId: Option[ClientId] = ...
  def userId: Option[UserId] = ...
  def timestamp: Option[Timestamp] = ...
  def url: Option[Url] = ...
}

// returns None if can't be parsed
def parseDomain(url: Url): Option[Domain] = ...
```

The change to `RequestLine` to return `Options` is mainly because that, for some of our logs, some columns are optional. However, hopefully very rarely, a log may be corrupted (perhaps due to application logic) and we just don't have a usable value for a certain column.

Spark will blow up the whole job if one row fails (repeatedly due to report logic, not just a transient I/O error), so having `RequestLine` return `Options` with the for comprehension is our way of having the rest of the Spark job continue on if we have a few lines that happen to be invalid.

And besides handling invalid lines, it also gives a nice way to skip lines for other reasons, e.g. inactive clients/other report business logic conditions.

Just to highlight the nifty Scala feature here, we're using a `for { ... }` and `yield (...)`, but the return value of the for expression is not a built-in Scala type (like `Seq`), but Spark's own `RDD` type.

Which means that this for expression is captured as `map`/`filter` invocations, just like any other `RDD` operation, and will be shipped off around the cluster to evaluate against incoming data.

Up-Front Dynamic Coalescing
---------------------------

One of our long-standing pain points with Spark (currently/pre-1.0) is that picking the right partition size is critical for job performance.

(Brief background: partitions are where if you have 100gb of data "in" an RDD, Spark will break it up into tiny, say, 50-100mb partitions, and process each partition individually. This allows the work to be distributed and to recover more easily from errors.)

If any partition ends up being too big, your job will throw `OutOfMemoryError`s during shuffles (technically this is/has already changed in Spark master, but we haven't tried it out). But if your partitions are too small, the per-partition/per-task overhead can make your job take dramatically longer.

As a side note, I think we are more sensitive to this than most Spark users, as our data *always* comes from S3, which has no real notion of partitions--it's just flat files. Most Spark users, who load likely data from HDFS, will get partition sizes that "just work", since HDFS was built specifically for map/reduce and storing large files in small-ish chunks (splits).

So, anyway, since we use S3, we have to provide our own partitioning hints.

The Spark API does have `coalesce` and `repartition` methods, but, unfortunately (currently/pre-1.0), they only take a desired number of partitions.

But what we really want to shoot for is not number of partitions, by size of partitions.

And ideally the repartitioning should "just happen" for the programmer, without them having to worry "am I loading 1 week of data? 1 months? 6 months?". Each of these would have a drastically different number of partitions.

To handle this, we've built dynamic-coalescing into our shared `newRDD` logic.

The basic idea is to:

1. Look at the file metadata in S3 to come up with total incoming size
2. Divide incoming size by our "goal partition size" (currently 128mb)
3. Use the result to coalesce the RDD.

The routine looks like:

```scala
/** Partitions `rdd` based on the total size of `paths`. */
def partitionRDD[T](
    rdd: RDD[T],
    sourceData: Seq[FilePath]): RDD[T] = {
  val number = sourceData.map { _.size }.sum / goalSize
  rdd.coalesce(number.toInt)
}
```

Note that, technically, we're using `coalesce` instead of the new `repartition` method.

This is because, for us, our incoming S3 files are almost always smaller than the goal size (by default the HDFS S3 backend will not group multiple S3 keys into one split), so we want to reduce the number of partitions. `coalesce` can do this without a shuffle, which is nice to avoid if we can.

After fiddling with some settings (our goal size, using the Snappy compression codec, and setting the shuffle buffer to 10k), this auto-coalesce logic has handled basically any logs/date range we've thrown at it for the past few months.

Eventually, it would be nice if Spark just did this for us, both at the start of a job, and even during each shuffle. I'll wand wave on the implementation details, but "something something sampling the current size of the partitions vs. the ideal size something" would be awesome.

Defining `+` in Case Classes For Reducing
-----------------------------------------

We frequently need to reduce the values of an RDD, either to `reduceByKey` to combine values for the same key, or just `reduce` to get a result across the whole RDD.

If you have an RDD of key and just a tuple of stats, this can get pretty tedious:

```scala
val rdda: RDD[(UserId, (Clicks, Imps, Convs))] = ...
val rddb = rdda.reduceByKey { (v1, v2) => 
  (v1._1 + v2._1, v1._2 + v2._2, v1._3 + v2._3)
}
```

With all the `v1`, `v2`, `_1`, `_2`, etc., I made about 10 typos just typing that example for this post. Not pretty in a real job.

What we like to do here is wrap the stats into a case class that defines an `+` operation:

```scala
case class Stats(clicks: Long, imps: Long, convs: Long) {
  def +(other: Stats): Stats = {
    Stats(
      clicks + other.clicks,
      imps + other.imps,
      convs + other.convs)
  }
}

// now reduce is easy
val rdda: RDD[(UserId, Stats)] = ...
val rddb = rdda.reduceByKey { _ + _ }
```

This moves the combination logic out into a specific method, and really makes the job read nicer.

Granted, it is still somewhat tedious to define the `+` method by hand. But we usually don't have very many stats, so it hasn't been painful enough to look into alternatives (e.g. having macros/Algebird/etc. define `+` automatically). 

Using Spark Plug for Launching EMR Clusters
-------------------------------------------

At Bizo, none of our Spark clusters are persistent; instead we use Amazon EMR to spin up a new cluster for each report, run the report, save the result to S3, and shut the cluster down.

For us, this has worked out very well. We really enjoy not having the headache of administering a long-running cluster, and dealing with growing/reducing/sharing it among our jobs. That's what EMR is for.

However, this does result in launching a lot of clusters. To help with that, Larry on Bizo's infrastructure team built [spark-plug](https://github.com/ogrodnek/spark-plug), a Scala DSL for launching EMR clusters (ironically, the name "spark-plug" is completely coincidental, as spark-plug was originally built to launch our Hive EMR clusters).

To use spark-plug, you create a "plug" that will launch your EMR cluster, e.g.:

```scala
object SomePlug extends AbstractPlug {
  // args can be passed in from cron jobs/CLI
  def today = CalendarDate.from(args(0), "yyyyMMdd")

  // the name of the 'job' class to run on the spark master
  override def job = "SomeJob"
  override def jobArgs = Seq(today.toString)
  override def numberOfMachines = 20

  // these end up being EMR job steps
  override def steps = {
    val checkpath = new CheckS3Path(RequestLine.checkPath(today))
    val jobStep = RunSparkJob("com.bizo." + job, jobArgs)
    val otherSteps = Seq(...)
    Seq(checkpath, jobStep) ++ otherSteps
  }
}
```

A few notes about this:

* We use a `CheckS3Path` step to ensure the log files we're reading in actually exist
* By extending our (internal) `AbstractPlug` class, we can some Spark-related bootstrap actions for free (that take care of installing Spark with our `spark-env.sh` settings, downloading our job's JAR onto each node, then starting the master and slaves)
* The `RunSparkJob` step is what will, on the master, instantiate the `SomeJob` class from before, and kick off the loading/saving of our report RDDs

Technically some of the steps here (`RunSparkJob`, `CheckS3Path`) are in our internal `spark-plug-bizo-ext` repository, but `spark-plug` itself is open source and has been really great to use.

Conclusion
----------

We have enjoyed settling into Spark and developing some patterns around how we structure our reports.

The very high levels of test coverage we're able to get are especially nice. Honestly, for all of Spark's reputation and marketing about being "lightning fast", "in-memory based", etc., for me, all of that pales in comparison to actually being able to put our non-trivial reporting code under test.

We also have a few more patterns floating around, but they aren't quite nailed down yet, at least in my head, so I'll save those for a future post. 


