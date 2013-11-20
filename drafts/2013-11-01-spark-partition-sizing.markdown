---
title: Spark Shuffles and Partition Sizing
layout: draft
---

{{page.title}}
==============

At [Bizo](http://www.bizo.com) we've been enjoying [Spark](http://spark.incubator.apache.org/) for writing map/reduce-style jobs in a nice, test-able Scala API.

Over the course of writing a few jobs, we've found that it can be really helpful to understand some of Spark's intrinsic operations, like shuffle, and how they will affect your job's performance.

Here I'll attempt to explain them in a hopefully straight forward manner.

Overview of Data in a Cluster
-----------------------------

Since your data is too big to store on one node, the primary feature of all map/reduce frameworks (Hadoop, Spark, etc.) is to:

1. Know where the data currently is (ideally already on some node in the cluster, but the Hadoop File System API can also pull data in from, say, Amazon S3), and

2. Take care of moving the data around for you automatically.

For example, if you're storing log files, the file for `traffic-2000-01-01.log` might be on node A, but `traffic-2000-01-02.log` is on node B.

Now say for a report, if you want to aggregate the data by user, you need to ask the map/reduce framework to take all the lines for, say, User 1 in `traffic-2000-01-01.log` and the lines for User 1 in `traffic-2000-01-02.log`, and somehow put them together so that your report logic can process them.

And, really, you don't even want to know about `traffic-2000-01-01.log` and `traffic-2000-01-02.log` as that's just bookkeeping that you shouldn't have to care about.

So, your report not having to care about all of this is what map/reduce frameworks handle: "where is the data now?" and "where does it need to go?"

Shuffles
--------

The process of moving data around, in Spark and most map/reduce frameworks, is called a shuffle.

This is somewhat confusing, as in everyday usage, "shuffle" means random placement (like shuffling a deck of cards). Random placement would obviously be less than ideal, as Spark wouldn't know/control where the data is at.

Instead, in Spark for other map/reduce frameworks, shuffling means moving data into a very specific place, typically for doing aggregation operations like joins.

Shuffle Example Intro
---------------------

Let's use a concrete example: grouping log lines to be per user. At Bizo, we store our logs in S3, so we'll assume that in our example. (Using S3 should not really effect the rest of the example, it just means we have an initial step copying the data from S3 into our Spark cluster.)

Our Spark code for this example might look like:

    val lines: RDD[String] =
      sc.textFile("s3n://bucket/traffic/year=2000/month=01/day=01/")
{: class=brush:scala}

Here we are saying "go out to S3 and load the lines of all the log files with this bucket and prefix."

This gives us an `RDD[String]`. I'll avoid a longer explanation, but you can basically think of an `RDD` as a really huge `List`.

You could imagine loading a log file that is, say, 5mb, directly into memory as a real `List[String]`. Just keep it in RAM and iterate as needed/etc.

But how big is this `RDD[String]`? It looks like a list, but how many files were in S3? 50mb? 50gb? 500gb? Spark needs to handle however much data is there without blowing up, as that's the point of map/reduce frameworks.

Partitions
----------

Spark, and again map/reduce frameworks in general, handles these huge datasets by breaking them up into small partitions that are more manageable.

Processing 500gb of data and fail 95% through? You don't want to have to start all the way over. If you've partitioned your data into, say, 64mb partitions (the Hadoop default), then you can redo just the small bits that have failed. Basically check pointing your process as it runs.

So, while `RDD[String]` looks like a list, only some small percentage (a partition) may be in memory at a time.

Spark will conveniently hide exactly how much partitions are involved from you, and which ones are currently in-memory/being processed; that is part of Spark's bookkeeping.

But it still convenient, and sometimes necessary, to at least know how this bookkeeping works at a high level, hence this post.

Example Partitions from S3
--------------------------

For our S3 example, the Spark/Hadoop default partitioning for gzipped files is one-partition-per-file. So if we had 4 log files in S3, we'd end up with 4 partitions, spread around the cluster. It might look like:

    slave1:
      traffic-2000-01-01.log:
        user1 /foo.html 8:00am
        user2 /bar.html 8:10am
      traffic-2000-01-03.log:
        user1 /zaz.html 8:30am

    slave2: 
      traffic-2000-01-02.log:
        user1 /foo.html 5:00pm

    slave3:
      traffic-2000-01-04.log:
        user2 /foo.html 2:00pm
        user1 /bar.html 2:10pm
        user2 /foo.html 2:20pm
{: class=brush:plain}

So, obviously this is a small/contrived example, but the idea is that each slave has gotten some number of log files, each one as it's own partition, and each partition has some number of lines in it.

(If our files were really large, and not gzipped, Spark/Hadoop would also automatically split single files up into multiple partitions, but for our example, we'll assume the files are all relatively small.)

Aggregate by User
-----------------

Now for our report, let's aggregate by user to do something simple, like count page views.

Whenever Spark, or map/reduce frameworks in general, do aggregations (like joins or group bys), they are always based on a key. The key is essential because it tells Spark where to move the data.

In this case, the key will be the user id. Any lines with the same key (user id), Spark will move together onto the same machine, so that we can process all of a given user's lines serially at once.

(If Spark did not do this, our program would be much more complex, because we'd have to handle: okay line 1 is user A, store their state, line 2 is user B, store their state, line 3 is user A again, go find/update their state. And we're doing this in parallel on 20 machines. Exactly the sort of bookkeeping nightmare we're trying to avoid.)

So, Spark will give us the raw log line, but then we have to make sense of it (parse it), and then tell Spark we want to group by the user id as the key.

This might look like:

    val lines: RDD[String] = // from before
    val linesByUser: RDD[(String, Seq[Line])] = users
      .map { line => parseIntoUserClass(line) }
      .map { line => (line.userId, line)
      .groupByKey()
{: class=brush:scala}

Spark uses the Scala `Tuple2` class to denote the key/payload portion of aggregation. A `Tuple2` is basically like the ubiquitous `Pair` class; it just was two values, `_1` and `_2` (being Scala, the names have underscores of course). `Tuple2` is generic, `Tuple2[T1, T2]`, so `_1` and `_2` can be whatever types you want them to be.

Spark will use `Tuple2._1` as the key, and just treat `_2` as the payload that is moved around for us to later us in our report. In this case, we're using the whole line itself as the payload, but ideally you would pare down the payload to just the data you needed.

Count Page Views
----------------

Now that we have the aggregation by user, we can count each user's lines:

    val linesByUser: RDD[(String, Seq[Line])] = // from before
    linesByUser.collect {
      case (userId, lines) => (userId, lines.count)
    }.saveAsTextFile("s3n://bucket/report-output")
{: class=brush:scala}

Minus some hand waving about the Scala syntax, `RDD.collect` applies our function to each line of the `RDD`, which conveniently is now a user + all of their lines as a `Seq` (a list).

So, Spark has fulfilled it's job of moving the data for each user all together and handing it over to our report 







When Spark first loads our data, we have all of the log data available. In our simple case, 3 fields (user, page, and time). Let's say we only want user and page, so we might do something like:

    val nameAndPages = users.map { logLine =>
      val parts = someHowParseLine(logLine)
      (parts(0), parts(1))
    }
{: class=brush:scala}

Spark is basically letting us apply a function (the closure) to each line, as if we were working against a collection in-memory.

Conceptually, we can now this of our data as:

    machine1:
      file1.log:
        (user1, /foo.html)
        (user2, /bar.html)
      file2.log:
        (user1, /zaz.html)

    machine2: 
      file4.log:
        (user1, /foo.html)

    machine3:
      file3.log:
        (user2, /foo.html)
        (user1, /bar.html)
        (user2, /foo.html)
{: class=brush:plain}

Note that the data hasn't actually been moved across machines, because the operation doesn't require that, we can just modify it in place.

(Conceptually; Spark won't actually modify the data in place nor run the operation at this point, but we'll get to that.)

Let's do a Shuffle
------------------

So, we have data in our cluster, and we've done a simple map on it, now let's shuffle.

Right now the lines for each user are spread randomly across the shuffle. Let's say we want to count page views per user, so we want to be able to put all of the pages for one user together.

In spark, this might look like:

    val byUser =
      nameAndPages.groupBy { _._1 } // _1 == the user
{: class=brush:scala}



