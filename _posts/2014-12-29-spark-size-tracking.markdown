---
layout: post
title: Spark Size Tracking
---

{{page.title}}
==============

I've always been curious how Spark knows when it's in-memory collections are getting too big and spills to disk. So I thought I'd write down what I noticed while scanning the source code.

They have a [SizeTrackingAppendOnlyMap](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/util/collection/SizeTrackingAppendOnlyMap.scala) that is what the shuffle code uses to say "here, take some elements, now are you too big to fit into memory"?

After each update, this map calls `afterUpdate()`, which in the [SizeTracker](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/util/collection/SizeTracker.scala#L67) mixin periodically calculates the in-memory size of the collection (and each time it grows by 10%, it re-calcs the size).

Here is the actual [SizeEstimator](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/util/SizeEstimator.scala#L166), which uses reflection to walk all of the fields on an object and count up their size (e.g. a boolean field is 1 byte, an int field is 4 bytes, etc.).

Back to SizeTracker, they do this calculation every N records, and say, well, if you were `10mb` last time, and `15mb` this time, and we've added 10 records since this, our size is `~15-10 / 10 = 100kb/item`.

Then when asked to estimate the current size (in [estimateSize](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/util/collection/SizeTracker.scala#L96)), it uses the last size (e.g. `15mb`) + the last-calculated size/item times the items added since last sample (so if we've added 2 things, it'd be `15mb + 100kb*2 = 15.2mb`).

This is actually much fancier than I would have anticipated (e.g. their SizeEstimator really is counting the actual bytes used in memory).

A few misc thoughts:

1. I'm kind of surprised they're pass "this" to SizeEstimator, because it means they're calc'ing the total size of the collection on every sample, when in theory they should only need to calc the size of the objects added since last time (removes are not supported, at least in the append only map) and then add in the value from the previous sample. Perhaps this is fast enough that it doesn't matter.

   (After pondering, this actually makes sense, because if the collection is backed by, say, an array, and we can't just say "our new size = last size + 300 new items", because our underlying array might also have been resized from, say, 500 slots to 1000 slots.)

2. Given they're only checking size every 10% jump in growth, if a hugely skewed row snuck in, it may take awhile for Spark to notice and spill to disk.

   That said, I did just recent confirmation on the spark-user list that the current assumptions are: a) you do not need a single partition to fit into memory anymore (I believe starting with spark 1.2+) but b) a single row (or key+values for cogroup/joins) must fit into memory.

   So, with that in mind, that your key/values should generally fit in memory anyway, it seems unlikely that you'd slip too many of them in before size estimator caught on to what was going on.

The other aspect of this, since a single Spark executor can be executing multiple tasks at once (typically one/core), is the [ShuffleMemoryManager](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/shuffle/ShuffleMemoryManager.scala#L50), where each thread will try and reserve the memory for it's in-memory collection from a central pool that defaults to 20% of the total JVM heap.

If there is not enough memory in the pool (because other threads are using it, or the collection is just really big) for it's collection, then it will spill the collection to disk.

Note that this is kind of an interesting JVM-based approach to memory tracking: unlike C code, which would use explicit `malloc` and a pool of very explicit chunk/chunks of memory for a collection, in the JVM world, Spark can't ask for specific chunks and know exactly what thread is using which sections of memory. E.g. the "pool" here is not pointers to the raw bytes themselves, it's just bookkeeping of "X thread is using ~Y bytes for it's collection".

With this, Spark can track the aggregate affect of total memory usage vs. what's available, and make data movement (RAM -> disk) decisions based on that, while still deferring to the JVM/GC to allocate/release the actual bytes.

(This line of thinking fairly quickly leads to musing about using off-heap data structures for these collections, given that Spark is in a position to make very deterministic decisions about when/how much to allocate/release the data structures, but that is not yet something I know much about, other than [Apache Spark 1.0.0 uses Tachyon for off-heap storage](https://github.com/amplab/tachyon/releases).)
