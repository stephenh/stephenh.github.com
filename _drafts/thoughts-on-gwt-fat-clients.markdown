---
layout: post
title: Thoughts on GWT and DTOs
---

{{ page.title }}
================

One of the major bottlenecks for developing GWT webapps is mangling data around between the client and the server. Basically, creating/mapping DTOs all the time.

I've been thinking about how to best solve/optimize/avoid this problem. No breakthroughs yet, but here are my thoughts.

What's Painful
--------------

To see how DTOs affect the picture, let's go through a use case of displaying and saving an Employee object from a database.

In GWT, current best-practice is to use something like gwt-dispatch, and have:

1. Employee JPA/whatever object
2. EmployeeDTO
3. GetEmployeeDTOAction to request employees
4. GetEmployeeDTOResult to return employees
5. GetEmployeeDTOHandler to process server-side get logic:
  * lookup Employee given the GetEmployeeDTOAction
  * map Employee to EmployeeDTO
  * return a new GetEmployeeDTOResult
6. SaveEmployeeDTOAction to save employees
7. SaveEmployeeDTOResult to return the results of saving
8. SaveEmployeeDTOHandler to process server-side save logic:
  * lookup Employee given SaveEmployeeDTOAction
  * map EmployeeDTO back to Employee
  * return a new SaveEmployeeDTOResult with any errors

We've boilerplated 1 real entity class (Employee) into 8 classes playing various supporting roles. These supporting classes suck to maintain.

Traditional Web 1.x
-------------------

So, wait a sec. Let's step back. Webapps aren't supposed to be this hard, right? What does traditional Web 1.x look like?

1. Employee JPA/whatever object
2. EmployeeServlet/whatever rendering logic
  * Look up Employee given query string id
  * Map Employee into HTML
  * Map POST parameters into Employee

Why is this easier? Strings.

What about ORMs
---------------

    client <-- JSON/ORM --> server <-- SQL/ORM --> database

Client is not trustworthy:

* **The client cannot be responsible for deciding which data it reads or writes**
  * What type of entity (can access `employee` table, but not `system_info` table)
  * Which instance of an entity (can access your `employee` row, but not another `employee` row)
  * Which fields of an entity (can read your `employee.name` field, but not your `employee.will_be_fired_soon` field)
  * Depends on client identity (who are you)
  * Depends on temporal business state (what actions are allowed right now)

Ideal GWT DTO
-------------

* Server-side
  * `saveEmployeeDTO(EmployeeDTO)`, check who you are, rules, do mapping
  * `getEmployeeDTO(id)`, check who you are
* Client-side
  * `services.saveEmployeeDTO(dto).then(doThat)`

* Ungar/TradeCard, just made DTOs and fetched everything in the DTO
  * means you can't use 1 class/entity (ORM style), or you'll load everything, but it's a very declarative way to get what you want
  * doesn't have to be interfaces--just DTOs with fields? Annotate what should/should not get mapped?
  * declare type converters in package-level annotations?
  * what if operation only wants to save 3 fields, and client/model already has object with all 10 fields? get a subset DTO out of a model?
  * what if read operation wants to see 5 fields, but write operation only wants to change 1 field? can dto->entity be different than entity<-dto.
  * code splitting? keep DTOs from all going at once?
  * `EmployeeSummary[123]` implements EntityDto (employee#123)
    * `name`, `password` -- auto-mapped
    * Address -> EntityDto (address#234) -- auto-mapped
    * Or `address1` (flattened from Address)
    * `someAggregateField` -- ?

