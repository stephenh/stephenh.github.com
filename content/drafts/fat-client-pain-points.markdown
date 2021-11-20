---
layout: draft
title: Fat Client Pain Points
---

I've had a lot of experience with fat-client (AJAX) applications lately. Here are a few thoughts.

Note: A lot of my comments use static typing (e.g. `String getName()`), but the notions often (though not necessarily always) apply to dynamic languages as well, as the typing would be the same, just dynamic and implicit instead of static.

As full disclosure, this comes from nearly all of my work being in [GWT](http://www.gwt-project.org)/[Tessell](http://www.tessell.org), but I believe most of these points are salient to fat-client architecture in general. Where not, I try to include an "Other" option that mentions the point is not applicable to more dynamic approaches.

Endpoint per Entity?
--------------------

Since you're generally not going to expose your database's SQL connection to the world, fat-clients end up needing endpoints that add some safety + business logic.

So, what does that look like:

1. Hand-written endpoint for each CRUD operation

   * Pro: Very flexible, e.g. can return custom/N depth object graphs
   * Con: Gets tedious
   * Con: Easy for endpoints to not be perfectly consistent, which makes client library development more painful.

2. Generated endpoints for CRUD operations

   * Pro: Automatic
   * Con: Need place to add business + access logic. Validation rules can live in the domain objects, what about access logic? Read/write? Per object? Per field?

How to Return Object Graphs
---------------------------

Often times a UI screen will want a parent entity + summary of the child entities. So, what does that look like:

1. N+1 AJAX calls? 1 for the parent, plus N for each child?

   * Pro: This fits naturally with generated endpoints, but sucks performance/UX wise

2. Use a client-specific parameter to determine the depth of objects returned?

   * Pro: Extremely flexible to clients
   * Con: Need to limit depth, still enforce access rules
   * Con: Makes type-safe API harder (e.g. the `/employer` endpoint will return an `Employer`, and sometimes `.employees` is filled, sometimes it is not, depends on the query param you sent in
   * Con: Difficult to implement, especially to translate the filter/projection into an efficient native query for your backend database

How to Model Both Entities and Operations?
------------------------------------------

Probably 90% of a fat-client API is related to CRUD entity operations--save employer, get employer, etc. But there are also 10% of the operations that are completely one-off, like log me in, or fetch my settings.

This is basically not a problem if you're hand-coding endpoints, but if you're attempting to generate endpoints (and even an API/endpoint schema) from some upstream schema (e.g. your database/domain objects), then you'll need a way to include "other" endpoints and operations that are not merely CRUD.

How to Map DTOs to Domain Objects
---------------------------------

Typically on the server-side, an endpoint's input and output are modeled as DTOs. How are those DTOs handled, e.g. mapped to/from domain objects?

1. By hand
   * Pro: Simple
   * Con: Tedious, as each entity, for each property, you end up with `dto.getXxx` lines for `GET` calls and `dto.setXxx` lines for `PUT`/`POST` calls
2. Using a mapping framework
   * Pro: Not tedious, more automatic
   * Con: Most mapping frameworks suck
     * Note that [AutoMapper](https://github.com/AutoMapper/AutoMapper) and [dtonator](http://www.dtonator.org/) probably don't.
3. Not at all, e.g. by using a document store that natively stores your wire format (JSON)
   * Pro: Extremely simple
   * Con: Harder to enforce constraints/validation rules (required fields, lengths, limit  acceptable object graph, etc.)
   * Con: Very little/no schema enforcement, instead moving the burden to clients to handle

How to Map DTOs to Client Objects
---------------------------------

Similarly, the fat-client will often get DTOs from the server (via a serialization library). It can then either:

1. Use the DTOs directly, e.g. `uiControl.set(dto.getName())`, then later when name changes, `dto.setName(uiControl.get())`
   * Pro: Simple.
   * Con: DTOs only contain primitives (Strings, Ints, etc.), so have no places for other state (validation rules, observers, etc.) which are typically used for data binding in rich UIs 
   * Con: Lends itself towards multiple get/set lines per property (e.g. no binding), which is tedious
2. Wrap the DTOs into models (e.g. while a DTO would have a primitive `String getName()`, a model would have a property `Property<String> name()`)
   * Pro: Models can have more UI-specific state, rules, logic, etc.
   * Pro: Pulls business logic out of controllers and into models
   * Con: Writing models can be tedious
3. Ignore DTOs all together (e.g. just use JSON data structures)
   * Pro: Simple.
   * Con: Also doesn't integrate well in most rich UI frameworks
     * Except for Angular, which can detect changes in otherwise "just some primitives" DTOs. This doesn't include validation rules and other business logic, which must go back to the controller, but it does mean no dichotomy between DTOs and models.

How to Handle Entities Across Backends?
---------------------------------------

Sure, in an ideal system, all/the majority of your entities are in 1 database. Then life is easy.

But often times 90% of the entities are in 1 database, but a few others come from other databases/services. How do you integrate those?

If you have CRUD endpoints that are generated, does your code generator know about both backends? Does it pull the schema from each one automatically? Or is there an intermediate schema that unifies them?

Or do you just code all the end points by hand?

Do You Accept Partial Updates?
------------------------------

Partial updates are updating just a few properties on an entity, instead of every property, each time you update. So, do:

1. Yes, accept partial updates
   * Pro: Reduces likelyhood of write conflicts (stale properties)
   * Con: Makes type-safe DTOs more complex (e.g. `EmployerDto` needs a `name: Option[String]` instead of just `name: String`, so that when `name` is `None`, the client serialization library knows to not include `name` in the partial update.
2. No, just take all properties every time
   * Pro: It's easier.
   * Con: Wastes bandwidth, but seems neglible.
   * Con: Is harder for programs to automate (any `PUT` needs all the properties, instead of just the one the program is updating)

Do You Accept Bulk Updates?
---------------------------

Let's say a client wants to update 10 entities, is that 10 `PUT`s? Or just 1?

1. Yes, accept bulk updates
   * Pro: Clients can do cross-entity updates that might otherwise break business rules
   * Pro: Less wire calls
   * Con: Not REST-ful, as you need a single `/update` endpoint that can accept each entity type.
   * Con: Hard to handle cross-backend entities
2. No, avoid bulk updates
   * Pro: Simplicity
   * Pro: REST-ful

Can a Parent Endpoint Also Update Its Children
----------------------------------------------

If you have a `/parent` endpoint, and `GET` returns some summary information about the parent's children (see How to Return Object Graphs), can the client also send updates for these children?

1. Yes, accept child updates
   * asdf
2. No, do not accept child updates
   * Con: `GET` and `PUT` now have different signatures; the `Parent` type returned by `GET` has a `List<Children>`, but if the client makes changes to the children, `PUT` will ignore them. This violates surprising, so either:
     * `PUT` should take a separate type, like `ParentForPut` with no children (ugh), or
     * `GET` should return a `List<ChildrenSummary>`, where `ChildrenSummary` is immutable (which is also ugh if you have logic that wants to deal with real `Children` types and `ChildrenSummary` types generically (assuming they have the same subset of properties).

Duplication of Rules Across Fat-/Server-side Entities
-----------------------------------------------------

One of the benefits of a fat-client is running as many validation rules as possible locally, to give the user immediate feedback on their input.

However, this means a lot of trivial rules (required, max length, date ranges, unique names, etc.) must be coded on the client.

But you must also code on the server, to protect against malicious clients that try to skip applying the rules.

There are also certain validation rules that, due to requiring server-side resources the client does not have access to (like the database/etc.), can only run on the server.

So, what do you do?

* Try and share code across the client/server?
  * Pro: Only code the rules once
  * Con: Involves complex solutions like to fool server-side into not running on the client-side
  * Con: Server-side access patterns (lazy-loading ORMs) typically just don't work on the client-side
* Generate client/server entities from the same (database) schema?
  * Pro: Can pick out the most common rules (required, max length)
  * Con: What about the others?
  * Con: What about multiple backends/schemas?
* Generate client entities from the domain entities?
  * Pro: Could potentially look for, say, annotations like `@Required`, etc. and so also pick up `@YourCustomRule`.
  * Con: Still sounds complex
* Just duplicate the client-side rules by hand
  * Pro: Easy
  * Con: Tedious and error prone

Serialization of Validation Errors Between Fat-/Server-side Entities
--------------------------------------------------------------------

Invariably there are validation errors that can only run on the server side. What do you do?

* Return very generic "the entire `PUT` failed because of "xyz" errors?
  * Pro: Simple
  * Con: Cannot be tied back to a specific entity/specific property, so the UI can not display the error in exactly the right place
* Return entity/property-specific errors, e.g. `employer#1/name: invalid`
  * Pro: A nicer UI experience
  * Con: Harder to implement, as your domain errors need mapped back to the `PUT` resposne
  * Con: Most fat-client UIs are probably not sophisticated enough to use this anyway
  * Con: May not map well to non-entity operations

Do You Provide Out-of-the-box Client Libraries
----------------------------------------------

For anything but trivial tasks, most clients will end up wrapping the service with their own abstracts (interfaces, DTOs, etc.). Well, unless they are JavaScript clients.

There are a few options here:

* Use a schema of your service to generate clients in various languages
  * Pro: Automation is great.
  * Con: Generators may not follow each language's idioms
* Provide no client libraries
  * Pro: Easy for the service-providers
  * Con: Harder for the clients
  * Con: Each client ends up re-inventing their own abstraction, of varying quality
* Provide hand-written client libraries
  * Pro: Can best fit the idioms of each client language
  * Con: Tedious, client libraries quickly fall behind
* If using the same basic language on both sides (say Java/Swing, Java/GWT, or Node.js/JS), do you reuse the DTOs (except JS, which would not have DTOs)?
  * Pro: One set of canonical DTOs
  * Con: Can be tricky to find separate server-side/client-side serialization libraries that understand the same metadata (annotations/etc.)
  * Con: Makes clients in any other language a 2nd class citizen

Do You Implement Your Service Code-First or Schema-First?
---------------------------------------------------------

Some REST/web service frameworks allow you to write code, then they'll reflect against the code to build any schemas (e.g. for SOAP). Others will have to write the schema first, and then generate/load code bases on that. Which is better?

* Code-first
  * Pro: Quick to get going, just program in your language of choice
  * Con: Hard to notice breaking changes across releases
  * Con: Generated schema (if you're using one) is usually not very pretty, and leaks details of your framework/language, making consumption by other languages more awkward
  * Con: The "shema is the code" makes it hard to drive other code generation processes (e.g. for client libraries)
* Hand-written schema-first
  * Pro: Changes in the contract are more explicit
  * Pro: The schema is maintained as a first-class citizen, so usually cleaner than a generated one
  * Con: Schemas are a bad word, due to SOAP, no real standard for modern services
  * Con: Maintaining this by hand is often duplicating entity/property information that is available in your primary database schema or your domain objects
* Non-code-but-still-generated schema-first--if you have your entity schema in, say, a database, it's tempting to think about generating a service schema from that
  * Pro: Very little boilerplate
  * Con: Hard to implement without assuming a single upstream database (see How to handle entities across backends)
* Don't bother with a schema
  * Pro: This is what everyone else does these days
  * Con: Type-safety and code generation fans (i.e. me) really like schemas
  * Con: Hard to see/enforce uniformity across endpoints, leading to surprising/one-off behavior to clients

How Does the Client Model Server Calls?
---------------------------------------

How does the fat-client codebase know it's communication with the server? There are a few options:

* Submit raw requests, e.g. with `.ajax`
  * Pro: Simple
  * Con: Coupling directly to the wire makes unit testing hard
* Command pattern, e.g. `server.do(GetEmployer(1), callback`)
  * Pro: DTOs for input/output allow the client code to be decoupled from serialization issues, making testing easier
  * Pro: Easy to write generic abstractions are "command X was submitted", e.g. counting outstanding requests, handling errors generically, etc.
  * Con: Writing input/output DTOs is tedious; generating them requires a schema
* Async method calls, e.g. `server.getEmployer(1, callback)`
  * Pro: Method calls look very natural
  * Con: With many end points, `server.<auto complete>` will grow large
* The client code is oblivious, e.g. it "saves" data locally, and it is async sent to the server
  * Pro: Client-code can look really simple
  * Con: Requires a sophisicated framework to handle the async logic
  * Con: Usually assumes a single/dumb backend (depending on whether the async logic translates changes into `PUT`/`POST` calls, or if it speaks a different/async-specifc protocol)
  * Con: Async is harder to reason about, e.g. if the server-side has validation errors, when do they show up? Works better if the server-side is (relatively) dumb, and all validation is done client-side.

What Does the Client Do While Data Is Loading?
----------------------------------------------

Show empty form fields? Disabled form fields? Hide the form fields?

What Does the Client Do While Data Is Saving?
---------------------------------------------

Allow the user to keep editing? Might confuse user that they think their post-submission changes were included in the last save.

Disable form fields while submitting? Show a spinner?

How Does the Server Model Calls?
--------------------------------

If you're implementing an endpoint, what does that code look like?

* Sinatra style, all routes/logic in one file
  * Pro: Really simple, great 
  * Con: Doesn't scale to many end points
* One file per endpoint, e.g. `GetEmployerEndPoint`
  * Pro: Scales to many end points well
  * Con: Can get tedious to write 1 CRUD end point per entity (could generate these end points, and allow other hand-written ones as well)


How Do You Treat Illegal Errors vs. Validation Errors?
------------------------------------------------------

On the server-side:

* Some errors on the server-side should be shown to the user (typically validation errors), and so not really an "exceptional" response. Just an "invalid" response.

* Others errors are exceptional, e.g. invalid access or nonsensical input/data, that warrants a more restrained (e.g. no leaking of internal implementation details) response.

Similarly on the client-side:

* Validation errors should not lead to the client "blowing up"
* Illegal errors probably should lead to the client "blowing up" and asking the user to reload.

How Do You Handle Deployments?
------------------------------

If you have `Z` servers deployed, and `O` have old code (e.g. serving old JS, and expecting old input/output) and `N` have new code (e.g. serving new JS, and expecting new input/output), how will that work?

* What happens when a client with `O` code sends a request to an `N` server?
* What happens when a client with `N` code sends a request to an `O` server?
* If your fat-client loads code dynamically, what happens when some `N` code tries to lazy load from an `O` server?

There are a few ways of handling this:

* Have a version-aware/sticky proxy server that ensures clients go to the servers of the same version
  * Pro: Minimizes `O`/`N` conflicts
  * Con: Requires a complex/stateful proxy
  * Con: Does not guarantee them (e.g. after all `O` servers are shutdown), so your code still has to handle the boundary cases anyway
* Do you cut over from `O` servers to `N` servers right away?
  * This means only the `O` sent to `N` case happens
* Do you phase servers out, and have `O` and `N` briefly simultaneously availabile
  * This means either `O` sent to `N` or `N` sent to `O` can happen

Generally the safest thing is to detect any of these, and ask the client to reload (assuming it's a web application). But if you're window of having a mixed `O`/`N` environment is very large, this can lead to a lot of prompts.

Ideally you could only prompt for reload when an incompatible service exception occurs. This would require either explicit or implicit per-endpoint versioning (instead of per-release version, as per-release versioning would lead to too many prompts).

Fuck It, Build a Web 1.0 App
----------------------------

A Web 1.0 architecture is interesting. The main differences are:

1. The wire calls are basically "HTML out", "maps of forms parameters in"
   * Pro: This is incredibly generic, such that the "schema" of what operations the web application supports is entirely implicit
   * Con: Automation is hard, as it involves screenscaping, for which there is no explicit schema
2. The application is split into "server-side client logic" and "client-side client logic" 
   * E.g. templates are rendered on the server, but then JavaScript must munged things on the client
     * Tangentially, this is why jQuery was successful; Web 1.5 apps were "get a shit load of HTML from the server, then tease it apart with selects". For Web 2.0 apps (or 2.5 apps, e.g. apps built with rich UI frameworks), they often have pointers directly to HTML elements, so need less selectors. Or at least selectors applied at much smaller scopes.
   * Con: If any client-side interactivity is expected, updating the UI either involves duplicating the rendering logic on the client, or re-fetching that section from the server (e.g. RJS, which was actually pretty cute).
   * Con: The client-side has basically no data structures (other than DOM nodes picked from the bag of HTML) to program against, so quickly becomes coupled to the DOM and so untestable




