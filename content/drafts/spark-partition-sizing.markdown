---
title: Spark Shuffles and Partition Sizing
layout: draft
---

At [Bizo](http://www.bizo.com) we've been enjoying [Spark](http://spark.incubator.apache.org/) for writing map/reduce-style jobs in a nice, test-able Scala API.

Over the course of writing a few jobs, we've found that it can be really helpful to understand some of Spark's intrinsic operations, like shuffle, and how they will affect your job's performance.

Here I'll attempt to explain them in a hopefully straight forward manner.

Overview of Data in a Cluster
-----------------------------

Since your data is too big to store on one node, the primary feature of all map/reduce frameworks (Hadoop, Spark, etc.) is to:

1. Know where the data currently is, and

   (Ideally your data is already on some node in the cluster, as then we can "ship the computation to the data", but the Hadoop File System API can also pull data in from, say, Amazon S3.)

2. Move the data around for you automatically.

For example, if you're storing log files, you might have:

* `traffic-2000-01-01-part1.log` lives on `machineA`, but
* `traffic-2000-01-01-part2.log` lives on `machineB`.

Now for a report, if you want to aggregate the data by user, you need to ask the map/reduce framework to take all the lines for, say, User 1 in `traffic-2000-01-01-part1.log` and the lines for User 1 in `traffic-2000-01-01-part2.log`, and somehow put them together so that your report logic can process them.

And, really, you don't even want to know about `traffic-2000-01-01-part1.log` and `traffic-2000-01-01-part2.log` as that's just bookkeeping that you shouldn't have to care about.

So, your report not having to care about all of this is what map/reduce frameworks handle:

1. "Where is the data now?" and,
2. "Where does it need to go?"

Moving Data: Shuffles
---------------------

The process of moving data around, in Spark (and AFAIK most map/reduce frameworks), is called a shuffle.

This is somewhat confusing, as in everyday usage, "shuffle" means random placement (like shuffling a deck of cards). Random placement would obviously be less than ideal, as Spark wouldn't know/control where the data is at, and User 1's data may end up on many different nodes.

Instead, in Spark for other map/reduce frameworks, shuffling means moving data into a very specific place, typically for doing aggregation operations like joins.

Shuffle Example Intro
---------------------

Let's use a concrete example: grouping log lines to be per user. At Bizo, we store our logs in S3, so we'll assume that in our example. (Using S3 should not really effect the rest of the example, it just means we have an initial step copying the data from S3 into our Spark cluster.)

Our Spark code for this example might look like:

    val lines: RDD[String] =
      sc.textFile("s3n://bucket/traffic/year=2000/month=01/day=01/")
{: class="brush:scala"}

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
        user3 /bar.html 5:05pm

    slave3:
      traffic-2000-01-04.log:
        user2 /foo.html 2:00pm
        user1 /bar.html 2:10pm
        user2 /foo.html 2:20pm
{: class="brush:plain"}

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
{: class="brush:scala"}

Spark uses the Scala `Tuple2` class to denote the key/payload portion of aggregation. A `Tuple2` is basically like the ubiquitous `Pair` class; it just was two values, `_1` and `_2` (being Scala, the names have underscores of course). `Tuple2` is generic, `Tuple2[T1, T2]`, so `_1` and `_2` can be whatever types you want them to be.

Spark will use `Tuple2._1` as the key, and just treat `_2` as the payload that is moved around for us to later us in our report. In this case, we're using the whole line itself as the payload, but ideally you would pare down the payload to just the data you needed.

Count Page Views
----------------

Now that we have the aggregation by user, we can count each user's lines:

    val linesByUser: RDD[(String, Seq[Line])] = // from before
    linesByUser.collect {
      case (userId, lines) => (userId, lines.count)
    }.saveAsTextFile("s3n://bucket/report-output")
{: class="brush:scala"}

Minus some hand waving about the Scala syntax, `RDD.collect` applies our function to each line of the `RDD`, which conveniently is now a user + all of their lines as a `Seq` (a list).

So, Spark has fulfilled it's job of moving the data for each user all together and handing it over to our report. We can apply our logic and then dump the result to S3. Easy!

What about Shuffling?
---------------------

So, after a somewhat longer than expected tangent about the high-level semantics/mental model of Spark, let's try and flush out a mental model for shuffling.

If you'll recall from before, our logs came into the cluster like so (now annotated with partition 1-4, assuming a partition-per-file):

    slave1:
      traffic-2000-01-01.log: (partition 1)
        user1 /foo.html 8:00am
        user2 /bar.html 8:10am
      traffic-2000-01-03.log: (partition 2)
        user1 /zaz.html 8:30am

    slave2: 
      traffic-2000-01-02.log: (partition 3)
        user1 /foo.html 5:00pm
        user3 /bar.html 5:05pm

    slave3:
      traffic-2000-01-04.log: (partition 4)
        user2 /foo.html 2:00pm
        user1 /bar.html 2:10pm
        user2 /foo.html 2:20pm
{: class="brush:plain"}

And we know Spark gets all of the `user1` lines together, `user2` lines together, etc. But how?

Let's think about Spark's units of work: partitions.

Previously, our data was basically randomly loaded into 4 partitions (whatever file it happened to be in).

Instead, we want it reorganized by user, so we want new partitions. The default Spark behavior is to use the same number of partitions for a new `RDD` as the previous `RDD`, so we'll have 4 new partitions, that may look something like this:

     RDD1 (random/from logs)     RDD2 (partitioned by user)

    partition 1                 partition 1
      user1 /foo.html             user2 /bar.html
      user2 /bar.html             user2 /foo.html
    partition 2                   user2 /foo.html
      user1 /zaz.html             user3 /bar.html
    partition 3          -->    partition 2
      user1 /foo.html           partition 3
      user3 /bar.html             user1 /foo.html
    partition 4                   user1 /foo.html
      user2 /foo.html             user1 /zaz.html
      user1 /bar.html             user1 /bar.html
      user2 /foo.html           partition 4
{: class="brush:plain"}

A few things to note:

1. Spark, by default, picks which new partition a line goes in by hashing it's key; so, in this instead `user2`'s id hashed to partition 1, `user1`'s key hashed to partition 3, etc.
2. This results in the data for any given user now being all within a single partition.
3. Partitions will have data for more than just 1 key, e.g. both `user2` and `user3` hashed to partition 1.
4. In our trivial example, a few partitions ended up with no data, but this is unlikely in real jobs with large data sets.

I can only draw one ASCII `-->`, but in typical Spark diagrams, there are lots of arrows between each partition, making the name "shuffle" more fitting.

One could imagine pseudo-code for this operation as something like:

    val newPartitions = new Array[List[Line]](4)
    for (oldPartition <- oldPartitions) {
      for (line <- oldPartition) {
        int newPartition = line._1.hashCode % 4
        newPartitions(newPartition) += line
      }
    }
    // each bucket of the newPartitions array now
    // has that new partition's log lines
{: class="brush:scala"}

This pseudo-code of course assumes every fits in memory, while Spark has to take a more nuanced approach.

Shuffling via Blocks
--------------------

The previous pseudo-code described how Spark could do a shuffle with just arrays and lists in memory. Obviously for real jobs, the entire `RDD` of data could not all be kept in RAM,

Instead, Spark's shuffle implementation buffers data to disk, in blocks. During a shuffle, Spark will save data from the old partitions to blocks, and then later transfer/read these blocks into the new partitions.

The blocks that would be involved, written by `RDD1` and read by `RDD2`, would look like:

     RDD1 (random/from logs)     RDD2 (partitioned by user)

    partition 1 (slave1)        partition 1 (slave3)
      write block_1_to_1          read block_1_to_1
      write block_1_to_2          read block_2_to_1
      write block_1_to_3          read block_3_to_1
      write block_1_to_4          read block_4_to_1
    partition 2 (slave1)        partition 2 (slave2)
      write block_2_to_1          read block_1_to_2
      write block_2_to_2          read block_2_to_2
      write block_2_to_3          read block_3_to_2
      write block_2_to_4          read block_4_to_2
    partition 3 (slave2)  -->   partition 3 (slave2)
      write block_3_to_1          read block_1_to_3
      write block_3_to_2          read block_2_to_3
      write block_3_to_3          read block_3_to_3
      write block_3_to_4          read block_4_to_3
    partition 4 (slave3)        partition 4 (slave1)
      write block_4_to_1          read block_1_to_4
      write block_4_to_2          read block_2_to_4
      write block_4_to_3          read block_3_to_4
      write block_4_to_4          read block_4_to_4
{: class="brush:plain"}

As you can see, after buffering the data to/from blocks, the net effect will be a shuffle, and the data is now moved to its new partition (based on its key).

Thinking about this from a pseudo code approach, it is also pretty straight forward. Spark will first have the mappers run, which vaguely do:

    // map-side, on each slave, store everything into blocks
    for (oldPartition <- oldPartitionsOnThisSlave) {
      for (line <- oldPartition) {
        int newPartitionId = line._1.hashCode % 4
        val blockId = "block_" + currentShuffleId + 
          "_from_ " + oldPartition.id +
          "_to_" + newPartitionId
        // stores data for this block locally
        getBlock(blockId) += line
      }
    }
{: class="brush:scala"}

And then once they are complete, Spark will have the reducers run to now pull this data back in:

    // reduce-side, on each slave, read everything into new partitions
    for (newPartition <- newPartitionsOnThisSlave) {
      for (oldPartition <- oldPartitions) {
        val incomingBlock = "block_" + currentShuffleId +
          "_from_" + oldPartitions.id +
          "_to_" + newPartition.id
         // fetches block from oldPartition's node
        block = getBlock(incomingBlock)
      }
    }
{: class="brush:scala"}

(If you're curious about Spark's actual implementation of these, the 1st snippet is implemented in `ShuffleMapTask`, and the 2nd snippet is implemented in `ShuffledRDD`.)

### Mapper and Reducer Terminology

In our example, we had two `RDD`s: `lines`, the raw log lines, and `linesByUser`, which are grouped/shuffled by user id.

For a shuffle, Spark uses common map/reduce terminology, and calls the `lines` `RDD` the map-side, and the `linesByUser` `RDD` the reduce-side.

Since `lines` has 4 partitions, the shuffle to `linesByUser` is said to have 4 mappers. And since `linesByUser` has 4 partitions, then there are 4 reducers.

Here the number of mappers and reducers are the same, but this is not necessarily the case; if you know `linesByUser` will have much fewer keys in it (due to a `filter` for example), you could drop the number of reducers to reduce overhead. We'll talk about this more later.

So, conceptually if a shuffle has 4 mappers, and 4 reducers, each mapper (say the mapper for `lines` partition 1) must have a block for each reducer (the reducer for `linesByUser` partition 1, `linesByUser` reducer partition 2, `linesByUser` reducer partition 3, etc.).

This is a basic permutation, so for 4 mappers and 4 reducers, it results in `4 x 4 = 16` blocks to store the shuffle results.

Shuffling at Scale
------------------

...this is what I actually wanted to post about...

Credits
-------

The Spark community, and Patrick Wendell and Aaron Davidson in particular, on the Spark user list where extremely helpful in describing the mechanics of shuffling (see [this thread](http://markmail.org/search/?q=oome+list%3Aorg.apache.spark.user#query:oome%20list%3Aorg.apache.spark.user+page:1+mid:ybauig4d5phdackv+state:results)).
