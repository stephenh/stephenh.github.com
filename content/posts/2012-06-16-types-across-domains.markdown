---
date: "2012-06-16T00:00:00Z"
section: Architecture
title: Abstracting Types Across Domains
---


As a [static typing bigot](/2010/11/24/why-im-a-static-typing-bigot.html), I like static types. But I'm also pragmatic, and realize there are times when types get in the way, annoy programmers, and drive them to use Ruby.

One particular instance of "when types suck" that I'm acutely aware of is when it leads to an inability, or annoying difficulty, to have abstractions and generic infrastructure.

Application Code vs. Infrastructure Code
----------------------------------------

To explain my point, it's useful to think of a typically program as (at least) two parts: the application code and the infrastructure code.

What exactly is "application code" vs. "infrastructure code" changes depending on the application, but for certain classes of application's, there are fairly standard understandings. E.g. in a line-of-business application, application code is your business logic, which is usually entity-specific, while infrastructure code is your persistence logic, which is (hopefully) entity-generic.

For example, in business logic, the programmer is intrinsically reasoning about business-/application-specific details. E.g. introducing a method `doSomeCalculation` and then calling it later from another part of code. Here is it beneficial that each entity is a distinct type with distinct properties and methods, as it facilitates organizing and reasoning about (and type-checking) the code. So you'll have `Employee`, `Employer`, etc., for each entity in your application domain.

Contrast this with the infrastructure logic, say the persistence layer, which is more generic--"fetch entity X", "save entity X", etc. for each entity in the system. Once you've solve it for entity X, there generally isn't anything special about doing it for entity Y (ideally). Here, you generally don't want distinct types with distinct properties, but instead your domain is based on on higher-level abstractions like types of just `Entity` and `Property`.

So, What about Types?
---------------------

My assertion is that types are for programmers.

Historically, avoiding the runtime cost of dynamic method dispatch was important for performance, but I think it's accepted that lately VMs in even supposedly static languages like Java (which actually has a lot of polymorphic dynamic dispatch) show that, for most applications, dynamic vs. static typing is a wash.

But that's fine, performance aside, I like types for the benefit to the programmer. Each method call becomes a mini-unit test that the other side is fulfilling at least some minimal contract in agreeing to be called.

For business logic, this means you want your types to model the business domain, and have all of this nit-picky static checking against the distinct business objects and methods.

However, once you move into infrastructure code, you want your level of abstraction to go up--instead of working against specific entities (`Employee` or `Employer`), you want your types to model the infrastructure domain, e.g. `Entity` or `Table`.

As soon as you've done this, you can generically write your infrastructure. Which means less boilerplate, less lines of code, and less bugs. Awesome.

Declaring Types in Multiple Domains
-----------------------------------

Seems obvious, right? I think it is in principle. So where does it go wrong?

I think one of the weakness of static typing systems is that it's hard to declare types in multiple domains.

Or, more specifically, to succinctly declare a single type (say `Employee`) as a member of two domains (e.g. as a domain object in the application layer and an entity in the persistence layer) in a elegant fashion, such that each domain has the information about that type that it needs.

Usually when you declare a type like `Employee`, you're thinking of your business domain. But you're also implicitly adding `Employee` to the persistence domain. And so while you want distinct methods (`getName`, `setName`, `doBilling`) for the business domain, you want a generic list of properties (`id`, `name`, etc.) for the persistence domain.

Maintaining both these (distinct classes/methods that are yet also somehow generic) is not something that I think static languages do very well. But it's very important for non-trivial codebases.

If you fail to capture this abstraction, you typically wind up with boilerplate as you have to maintain the type in each of the relevant domains by hand.

(Tangentially, I've seen several Java enterprise applications fall into this trap. Usually it's from an amateur architect who's built a custom stack, and enough of a prototype that "works great"...for 2-3 entities. But without abstraction, there are garish violations of DRY as otherwise simple tasks like adding or modifying entities requires modifications to multiple layers of the code (business, persistence, etc.) and it just doesn't scale.)

Meta-Programming to the Rescue
------------------------------

The boilerplate approach is usually untenable, so we reach for the programmer's best friend: automation. Meta-programming is usually a great way avoid the boilerplate duplication and project a single conceptual type into multiple domains.

Several implementation options that come to mind are:

* Annotations

  For example, when the declaring the types for entities in the business domain, e.g. `class Employee`, you can add an annotation, e.g. `@Entity`, that acts as metadata for the persistence domain. You similarly annotate fields with `@Persistent`, or what not.

  I suppose technically this is getting a single type mapped into both domains--my issue, elaborated on in the "Annotations Suck" section of [Joist, the Java ORM for Me](/2012/03/21/joist-orm.html), is that it is still prone to boilerplate tedium, especially as annotation parameters get more plentiful, configurable, and hence confusing.

  Annotations can be accessed two ways, one via runtime reflection and the other via compile-time annotation processors. Both seem fine, though I generally prefer the compile-time aspect of annotation processors (of course)--to me it seems like accessing them as runtime increases your risk that the annotations were mapped incorrectly.

  (Tagentially, I went on quite the annotation processor bender for awhile, but am lately not favoring them as much because the Eclipse support is (very) occassionally wonky, and you're limited to only generating new code.)

* Old-school reflection

  Even in static languages like Java, it's possible even without annotations to use reflection to interrogate an instance of a type from one domain and sometimes implictly project it into the other domain. E.g. look at an instances `getXxx` methods and infer the entity's properties.

  The limitation here is that, given it's just reflection, you're limited to the information the reflection API gives you, which is obviously very implementation-oriented--everything is in terms of `Method`s and `Constructor`s, etc., instead of your persistence domain. So you may not have all of the metadata necessary to do the implicit mapping. (Granted, this is basically what annotations solve.)

* Code generation of types/metadata for one or multiple domains from a master data source.

  E.g. [Joist](http://joist.ws) generates both domain objects for the business domain plus metadata information for the persistence domain from a single data source, the application's relational database schema.

  This can work really well, and is probably my favorite approach, but takes some up-front investment to build.

  And you might run into limitations based on what information can be stored in your master schema (e.g. relational schemas can only handle simple constraints like required, max length, etc.).

* Runtime meta-programming in dynamic languages.

  Dynamic languages really shine here, and I think the ease of meta-programming has really helped their popularity. E.g. see how ActiveRecord leverages Ruby's runtime class modification to take a generic list of fields (from the persistence domain/schema) and project it into the business domain as getters/setters.

  I think the reason dynamic languages can map a single type into multiple domains so easily is that, for the most part, dynamic objects are just maps of properties, so each layer can add it's own magic to the instance however it wants. Couple this with the ability to use hooks like replacing methods with new implementations that do magic and then call the old ones, basically aspect-oriented programming, and you've got a pretty powerful way contort objects to your whim.

  ...if only that magic could be type checked. :-)

* Compile-time meta-programming in static languages.

  I.e. Scala macros FTW. I think there is a lot of promise in compile-time macros to handle maintaining types in separate domains. Unfortunately I don't have a lot of experience with this option yet, so we'll see how it goes.

Example: Rich Clients
---------------------

I've been mulling over this type abstraction problem within the context of client/server communication. E.g. between a AJAX client and the backend server.

I think it's fair to characterize the AJAX client as having application logic, and a place where you want an `Employee` type, `Employer` type, etc. But the serialization code to the server is very much infrastructure code, and not something you want to redo all of the time.

Since the AJAX client is rich, the application types are typically rich models, that fire events on property change, and all that fancy stuff. However, none of this richness should be serialized over the wire to the server, as it's meaningless to the server-side.

*And*, while I won't address it here, the server-side typically has it's own backend domain objects that it wants to map client requests to/from. So, for an entity Employee, you actually have a variety of layers involved: server-side peristence (e.g. to the database), server-side application, server-side serialization, client-side serialization, and finally client-side application. Fun!

So, ignoring the server-side issues, there are a few client-side approaches:

1. [AngularJS](http://angularjs.org) takes an interesting approach by avoiding the client-side serialization vs. model problem all together. Its models are the very same simple JavaScript objects that go to/from the server (assuming JSON).

   I'm not entirely sure how this scales up to creating/maintaining non-trivial application logic. You lose the ability to hang extra methods and rules off the model types (`Employee`/`Employer`/etc.) as they are basically just DTOs/JavaScript hash objects, so you have to maintain this logic someplace else. Which is less OO, I think, though not necessarily bad. I need to look into how they handle this more.

2. [Tessell](http://www.tessell.org) uses rich models that wrap simple JavaScript/DTO objects.

   Tessell's models wrap DTOs because, being GWT-based, even incoming/outgoing AJAX requests are typically represented using type-safe objects. If using GWT-RPC, this means both your server-side and client-side can reuse the same DTOs, which adds another safety blanket of cross-layer type checking to the application.

   However, it does mean maintaining types in two domains--an `EmployeeDto` (for the serialization domain) and an `EmployeeModel` (for the application domain).

   Thankfully [dtonator](http://github.com/stephenh/dtonator) provides some Tessell-specific code generation to minimize the DTO to-/from-model boilerplate. And, as a bonus, it also maps server-side domain objects onto the DTOs as well, so helps solve server-side cross-domain mapping as well.

3. More dynamic language magic? I have admittedly not looked into the implementation details of [Backbone](http://backbonejs.org) or [Knockout](http://knockoutjs.com), and how they map JSON to/from their models. From the examples I've seen, it seems suitably slick/magical, I'm just not sure how.

4. Ah, I almost forgot [Meteor](http://www.meteor.com/). Talk about magic. It takes the very provocative approach of reading that line where I listed all of the layers involved (multiple server-side domains, multiple client-side domains), and says "screw it", and basically just does all of that for you.

   On one hand, it seems very unique; on another, it seems vaguely familiar to what OO-databases might have tried to do back in the 90s (automatically distributed objects). But I have nothing against trying again, especially with today's technologies (databases, servers, browsers, etc.) all being that much more advanced.

   It will be interesting to see how Meteor plays out--it certainly seems to have the promise of drastically increasing developer productivity. 

Example: SQL
------------

SQL is a tangential example of application- vs. infrastructure-code. Well, primarily in the context of thinking about client-/server-communication (not in the implementation of the database itself).

While SQL the language has aspects of static typing (explicit tables, properties, etc.), the over-the-wire protocol itself is generic (just strings for commands and relations for results).

This lets the infrastructure code (JDBC drivers, etc.) be implemented just once and reused without any knowledge of the application domain.

Conclusion
----------

I've always had a special hate for boilerplate, but I don't think I'd explicitly organized my thinking around the concepts of the different domains in a codebase. Perhaps this seems silly, as N-layer/N-tier architectures are all that I've ever really worked in.

Regardless, having separate domains (application vs. infrastructure, etc.) within a code base is, in my opinion, key to scaling a non-trivial application.

The tricky part is maintaining the types, dependencies, and mappings between domains in an elegant fashion. There are various ways of doing this, but, AFAIK, no silver bullets. Good luck.


