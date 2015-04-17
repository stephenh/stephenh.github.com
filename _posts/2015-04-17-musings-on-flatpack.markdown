---
layout: post
title: Musings on Flatpack
---

{{page.title}}
==============

Lately I've been musing about the [Flatpack](https://github.com/perka/flatpack-java/wiki/WireFormat) entity/JSON serialization framework.

Flatpack's goal is to provide an entity-based JSON framework/format that can be used across multiple front-end clients, e.g. web/iOS/Android.

As a very large/up-front disclaimer, I've not actually used Flatpack, either on a real project, or even a prototype, but especially the wire format has piqued my interest in a few ways, such that I've been thinking about how I would approach/extend it if I was doing something similar.

(One last disclaimer, I had this post ~75% written for quite awhile and then stopped; I'm going to quickly wrap it up and push it out, but be kind.)

Flatpack Quick/Naive Overview
-----------------------------

Providing a cross-platform API is a fairly common goal these days, but there are a few things that make Flatpack's approach interesting:

1. It is entity-based.

   The usual suspects of Thrift/Protobuff/Avro/JSON/etc., while all built to be cross-platform as well, are lower-level than Flatpack; they are about defining raw messages, and message types, and letting each application define it's own protocol to use.

   This is quite fine, but a whole lot of applications do CRUD, e.g. entities (save employee, read employee, save employer, read employer, etc.), and so I think it's more natural to think of Flatpack sitting on top of the underlying message layer itself, which in this case is JSON, to provide common/reusable entity-based semantics.

   E.g. the same protocol (messages/message contents) could be used on another transport, e.g. Thrift/Protobuff, if applicable.

2. It uses a flat encoding.

   So, instead of an employer/employee being sent like:

       { employer: {
         name: "er1",
         employees: [
           { name: "ee1" },
           { name: "ee2" }
         ]
       }
   {: class="brush:jscript"}

   The employees are flattened out:

       { employer: [ { id: <uuid>, name: "er1" } ] },
       { employee: [ { name: "ee1", employerId: <uuid> }, },
                     { name: "ee2", employerId: <uuid> } ] }
   {: class="brush:jscript"}

   (Note that I'm using pseudo-JSON here; their actual JSON has more structure.)

   This does have a few wrinkles:

   * Because parent/child relationship cannot be expressed implicitly by nesting, objects must now refer to their parent by the parent's ID.

   * This insinuates (along with using UUIDs) clients assign IDs for new objects, which is fairly standard today (e.g. Asana's task ids are UUIDs).

   However, a weakness, IMO, of the nested approach is modeling it with objects in a client library, e.g.:

       // update an employee, makes sense...
       s.updateEmployee(Employee(
         id = ...,
         name = ...,
         salary = ...))

       // now update an employer:
       s.updateEmployer(Employer(
         id = ...,
         name = ...))

       // update employees nested in employer
       s.updateEmployer(Employer(
         id = ...,
         employees = Seq(
           // can we really set salary here? it's in the object...
           Employee(name = ..., salary = ...),
           Employee(name = ..., salary = ...)))
   {: class="brush:scala"}

   Notice how `Employee` is used both as a top-level entity, e.g. for `POST /employees`, and also nested within a `POST /employer` call.

   This is nice, in that you get to reuse the `Employee` class.

   However, the set of fields that `POST /employees` supports for employees and that `POST /employer` supports for *nested* employees is almost always different. E.g. if you use the "submit the Employee through the Employer", you can only use a subset of the fields, or on read only get a subset of the fields back.

   Which means to really model this correctly, you'd need like an "ErEmployee" type, and something ugly like:

       s.updateEmployer(Employer(
         id = ...,
         employees = Seq(
           // no salary field is available
           ErEmployee(name = ...),
           ErEmployee(name = ...)))
   {: class="brush:scala"}

   The idea being that `ErEmployee` would not have the `salary` method defined, as it's not supported for reading/updating through the `/employer` endpoint.

   This is the right thing to do, but ugly, and I believe in practice rarely done. Instead you just reuse the `Employee` type, because, hey, it's pretty close, and hope that clients don't try and set unsupported fields.

3. It uses very [normal-looking](https://github.com/perka/flatpack-java/blob/master/demo-server/src/main/java/com/getperka/flatpack/demo/server/DemoResource.java#L103) REST/Jersey endpoints:

       /**
        * Return the list of products.
        */
       @GET
       @Path("products")
       @FlatPackResponse({ List.class, Product.class })
       public List<Product> productsGet() {
         return db.get(Product.class);
       }
   {: class="brush:java"}

   That said, I'm a little curious how you specific the depth of the returned object graph.

   Notice how they're returning JPA entities (`Product` directly instead of `ProductDto`). This is great in terms of avoiding the usual nightmare of domain object/DTO translation, but it's curious then how to customize what does/does not get return from each endpoint.

   Ah, there is a [TraversalMode](https://github.com/perka/flatpack-java/blob/master/core/src/main/java/com/getperka/flatpack/TraversalMode.java), which I guess allows something like:

       @GET
       @Path("products")
       @FlatPackResponse(
         value = { List.class, Product.class },
         traversalMode = TraversalMode.DEEP)
       public List<Product> productsGet() {
         return db.get(Product.class);
       }
   {: class="brush:java"}

   You still need ability to control which fields to return (even just statically), and more fun things like access control, etc., all of which Flatpack handles, AFAICT, and I'm going to defer to their docs and avoid that tangent.

My Musings
----------

So, that is flatpack. It seems very reasonable. But it has some hints of things, such that I wonder about trying a few variations:

1. Use just one `/entities` end point.

   While REST is defacto endpoint-per-resource, I would like to try building a system that has one endpoint for entities. As I think a few nice things fall out:

   * You get cross-object transactions for free.

     With REST APIs, it's usually impossible to get atomic behavior of "create both of these objects as one unit of work".

   * You get an API that is inherently consistent.

     With large (or even small) REST APIs, where each entity is a different endpoint, it's very easy for conventions to unintentionally vary from endpoint to endpoint.

     Especially with the endpoints are being coded by hand, which is pretty much always the case (*cough* codegen *cough*), it's very easy for a programmer to slip in a slightly different input format, or output format, or error encoding, or "last modified" parameter name, etc.

     This may not seem like a big deal, but having written client-side wrappers for several REST APIs, it makes building abstractions a lot easier if each endpoint is as consistent as possible with the others.

     All that said, my musing is that if there is only one endpoint, `/entities`, then all entities should automatically/for-free use the same idioms/conventions as the others.

2. Standardize the entity/field to error message mapping

   Perhaps implementations of Flatpack already do this, as the errors section is already a map:

       errors : { "Some key" : "Some message" },
   {: class="brush:jscript"}

   But I would go further and suggest/document explicit keys, like:

   * `${entityId}.${fieldName}` for field-level errors
   * `${entity1d}` for entity-level errors

3. Use negative ids for new objects (yes, this sounds heretical, but hear me out)

   So far, I've yet to work on a system that needed/used UUIDs for primary keys. Note that I don't mean *no* systems should ever use UUIDs, I think they make a lot of sense if you need them, I'm just saying I personally haven't yet.

   And, admittedly perhaps just due to habit, I like/prefer integer primary keys, because pasting around "1" or "10456" when debugging tests/bugs/etc. is nicer than UUIDs.

   However, it does mean the server has to monotonically assign ids.

   For most applications that currently use client-assigned IDs/UUIDs, I assert their rationale is not actually a true distributed/client-to-client use case (like git), but most likely an offline/temporarily disconnected use case.

   If that is the case, it's not really that `client1` and `client2` both need to create unique/separate ids for new objects, because they might sync directly to each other, and then collide on their client-generated IDs. Instead, `client1` and `client2` will only ever interact through the server, so the server eventually acts as the mediator anyway, and we don't actually *require* globally-unique IDs.

   More specifically, if you have server-side storage for your entities (which most systems do), the offline problem can also be solved by partitioning your id space into client-controlled (and per-client, so collisions across clients are fine), and server-controlled (cross-client, so no collisions allowed).

   Splitting ids into negative/positive does this:

   * For new objects, each client makes a new negative id. Start at -1, then -2, etc.
   * On upload, the server recognizes any negative id object as new, saves it, and sends back the negative to positive id mapping (e.g. `Employee#-1` is now `Employee#1456`)
   * On response, the client updates their entities that had negative ids to use the new, server-assigned id

Cutting to the Chase
--------------------

Anyway, wrapping all of those musings up, here is what my protocol might look like.

A request, e.g. `POST /entities`:

    {
      entities : [ {
        id: -1, // new employee
        type: "employee",
        name: "Bob",
        employerId: 10 // fk to parent
      }, {
        id: 10, // existing employer
        type: "employer",
        ...
      }
{: class="brush:jscript"}

And a potential response:

    {
      // would only be returned if transaction committed
      idMappings: { "employee#-1": 5, "employer#-2", 6 }
      // object/field errors
      entityErrors: {
        "employee#-1.name": [ "Name is required" ],
        "employer#10": [ "Access is denied" ],
      },
      // misc errors
      otherErrors: [ "Something bad happened" ]
    }
{: class="brush:jscript"}

Admittedly, having `type: "employee"` is a little odd, so maybe separate collections per entity would be better, and the string-based `"employee#-1.name"` keys are a little odd, maybe having it be a dictionary of `type`, `id`, `field` would be better.

So, anyway, I won't claim this is new or amazing or perfect, but it's been floating in my head for awhile, and now I can finally finish this post and move on to something else.

(As a final musing, I forgot to mention that a lot of this might be re-inventing what other "sync entities across clients" frameworks like Firebase do, and so it would be worth examining/stealing from/just reusing their protocols, or even platforms, but I've not had a chance to do any investigation there.)

