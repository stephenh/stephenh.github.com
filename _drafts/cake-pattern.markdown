---
title: Musing About the Cake Pattern
layout: draft
---

{{page.title}}
==============

The Cake pattern in Scala is a way of doing dependency injection; it's been around for a long time, and I'm not really sure what is the best/easiest introductory material to it these days, so I'll leave Googling for the best "Cake Intro" that as an exercise to the reader (although here is [the original Cake Pattern post](http://jonasboner.com/real-world-scala-dependency-injection-di/), which I looked at to refresh my memory).

So, even though this post blog post is ~5 years too late, I thought I would articulate how I understand the Cake pattern.

Note that this is not actually a recent revelation on my part, nor do I claim any remarkable insight, but it is nonetheless an articulation I'd been meaning to write down for awhile.

The insight, for me, was realizing how regular/boring Java-style DI maps to Cake-style DI. In retrospect, it is very simple, such that I now wonder whether tons of articles/posts have already pointed this out, and I just missed it.

Starting Simple
---------------

Let's start with a simple Java example, say a `FileProcessor` that has two dependencies, `FileInputter` and `FileOutputter`.

In boring Java, this might look something like:

    class FileProcessor {
      private final FileInputter input;
      private final FileOutputter output;

      class FileProcessor(FileInputter input, FileOutputter output) {
        this.input = input;
        this.output = output;
      }

      // rest of logic uses this.input/this.output
    }

    // usage (by hand, not "real DI")
    val input = new FileInputterImpl()
    val output = new FileOutputterImpl()
    val fileProcessor = new FileProcessor(input, output)
    fileProcessor.process()
{: class="brush:java"}

Fair enough, typical constructor-injection.

In Cake, this is written as:

    trait FileProcessorComponent {
      val input: FileInputter 
      val output: FileOutputter
      val fileProcessor: FileProcessor

      class FileProcessor {
        // rest of logic uses input/output
        def process() = ???
      }
    }

    // usage
    object AppConfig extends FileProcessorComponent {
      override val input = new FileInputterImpl()
      override val output = new FileOutputterImpl()
      override val fileProcessor = new FileProcessor()
    }
    AppConfig.fileProcessor.process()
{: class="brush:scala"}

So, what's the transformation?

Very simple, take anything that would previously be a constructor argument, and move it into an outer trait, called `FileProcessorComponent`.

That's it.

Using Two Components
--------------------

Before delving into nuances, let's extend the `FileProcessor` to use a new `ContentScanner` dependency (this time only in Cake):

    trait ContentScannerComponent {
      val decoder: Decoder
      val contentScanner: ContentScanner

      class ContentScanner {
        def scan() = // use decoder
      }
    }

    trait FileProcessorComponent {
        self: ContentScannerComponent =>
      val input: FileInputter 
      val output: FileOutputter
      val fileProcessor: FileProcessor

      class FileProcessor {
        def process() = // use contentScanner/input/output
      }
    }

    // usage
    object AppConfig
        extends FileProcessorComponent
        with ContentScannerComponent {
      override val decoder = new DecoderImpl()
      override val input = new FileInputterImpl()
      override val output = new FileOutputterImpl()
      override val contentScanner = new ContentScanner()
      override val fileProcessor = new FileProcessor()
    }
    AppConfig.fileProcessor.process()
{: class="brush:scala"}

So, the important thing to note that `ContentScanner` uses the same "declare my dependencies in my outer trait".

The idea here is that `AppConfig` becomes our central "wire a bunch of stuff together" point.

What Was Confusing To Me
------------------------

To me, there were two confusing aspects to the Cake pattern:

1. Is simply the terminology choice of "component".

   I know it sounds silly, but "component" has meant many things in software over the years, and usually not "the dependencies I need" (e.g. even in the original blog past, there were a few side nodes of "think of this as the component's namespace").

   I think something like "context" would have been more intuitive, e.g. `FileProcessorContext`.

2. The `FileProcessorComponent` trait is declared *outside* the `FileProcessor` itself.

   Other ways of declaring "parameter objects for dependencies" (e.g. [Context IoC](http://sonymathew.blogspot.com/2009/11/context-ioc-revisited-i-wrote-about.html)) usually nest the "what are my dependencies" type *inside* the class. I think this is, on the surface, more intuitive to programmers because the "dependencies I need" is a sort of implementation detail, and so having that live inside the scope of the class is a nice place for it.

   As a concrete example, `FileProcessor` might have a `FileProcessor.Config` inner trait.

   Granted, I think this means up being more verbose, as you have to take the trait as a constructor argument:

       class FileProcessor(context: Context) {
         trait Context {
           val input: FileInputter
           val output: FileOutputter
         }
         import context._
         def process() = // use input/output
       }
   {: class="brush:scala"}

   However, even worse than just being more verbose, this approach doesn't even work in Scala anyway, as the nested `Context` trait is not considered static from `FileProcessor`, and so can't be instantiated before the `FileProcessor` itself is.

   Instead, you'd have to have the `Context` declared as a sibling:

       trait FileProcessorContext {
         val input: FileInputter
         val output: FileOutputter
       }

       class FileProcessor(context: FileProcessorContext) {
         import context._
         def process() = // use input/output
       }
   {: class="brush:scala"}

   Which is again more verbose (the `context` constructor argument, the `import context._`) compared to Cake's outer trait approach, and 

It is probably just the passage of years, but in retrospect neither of this wrinkles seem that big, but nonetheless I think were part of what caused my initial confusion.

Pros of the Cake Pattern
------------------------

I think there are several nice things about the Cake pattern:

1. The dependency wiring is statically typed ([yay](http://www.draconianoverlord.com/2010/11/24/why-im-a-static-typing-bigot.html))

2. Similarly, it [stays in the language](http://www.draconianoverlord.com/2013/03/08/stay-in-the-language.html), e.g. uses vanilla features of the language and neither compile-time code generation nor run-time meta-programming, which, although not inherently evil, often make comprehending exactly what is happening too abstract/magical.

3. You can easily see what each class's dependencies are

   E.g. my preferred "DI" approach, an [AppContext](http://www.draconianoverlord.com/2011/03/17/frameworkless-di.html), lumps all application-level dependencies into one interface, so you might have a `new FileProcessorImpl(appContext)`, and you can't tease out which of the `N` dependencies the `FileProcessorImpl` actually needs.

Downsides of Cake Pattern
-------------------------

1. There seems to be perceived complexity around the Cake pattern, perhaps because it uses more esoteric Scala language features like self types.

2. That I'm not convinced the "self type" approach is a good idea, e.g. in this setup:

       trait FileProcessorComponent {
           self: ContentScannerComponent =>
         val input: FileInputter 
         val output: FileOutputter

         class FileProcessor {
           def process() = // use contentScanner/input/output
         }
       }
   {: class="brush:scala"}

   What we're trying to say is "the `FileProcessor` depends on a `ContentScanner`".

   However, if I want to unit test `FileProcessor`, with a fake `ContentScanner`, I can't provide *solely* a fake `ContentScanner`, I need to provide the `ContentScannerComponent`, which needs a `Decoder` filled in. But my unit test doesn't need a `Decoder`:

       object TestProcessorConfig
           extends FileProcessorComponent
           with ContentScannerComponent {
         override val input = new FakeInputter()
         override val output = new FakeOutputter()
         override val contentScanner = new FakeScanner()
         // compile failure unless I provide a decoder that I don't need...
         override val fileProcessor = new FileProcessor()
       }
   {: class="brush:scala"}

   So, AFAICT, `self: ContentScannerComponent` couples the `FileProcessor` implementation too much to the `ContentScanner` *plus it's dependencies* instead of just `ContentScanner` itself; e.g. I would think this would be preferable:

       trait FileProcessorComponent {
         val input: FileInputter 
         val output: FileOutputter
         val contentScanner: ContentScanner

         class FileProcessor {
           def process() = // use contentScanner/input/output
         }
       }
   {: class="brush:scala"}

   Where we depend solely on the `ContentScanner` interface (so we should change `class ContentScanner` to `trait ContentScanner` as well).

   This also means we avoid using the Scala self-type feature (`self: Foo =>`), which lowers the complexity/strangeness, and so seems like a win all around.

Compared 


