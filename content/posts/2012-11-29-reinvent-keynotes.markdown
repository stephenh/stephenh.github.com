---
date: "2012-11-29T00:00:00Z"
title: Reinvent 2012 Keynote Notes
---


The [Bizo](http://www.bizo.com) engineering team is attending [AWS re:Invent](https://reinvent.awsevents.com/) this year, which has generally been awesome.

I thought I'd post the meandering notes I took during the keynotes. My disclaimer is that I'm erring on the side of posting incomplete/off-the-cuff notes vs. a more curated, edited version, as the latter just wouldn't happen.

Andy Jassy, Senior VP, Keynote
------------------------------

Every day AWS is adding enough capacity to run all of amazon.com circa 2003, which was then a $5 billion business.

Segment showing how the NASA's Mars Curiosity lander used AWS to stream video from the lander to JPL into AWS through Simple Workflow, S3, EC2, to their website. Self-hosted NASA website went down, so they redirected all traffic directly to the AWS-based Curiosity video feed (which is where all the users wanted to go anyway), which scaled and stayed up.

Pitching AWS/the cloud:

* Allows trading CapEx (large, up-front server costs) for OpEx (on-going costs), with a smaller OpEx than up-front servers anyway.
* Economies of scale (within cloud provider) as adoption increases.
* AWS has lowered prices 23x, 25% off S3. Utility pricing. No contracts.
* AWS is extremely disruptive to the economics of traditional hardware companies (Oracle, HP, IBM) which are used to 60-80% margins. AWS is low margin, high volume.
* Easy to experiment (new apps, new services) with low risk (not stuck with later-unneeded, wasted infrastructure).
* Don't waste time on non-differentiating infrastructure.

Conversation with Reed Hastings:

* Aside about Nicolas Carr, there used to be VPs of Electricity, as each company generated its own electricity. VPs of Data Centers/etc. will go the same way.
* Netflix went from 1 million to 1 billion hours streamed/month (1000x increase) in 4 years.
* Reed's future trends:
  * Picking instance types should go away, just like picking register allocation went away with compilers
  * Moving running instances at scale is hard, but will happen
  * Trend of cloud-assisted personal computers, e.g. Siri, taking input and using the cloud to make it useful.
  * Netflix's UI has a 10" window through which customers must choose from 50k videos--ranking and suggestions (first two home pages) are extremely important to their business

New service: RedShift, data warehouse.

* Reduces costs from ~$19k/TB/year for traditional setup to $1k/TB/year.

Werner Vogel Keynote
--------------------

Amazon.com being a retail, low margin business meant having 75% unused capacity was too expensive. (E.g. handling Black Friday spike of 4x traffic with traditional hardware means other 364 days of the year, only 1/4th of the traditional server capacity would be used.)

Led to avoiding business decisions, like time-based promotions (millions of users hitting F5 at 11:59pm), because hardware capacity wasn't unavailable.

Research for fault tolerance was done, complete, 15 years ago, but only people at scale could implement it. So no one did.

Werner asserts that dynamic resources will reduce risk, complexity, etc., and increase the historically bad (30% etc.) software project completion rates. (I am skeptical.)

Commandants for 21st century architectures:

* Controllable: small, loosely coupled, stateless building blocks.
  * These blocks are the basis of your scale and recovery.
  * Example of architecture inversion:
    * amazon.com had been calling IMDB for DVD stats with a sync call
    * Meant amazon.com load affects IMDB load
    * Change to IMDB pushing HTML into S3 buckets, amazon.com pulls from S3, now decoupled
  * Architect with cost in mind--not big O, but real dollars. Utility pricing. Cost grows inline with business.
  * Demo graphing cost back to a business goal like "cost per image uploaded"
* Resilient
  * Protecting customers is the first priority (privacy, encryption, HTTPS all the time).
  * Use availability zones.
  * Integrate security from the ground up (firewalls are not enough anymore, we don't use moats), ports are closed by default.
  * Build, test, deploy continuously
    * amazon.com deploys every 10 seconds, 30k instances receiving updates
    * amazon.com used to do phased deployments, roll a new version gradually through each availability zone
    * Now flips back/forth. Rollback is possible as the old machines are still around.
  * Don't think about single failures. Don't treat failure as an exception.
* Adaptive
  * "Use occam's razor" and "Assume nothing"--what?
* Data driven: instrument everything, all the time.
  * Track business metrics, not just JVM heap size.
  * Average sucks...it means half of your customers are getting something worse.
    * Look at the whole distribution, look at the 99th percentile. It will raise all boats.
  * Put everything in logs, including business information.

Some other pithy quotes:

* Thou shalt use new concepts to build new applications.
* Thou shalt automate your applications and processes.
  * If you have to log in to an instance, you're doing it wrong. Business metrics (latency) should drive scaling, not ops.
* Thou shalt turn off the lights.
  * SimpleGeo graphed total cost of running clusters (prod, test, qa) on a dashboard--meant devs actually shut down test cluters when they went home.

Segment on Amazon S3, the "10th world wonder":

* At large scale even low probability events happen a lot.
* 1 in a billion means a few 1000 times per day.
* Runs per AZ, and PUTs handle syncing across regions?
* Rolled out new storage back end incrementally, everyone got it for free. No "S3 v2".

New instance types:

* 240gb of RAM, 240gb of SSDs
* 48TB local storage.

New service: AWS data pipeline, automates moving data around. Scheduling, retry.

