---
layout: post
title: Lift Templating is a Joke
---

Lift Templating is a Joke
=========================

I want to like [Lift](http://liftweb.net). I like [Scala](http://scala-lang.org) and Lift seems like the goto Scala web framework for now.

I have several nitpicks with it, the one I'll rant about now is its templating syntax.

**Disclaimer:** I know "joke" is a harsh word--but given the combination of the author's superior attitude towards other frameworks plus his own solution missing the very goals he sets forth, I felt compelled to respond in kind.

Lift's Lofty Goal
-----------------

First, let's start with the author waxing poetic about his design goals in Lift's [Getting Started](http://liftweb.net/docs/getting_started/mod_master.html).

---

*My first design goal with Lift was to make sure that no programming logic and no programming symbols make it into the static display templates.*

*ERB and JSP and ASP all have the fatal flaw of allowing code in the view. This is bad for a bunch of reasons. First, it makes editing the templates difficult with HTML layout tools unless those tools are familiar with the syntax being used. Second, there are “foreign” symbols in the layout, which tends to be less than optimal for the HTML designers.*

*So, the static templates in Lift are strictly for display only. They can be manipulated with standard design tools (e.g., Dreamweaver). They can never contain program logic.*

---

So, cool, I can agree with that. Good goals.

Falling Short
-------------

But then you see the implementation:

    <html> 
    ... 
    <lift:Show.myForm form="POST"> 
    <tr> 
      <td>Name</td> 
      <td><f:name><input type="text"/></f:name></td> 
    </tr> 
    <tr> 
      <td>Birthyear</td> 
      <td><f:year> 
          <select><option>2007</option></select> 
      </f:year></td> 
    </tr> 
    <tr> 
      <td>&nbsp;</td> 
      <td><input type="submit" value="Add"/></td> 
    </tr> 
    </lift:Show.myForm> 
    </html>
{: class=brush:html}

And...what? What happened to no separation? Designer friendly? Is Dreamweaver really going to like that `<tr>` tag coming after a `<left:Show.myForm>` tag instead of a `<table>` tag?

I don't see how this achieves the design goal of "no programming logic". I consider the `<lift:xxx>` tags to be programming symbols just as much as curly braces.

Yeah, okay, they are tags, but they are not native HTML tags that any designer/web design tool will have seen before. They are programming symbols.

I wouldn't care about the `<lift:xxx>` syntax that much--other projects take this approach as well, e.g. [GWT](http://code.google.com/webtoolkit/) off the top of my head.

But since Lift goes out of its way to assert, repeatedly, how designer friendly it is, when it's not, just annoys me.

Pure Rocks
----------

The Lift crowd needs to look at [pure](http://beebole.com/pure/) instead.

If you look at the [demos](http://beebole.com/pure/demos/), one of pure's table examples is:

    <table class="playerList">
      <thead>
        <tr><th>Player</th></tr>
      </thead>
      <tbody>
        <tr class="player">
         <td>Chloe</td>
       </tr>
      </tbody>
    </table>
{: class=brush:html}

Now **this** is designer friendly. There really are no programming symbols in this.

Now, admittedly, pure requires a few hoops for the programmer to jump through, e.g. this directive:

    {
      "tbody tr": {
        "player<-players": {
          "td": "player",
          "td@style": "\"cursor:pointer\"",
          "td@onclick": "\"clickLine(this);\""
        }
      }
    }
{: class=brush:jscript}

And this could probably be cleaned up.

Even if the templating was driven entirely off of HTML `id` attributes, I think you'd have a usable solution.

I admit I haven't fully thought it through, but I'm optimistic.

Code Generation
---------------

While I'm on the topic of templating, I like how GWT parses its templates at compile-time and ensures they type-safely match your usage of the templates.

What I don't get is why this has to happen during the already-time-consuming GWT startup phase.

Even a project like Lift could build a code generator that, after parsing your templates at **build-time**, creates an `XxxTemplate.scala` class with type-safe elements for you to program against.

For example, take something like `foo.html`:

    <table id="playerList">
      ...
    </table>
{: class=brush:html}

And after running `lift generate-templates` on the command line (ideally ran automatically each time your HTML files change), Lift would spit out a class:

    object FooHtml {
      val playerList = new TableElement("playerList")
      // other elements/etc.
    }
{: class=brush:scala}

This output may get somewhat ugly, but its basically going to be the same code Lift is interpreting at runtime (or, in the case of joys like [Tapestry](http://tapestry.apache.org/), are bytecode compiling at runtime).

All of Lift's `bind` calls could then be made again, you know, actual objects instead of the String keys.

Magic Strings
-------------

Which again is ironic given how Lift just ragged on `HttpSession`, again from their [Getting Started](http://liftweb.net/docs/getting_started/mod_master.html):

---

*Lift has a type-safe mechanism for storing variables during the scope of a given session.*

*In Java, you would do something like casting a value retrieved from the `HttpSession`. For example: `String myString = (String) httpSession.getAttribute(“Something”)`; The problem with this code is that a developer may not remember that Something is support to be a `String` and put a `String[]` in it. Additionally, there's no well defined logic for creating a default value for the attribute.*

---

Well, good for you, Lift, you avoid magic Strings in session usage--but then go right back to magic Strings all over your templating layer.

    private def doList(reDraw: () => JsCmd)(html: NodeSeq): NodeSeq = 
      toShow.flatMap(td => 
        bind("todo", html, 
          "check" -> ajaxCheckbox(
                  td.done, 
                  v => {td.done(v).save; reDraw()}), 
          "priority" -> ajaxSelect(
                  ToDo.priorityList, Full(td.priority.toString), 
                  v => {td.priority(v.toInt).save; reDraw()}), 
          "desc" -> desc(td, reDraw) 
      ))
{: class=brush:scala}

See `"todo"`, `"check"`, `"priority"`, etc.--all untyped, magic strings.

And, again, I wouldn't care so much had they just not touted their `SessionVar`, and, also making the wording such that "oh, you'd do this crappy approach *in Java*", when, no, Java can have a `SessionVar` abstraction just as well as Scala/Lift can.

I don't mention this because I have a chip on my shoulder about Scala. I actually really like Scala. But I do have a chip on my shoulder about the last 10 years of people bitching about how crappy Java is when really the problem with Java is not some inherent flaw but instead the self-inflicted complexity J2EE devs love foisting on their projects.

Anyway, build-time code generation really isn't that bad. It just needs to be easy to run (automatic if possible), fast, and not produce crap code.

I'd love to see Lift, or some other Java/Scala project, pick up this approach and run with it.


