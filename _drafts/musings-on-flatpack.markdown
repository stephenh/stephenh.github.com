---
layout: draft
title: Musings on Flatpack
---

{{page.title}}
==============

Lately I've been musing about the [Flatpack](https://github.com/perka/flatpack-java/wiki/WireFormat) entity/JSON serialization framework.

Flatpack's goal is to provide an entity-based JSON framework/format that can be used across multiple front-end clients, e.g. web/iOS/Android.

As a very large/up-front disclaimer, I've not actually used Flatpack, either on a real project, or even a prototype, but especially the wire format has piqued my interest in a few ways, such that I've been thinking about how I would approach/extend it if I was doing something similar.

Flatpack Quick/Naive Overview
-----------------------------

Providing a cross-platform API is a fairly common goal these days, but there are a few things that make Flatpack's approach interesting:

1. It is entity-based.

   The usual suspects of Thrift/Protobuff/Avro/JSON/etc., while all built to be cross-platform as well, are lower-level than Flatpack; they are about defining raw messages, and message types, and letting each application define it's own protocol to use.

   This is quite fine, but a whole lot of applications do CRUD, e.g. entities (save employee, read employee, save employer, read employer, etc.), and so I think it's more natural to think of Flatpack sitting on top of the underlying message layer itself, which in this case is JSON, to provide common/reusable entity-based semantics.

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

My Musings
----------

So, that is flatpack. It seems very reasonable. But it has some hints of things, such that I wonder about trying a few variations:

1. Use just one `/entities` end point.

   While REST is defacto endpoint-per-resource, I would like to try building a system that has one endpoint for entities. As I think a few nice things fall out:

   * You get cross-object transactions for free.

     With REST APIs, it's usually impossible to get atomic behavior of "create both of these objects as one unit of work".

   * You get an API that is inherently consistent.

     With large REST APIs, it's very easy for conventions to vary from endpoint to endpoint.

     Especially with the endpoints are being coded by hand, which is pretty much always the case, it's very easy for a programmer to split in a slightly different input format, or output format, or error encoding, or "last modified" parameter name, etc.

     However, if there is only one endpoint, `/entities`, then everyone entity will always come back with the same idioms/conventions as the others, because it should be using the same code path as all the others.

