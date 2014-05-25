---
title: The Pain of Small Methods
layout: post
---

{{page.title}}
==============

I'm currently reading [Practical Object-Oriented Design in Ruby](http://www.poodr.com/), not because I'm planning on writing any Ruby code, but because I thought the general OO advice would be applicable across OO languages (and it is so far).

So far the book is good; it is preaching a lot of the usual (good) OO practices of:

* Single-responsibility classes
* Single-responsibility methods
* Intelligent decoupling
* Etc./stuff I'm forgetting/haven't read yet

Turns Out I Suck
----------------

My main takeaway so far is that I am being guilted into realizing how often I violate the single-responsibility principle, at both the class and method level.

So, I started to think, particularly for methods, why don't I *always* make tiny, less-then-5-line methods? I know it's best practice, so why isn't all of my code so nice and neat?

After thinking about it, I think it's because, frankly, small methods are kind of a pain in the ass to make.

How so?

Smaller methods inherently mean more up-front work--you're creating more methods, having to pick more method names, type out more method parameters, cut/paste the code into the new method, re-indent it, update it to use the method parameters, move back to the old code and update it.

None of these are actually prohibitively painful (especially if you follow the [craftmanship](http://en.wikipedia.org/wiki/Software_craftsmanship) approach of being quick and skilled with your tools/editor/IDE), either by themselves or in aggregate.

But it's kind of a death by a thousand paper cuts: lots of little things, which mean it's easy to say "eh, good enough" and move on.

I Can't Even Decide Where to Put Them
-------------------------------------

One aspect of small methods that I wanted to focus on in particular, which seems really small, but is nonetheless one of the bigger "paper cut" issues for myself, is: where do they go?

If you have a public method:

    public void someFoo() {
      while (some || complex || condition) {
        ...
      }
    }
{: class="brush:java"}

And we want to extract the complex condition:

    public void someFoo() {
      while (someComplexCondition()) {
        ...
      }
    }

    private void someComplexCondition() {
      return some || complex || condition;
    }
{: class="brush:java"}

Where's the best place for `someComplexCondition` in the source file? There are several options:

* Right after the `someFoo()` method
  * Pro: Keeps helper method right by `someFoo`, so ideally you can read/write them without jumping around.
  * Con: Starts interleaving public/private/public/private methods, which personally I don't like as I prefer to see a class's public API come first (and ideally be short).
* At the bottom of the class
  * Pro: Keeps public/private API separate
  * Con: Means jumping back/forth while reading/writing code

So, basically, I prefer "bottom of the class", but the PITA of jumping back/forth to read/write the method increases the pain off small methods just enough that I do it sometimes, but not always.

Musing, what could we do to avoid this particular annoyance? What could avoid the trade-off of placement by relevancy vs. scope?

One way is to avoid the question all together, and stop thinking of the source file like a sequential text file. This leads to fancy AST-based IDEs, like the once-promising but AFAICT abandoned [Code Bubbles](http://cs.brown.edu/~spr/codebubbles/).

The idea would be that your IDE could display helper methods right next to/by your current method, even though in the source file they were off someplace else.

This is intriguing, but IDE hacking is not for the faint of heart. And, at the end of the day, the developer tool chain (SCM, code review, etc.) still assumes source files.

(I should note that vanilla Eclipse has a version of this built in; a friend of mine uses it all the time, where you can hover a method and in the little popup box, Eclipse will show you the source. This works best, of course, for small methods, which is exactly what we're talking about...)

Another way to avoid "where do I put helper methods" is to build nested methods into the language, so that helper methods can actually live inside the "owning" method. E.g. in Scala:

    def someFoo(): Unit {
      def someComplexCondition() = {
        some || complex || condition
      }

      while (someComplexCondition()) {
        ...
      }
    }
{: class="brush:scala"}

Obviously this only works for helper methods that are only called by one method, but I think that is fine.

I'm not sure why, but so far I haven't gotten used to this approach.

For one, I think nested methods have to be really tiny, 1-2 liners, or they distract too much from the primary method.

Also, if you have even 2 nested methods, it starts to distract too much from the primary method.

And, finally, if you're passing type parameter, it gets even more distracting as the declarations make the nested method all that much longer:

    def someFoo(): Unit {
      def someComplexCondition(foo: FirstParamType, bar: SecondParamType) = {
        some || foo.complex() || bar.condition()
      }

      while (someComplexCondition(foo, bar)) {
        ...
      }
    }
{: class="brush:scala"}

Here I'm only passing two parameters, and the line is already long enough that it should be wrapped.

Tangentially, I wonder if Scala couldn't just infer the parameter types of inner methods. They since are by definition not exposed to any callers outside of the source file/compilation unit, Scala could potentially just infer the types based on existing usages (and not worry about maintaining a contract across compiles) and be done with it:

    def someFoo(): Unit {
      def someComplexCondition(foo, bar) = {
        some || foo.complex() || bar.condition()
      }

      while (someComplexCondition(foo, bar)) {
        ...
      }
    }
{: class="brush:scala"}

That aside, all of my complaints about nesting methods inside of `someFoo` boil down to it being distracting, which makes sense because if our goal is small methods, putting nested methods inside of `someFoo` basically itself means, that, `someFoo` itself won't be small anymore.

Some Things That Might Help
---------------------------

Anyway, thinking about how I could improve in this area, I came up with a few things to try:

* Use a split editor view, e.g. the same file, but two windows, so I could have, say, the top view showing the main/public methods, and bottom view showing the helper/private methods.

  I'm not entirely sure how easy it would be to do this with Eclipse, especially in a nice keyboard-driven way, e.g. for switching between views, but I might play around.

* Use the Extract Method refactoring more often (for languages that support it).

  I haven't used this refactoring often enough for it to be 2nd nature; perhaps I should try. Although it'll be limited to Java code for now since the Scala IDE's refactorings are fairly half-baked at this point.

* Rationalization (I'm a pro at this one). Part of me wonders that, perhaps small methods are not the panacea that they are promoted to be. If they really were this amazing, shouldn't I (and others) be doing them more automatically?

  Obviously, "best practice" != "free", and so it should be fine that there is some up-front cost to small methods. But it still seems like if people did experience lots of benefits from them, we'd see them more consistently than we do.

  Dunno. I will think about this and try to pay more attention.

* Just do it anyway.



