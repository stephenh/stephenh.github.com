---
layout: post
title: Data Binding Review
---

Data Binding Review
======================

Data binding is interesting topic to me, mostly because of the large effect it can have on an application's view layer.

A good data binding approach means your view layer is not wasting boilerplate LOC getting/setting data into/out of your domain model. Instead, ideally you succinctly bind `input <-> domain model` and, in 90% of the cases, be done with it.

I've used and built several data binding options and was recently reconsidering property objects dressed up in some of Scala's magic as a potentially elegant approach.

While doing so, I also flushed out descriptions of other approaches I've used or seen before as well:

* OGNL
* Bindgen
* Property Objects
* Scala Property Objects
* Lift/Scala Functions

Granted, these are all admittedly biased towards the Java platform.

The Basic Idea
--------------

Most data binding approaches I've worked with boil down to an interface that looks like:

<pre name="code" class="java">
    public interface Binding&lt;T&gt; {
        T get();
        void set(T value);
        Class&lt;T&gt; getType();
    }
</pre>

The name is often different than "Binding", and it may/may not use the generic type parameter `T`, but that's the basic idea.

At first blush, while rendering a value to the screen (or file or database), having a `Binding` to call `get()` on for its value is not much different than just passing the value itself.

But where a `Binding` proves handy is on taking input from the user (usually text-based, e.g. an HTML post), and putting data back into the domain object using the `set` method.

In Java, you cannot pick up a `setName` setter and pass it into a library and say "call this when you have a value ready".

Being able to pass the setter around like this, in my experience, is the key to good domain object-based data binding.

The `Binding` interface (or a functional equivalent), by providing the `getType` method, also facilitates frameworks auto-converting input into the appropriate domain model type, e.g. converting a String to a `Date`.

Without a `Binding`, you'll be stuck writing translation code like:

<pre name="code" class="java">
    // somewhere inside rendering
    out.write(domainObject.getDate());
    
    // somewhere inside posting
    domainObject.setDate(
      YourHelper.parseDate(request.getParameter("date")));
</pre>

Which is not bad for simple input/output, but if rendering or posting becomes more complex, it becomes harder to apply levels of abstraction because you're stuck not being able to pull the `setDate` call up into helper/library methods.

Data Binding with OGNL
----------------------

I have had a lot of success with [OGNL](http://www.ognl.org) and integrating it with a [Click](http://click.sf.net)-based view layer. The basic idiom is:

<pre name="code" class="java">
    public class EmployeePage {
      public Employee employee = null; // assigned for us
      public Form form = new Form();

      public void onInit() {
        this.form.add(new Textbox("employee.firstName"));
        this.form.add(new Textbox("employee.lastName"));
      }
    }
</pre>

When the form rendered itself, the text boxes would use OGNL to evaluate the `employee.firstName` String against the page object, e.g. `page.employee.getFirstName()`. This value would then be included in the rendered HTML.

And then when the form post happened, the text boxes would again use OGNL to evaluate `employee.firstName = formFieldValue`, e.g. `page.employee.setFirstName(formFieldValue)`. The posted value would then be set back into the domain object.

OGNL also lets you introspect the property types (e.g. the `Binding.getType` method), so basic type conversion could take place if the incoming form String value needed to be, say, a `java.util.Date`.

OGNL can also handle tables well. In the above `EmployeePage`, each OGNL string was evaluated against the current page object. But OGNL strings can also be evaluated against each object in a collection, e.g.:

<pre name="code" class="java">
    public class EmployeesPage {
      public Employer employer = null; // assigned for us
      public Table table = new Table();

      public void onInit() {
        table.add(new Column("firstName");
        table.add(new Column("lastName");
        table.setRows(employer.getEmployees());
      }
    }
</pre>

Here the table class gets the first `Employee` as `currentObject`, render the columns, with OGNL calling `currentObject.getFirstName()` and `currentObject.getLastName()`, then moves on the next `Employee` object and repeats.

For lack of a better term, I'll call this ability "arbitrary instance" evaluation because a given String can be evaluated against any arbitrary "root" instance.

So, that's OGNL data binding. What's the big deal?

With a web framework like Click, which is spiffy enough to generate all of the HTML for the form and table objects, this means that on the majority of the application's pages, each form field/table column originates from **1** line of code. Over a large enterprise app, this is a huge savings that can really add up.

This one-line-per-field (whether its HTML form field, database field, or flat file field) should be the goal of a good data binding approach.

This would be it, except that OGNL's property language is string-based. This means it is prone to breaking during refactoring. E.g. if `employee.getFirstName()` changes, the hard-coded string `"employee.firstName"` will not fail as a compile error. While not a show-stopper, this does become annoying in an environment like Java where developers' expect compile-time type-safety.

**Pros and Cons of OGNL**

* Pro: succinct--1 line-per-field
* Pro: non-invasive--domain model doesn't know anything about OGNL, uses getters/setters
* Pro: arbitrary instance evaluation
* Con: brittle--strings are opaque to the compiler and so break with refactoring

Other than being brittle OGNL is a great data binding solution. It sets a high standard that is the basis of comparison for the following approaches I've tried.

Data Binding with Bindgen
-------------------------

When building [Joist](http://joist.ws), I wanted to solve the string-based brittleness issue of OGNL, so I built [Bindgen](http://bindgen.org).

Bindgen is a JDK6 annotation processor that hooks into the compiler's build cycle. It introspects any classes you annotate with `@Bindable` and generates type-safe binding classes for it.

For example, if you have a class `Employee`, Bindgen will generate an `EmployeeBinding` class. If `Employee` has a `getName()` method that returns `String`, then `EmployeeBinding` will have a `name()` method that instead returns a `StringBinding`.

Each `XxxBinding` instance has `get` and `set` methods on it, meaning you can pass the binding around into frameworks and they can get/convert/set your data.

Using it looks something like:

<pre name="code" class="java">
    @Bindable
    public class EmployeePage {
      public Employee employee = null; // assigned for us
      public Form form = new Form();

      public void onInit() {
        EmployeePageBinding b = new EmployeePageBinding(this);
        this.form.add(new Textbox(b.employee().firstName()));
        this.form.add(new Textbox(b.employee().lastName()));
      }
    }
</pre>

The big win here is that strings have gone away. If your `Employee` class changes, the `firstName()` and `lastName()` calls will fail to compile.

Similarly, Bindgen can handle arbitrary instance evaluation with `Binding.getWithRoot` and `Binding.setWithRoot` methods. E.g.:

<pre name="code" class="java">
    @Bindable
    public class EmployeesPage {
      public Employer employer = null; // assigned for us
      public Table&lt;Employee&gt; table = new Table&lt;Employee&gt;();

      public void onInit() {
        // b is not connected to any specific Employee instance
        EmployeeBinding b = new EmployeeBinding();
        table.add(new Column(b.firstName());
        table.add(new Column(b.lastName());
        table.setRows(employer.getEmployees());
      }
    }
</pre>

The `EmployeeBinding` is still used to setup the table's columns, the difference is that `b.firstName()` is not tied to any particular `Employee`'s first name value.

As the table iterates over the rows, each `Employee` is assigned to a `currentEmployee` variable. Then the columns render their bindings by doing, basically, `b.firstName().getWithRoot(currentEmployee)`.

**Pros and Cons of Bindgen**

* Pro: type-safe--no strings
* Pro: fast--the `Binding.get/set` methods are real methods (no generated bytecode/interpreting/etc.)
* Pro: arbitrary instance evaluation--via `Binding.getWithRoot/setWithRoot`
* Pro: non-invasive--the `@Bindable` annotation on the view will automatically recurse to the `Employee` domain object and so not require explicitly coupling your domain to Bindgen
* Con: minor LOC overhead--the `@Bindable` and `EmployeePageBinding b` are constant (not per-field) syntactic costs
* Con: Java-only--having being bitten by the Scala bug recently, it would be nice to write domain objects in Scala. Scala has compiler plugins, but there is no Scala Bindgen implementation (yet).

Data Binding with Property Objects
----------------------------------

Fowler talks about Property Objects in his [GUI Architectures](http://martinfowler.com/eaaDev/uiArchs.html) piece.

The basic idea is to promote the usual trio of:

* `private String name`
* `public String getName`
* `public void setName(String name)`

Into a single:

* `public StringProperty name()`

This makes a lot of sense, because now there is a single object representing and encapsulating the name concept, so it can be passed into a library, have `get`/`set` methods called on it, etc.

But it does kind of suck when you have to do:

<pre name="code" class="java">
    String name = employee.name().get();

    employee.name().set("new name");
</pre>

Instead of just the usual `getName()` and `setName()` that is etched in our brains.

The genesis for this post was how Scala could make this better.

Using Scala for Property Objects
--------------------------------

So, what if we could add some Scala magic? Here's an experiment:

Normal Property Objects:

<pre name="code" class="scala">
      val p = new Parent
      val s: String = p.name.get
      p.name.set("Bob")
</pre>

With Scala implicit conversion and operator overloading:

<pre name="code" class="scala">
      val p = new Parent
      val s: String = p.name
      p.name := "Bob"
</pre>

See this [gist](http://gist.github.com/245296) for the full code, but most of the magic is:

<pre name="code" class="scala">
    /** PropertyObject interface for getting/setting values. */
    trait Property[T] {
      /** @return the current value */
      def get: T

      /** @param value the new value */
      def set(value: T)

      /** @param value the new value via a ':=' operator */
      def :=(value: T)
    }

    /** Companion object to the Property trait. */
    object Property {
      /** Implicitly called to convert Property[T] -> T */
      implicit def p2value[T](p: Property[T]): T = p.get
    }
</pre>

Between the `:=` operator and the `p2value` implicit, we've basically made the Property Objects annoying extra `get()`/`set()` method calls go hide behind compiler syntax sugar.

I like `:=` too--it is succinct and just different enough to hint that it isn't a real `=` operation.

Very cool. Makes me want to crank out some Scala domain objects.

One thing to note is that Property Objects do not support arbitrary instance evaluation--the `parent.name` Property Object is intrinsically linked to the one `parent` instance and cannot be evaluated against other instances, e.g. for the table iterating over a row list example.

**Pros and Cons of Scala Property Objects**

* Pro: type-safe
* Pro: fast--just method calls
* Con: no arbitrary instance evaluation
* Con: invasive--domain model must be changed to use `XxxProperty` objects. Though the `:=`/`implicit` aspects do make it more lightweight for users of the domain objects.

List/Scala Functions
--------------------

One last Scala trick is taken from [Lift](http://liftweb.net/)'s form library. It does not directly use bindings, but instead simulates them with Scala's incredibly succinct function declaration syntax.

A basic example:

<pre name="code" class="scala">
    def login(xhtml : NodeSeq) : NodeSeq = {
      var user = ""; var pass = "";
      def auth () = { ... }
      bind("login", xhtml,
          "user" -> SHtml.text(user, user = _)
          "pass" -> SHtml.password(pass, pass = _)
          "submit" -> SHtml.submit("Login", auth))
    }
</pre>

I'm not a Lift expert (this example is from [The Lift Book](http://groups.google.com/group/the-lift-book?pli=1), but if you note the `SHtml.text` function, instead of taking 1 binding parameter (e.g. OGNL string, `Binding` instance, or Property Object), Lift passes two parameters. The first is just the String value `user`. The second is a `Function1[String, Unit]` that, when executed, will assign the value passed to it back to the `user` local variable. It's basically an 8-character anonymous inner class.

These two parameters form a makeshift `get`/`set` duo that does well emulating a `Binding` instance.

Although, like property objects, it does not support arbitrary instance evaluation (AFAIK).

**Pros and Cons of Lift/Scala Functions**

* Pro: type-safe
* Pro: fast--just method calls
* Pro: non-invasive
* Con: no arbitrary instance evaluation
* Con: Scala-only (relies on inline function declarations)

Conclusion
----------

Stuff.

