---
layout: draft
title: What Makes Spark Exciting
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com), we're currently evaluating/prototyping [Spark](http://www.spark-project.org) as a replacement for Hive for our batch reports.

Why Replace Hive?
-----------------

Admittedly, Hive has served us well for quite awhile now.

Like many startups these days, we have a non-trivial amount of reports that process a non-trivial data on a regular basis. Without Hive, we would have been hard pressed to provide the same functionality in the same time frame.

That said, it has gotten to the point where Hive is more frequently invoked in negative contexts ("damn it, Hive") than positive.

Personally, I had even gotten to the point of trying to avoid tasks that involved working with Hive. I found it to be frustrating and, well, just not a lot of fun. Why? Two primary reasons:

#### 1. Hive is hard to test

Bizo has a culture of excellence, and for engineering one of the things this means is testing. We really like tests. Especially unit tests, which are quick to run and enable a fast TDD cycle.

Unfortunately, Hive makes unit testing basically impossible. For several reasons:

* Hive scripts must be run in a local Hadoop/Hive installation.

  Ironically, very few developers at Bizo have local Hadoop installations. We are admittedly spoiled by Amazon's [Elastic Map Reduce](http://aws.amazon.com/elasticmapreduce/), such that most of us (myself anyway) wouldn't even know how to setup Hadoop off the top of our heads. We just fire up an EMR cluster.

* Hive scripts have production locations embedded in them.

  Both our log files and report output are stored in S3, so our Hive scripts end up with lots of "s3://" paths scattered throughout in them. (We do run dev versions of reports with "-dev" S3 buckets, but still relying on S3, and raw log files (that are usually in a compressed/binary-ish format), is not condusive to setting up lots of really small, simplified scenarios to unit test each boundary case.)

* Hive scripts do not provide abstraction--they are just one big HiveQL file. This means its hard to break up a large report into small, individually testable steps.

Despite these limitations, about a year ago we had a developer dedicate some effort to prototyping an approach that would run Hive scripts within our CI workflow. In the end, while his prototype worked, the workflow was wonky enough that we never adopted it for production projects.

The result? Our Hive reports are basically untested. This sucks.

#### 2. Hive is hard to extend

Extending Hive via custom functions (UDFs and UDAFs) is possible, and we do it all the time--but it's a pain in the ass.

Perhaps this is not Hive's fault, and it's some Hadoop internals leaking into Hive, but the various [ObjectInspector](http://hive.apache.org/docs/r0.5.0/api/org/apache/hadoop/hive/serde2/objectinspector/ObjectInspector.html) hoops, to me, always seemed annoying to deal with.

Given these shortcomings, Bizo has been looking for a Hive-successor for awhile, even going so far as to prototype a [revolute](https://github.com/aboisvert/revolute), a Scala DSL on top of [Cascading](http://www.cascading.org/), but had not yet found something we were really excited about.

Enter Spark!
------------

[Spark](http://www.spark-project.org) is an alternative to Hadoop/Hive in that it provides a cluster computing framework to run jobs in. We had heard of it, but were so impressed by the Spark presentation at AWS re:Invent (the talk receieved [the highest rating of all non-keynote sessions](https://amplab.cs.berkeley.edu/news/sparkshark-a-big-hit-at-aws-reinvent/)) that we wanted to learn more.

One of Spark's strengths is that it prides itself on being able to load and keep data in memory, so your queries aren't always I/O bound.

That is great, but the exciting aspect for us at Bizo is how Spark addresses both of Hive's primary shortcomings, and turns them into huge strengths. Specifically:

#### 1. Spark is amazingly easy to test

Writing a test in Spark is as easy as:

    class SparkSpikeTest {
      @Test
      def test() {
        // this is real code...
        val sc = new SparkContext("local", "MyUnitTest')
        // and now some psuedo code...
        val output = runYourCodeThatUsesSpark(sc)
        assertAgainst(output)
      }
    }
{: class=brush:scala}

(I will go into more detail about `runYourCodeThatUsesSpark` in a future post.)

This one liner starts up a new [SparkContext](http://spark-project.org/docs/latest/api/core/index.html#spark.SparkContext), which is all your program needs to execute Spark jobs. There is no local installation required (just have the Spark jar on your classpath, e.g. via Maven or Ivy), no local server to start/stop. It just works.

As a technical aside, this "local" mode starts up an in-process Spark instance, backed by a thread-pool, and actually opens up a few ports and temp directories, because it's a real, live Spark instance.

Granted, this is usually more work than you want to be done in an unit test (which ideally would not hit any file or network I/O), but the redeeming quality is that it's *fast*. Tests run in ~2 seconds.

Okay, yes, this is slow compared to pure, traditional unit tests, but is such a huge revolution compared to Hive that we'll gladly take it (2 seconds is infinitely faster than 0).

#### 2. Spark is easy to extend

Spark's primary API is a Scala DSL, oriented around what they call an [`RDD`](http://www.spark-project.org/docs/0.6.0/api/core/#spark.RDD), or Resilient Distributed Dataset, which is basically a collection that only supports bulk/aggregate transforms (so methods like `map`, `filter`, and `groupBy`, which can be seen as transforming the entire collection, but no methods like `get` or `take` which assume in-memory/random access).

Some really short, made up example code is:

    // RDD[String] is like a collection of lines
    val in: RDD[String] = sc.textFile("s3://bucket/path/")
    // perform some operation on each line
    val withSuffix = in.map { line => line + "some suffix" }
    // now save the new lines back out
    withSuffix.saveAsTextFile("s3://bucket/path2")
{: class=brush:scala}

Spark's job is to package up your `map` closure, and run it against that extra large text file across your cluster. And it does so by, after shuffling the code and data around, *actually calling your closure* (i.e. there is no [LINQ](http://msdn.microsoft.com/en-us/library/vstudio/bb397926.aspx)-like introspection of the closure's AST).

This may seem minor, but it's huge, because it means there is no framework code or APIs standing between your running closure and any custom functions you'd want to run. Let's say you want to use `SomeUtilityClass` (or the venerable [`StringUtils`](http://commons.apache.org/lang/api-2.5/org/apache/commons/lang/StringUtils.html)), just do:

    import com.company.SomeUtilityClass
    val in: RDD[String] = sc.textFile("s3://bucket/path/")
    val withSuffix = in.map { line =>
      // just call it, it's a normal method call
      SomeUtilityClass.process(line) 
    }
    withSuffix.saveAsTextFile("s3://bucket/path2")
{: class=brush:scala}

Notice how `SomeUtilityClass` doesn't have to know it's running within a Spark RDD in the cluster. It just takes a String. Done.

Similarly, Spark doesn't need to know anything about the code you use witin the closure, it just needs to be available on the classpath of each machine in the cluster (which is easy to do as part of your cluster/job setup, you just copy some jars around).

This seamless hop between the RDD and custom Java/Scala code is very nice, and means your Spark jobs end up reading just like regular, normal Scala code (which to us is a good thing!).

Is Spark Perfect?
-----------------

As full disclosure, we're still in the early stages of testing Spark, so we can't yet say whether Spark will be a wholesale replacement for Hive within Bizo. We haven't gotten to any serious performance comparisons or written large, complex reports to see if Spark can take whatever we throw at it.

Personally, I am also admittedly somewhat infutuated with Spark at this point, so that could be clouding my judgement about the pros/cons and the tradeoffs with Hive.

One Spark con so far is that Spark is pre-1.0, and it can show. I've seen some stack traces that shouldn't happen, and some usability warts, that hopefully will be cleared up by 1.0. (That said, even as a newbie I find the codebase small and very easy to read, such that I've had several small pull requests accepted already--which is some consolation compared to the duanting codebases of Hadoop and Hive.)

We have also seen that, for our first Spark job, moving from "Spark job written" to "Spark job running in production" is taking longer than expected. But given that Spark is a new tool to us, we expect this to be a one-time cost.

More to Come
------------

I have a few more posts coming up which explain our approach to Spark in more detail, for example:

* Testing best practices
* Running Spark in EMR
* Accessing partitioned S3 logs

To see those when they come out, make sure to subscribe to the blog, or, better yet, [come work at Bizo](http://bizo.theresumator.com/) and help us out!


