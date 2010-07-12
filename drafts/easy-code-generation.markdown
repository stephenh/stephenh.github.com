---
layout: post
title: Easy Code Generation
---

Easy Code Generation
====================

I'm a big fan of code generation (see [joist](http://joist.ws), [gwt-mpv-apt](http://gwtmpv.org/apt.html), [gwt-mpv](http://gwtmpv.org/viewgeneration.html), [interfacegen](http://github.com/stephenh/interfacegen). I think active code generation can go a long way towards reducing boilerplate in a project.

Code Generation's Bad Reputation
--------------------------------

Code generation often gets a bad wrap, especially in the Java community, where most projects have long preferred runtime byte code generation.

I will readily admit that most of code generation's reputation is well-deserved, as done incorrectly it can be ugly and painful.

For example, this snippet from the Torque ORM's templates:

Or this example whatever:

However, a few misapplications does not mean the entire approach is flawed. Code generation can be done well.

Good Code Generation
--------------------

Good code generation should strive for:

1. Easy to read output

   Even though it is generated, developers will inevitably look at the artifacts that code generation produces during the course of programming/debugging/etc. Opening up generated files should not cause their eyes to burn.
   
   Generated output should have good formating, no warnings, and be generally as hand-written as possible. This will gradually reduce the "oh god no generated code" feeling that most developers understandably have picked up.

2. Easy to read templates

   Just like any code developers write, code generation templates will have to be maintained. They should be easy to read, refactor, and test.

3. Abstraction in the templates

   Part of having easy to read templates is being able to apply abstraction.
   
   The previously cited Torque code snippet suffered from this: the template was a single pass "all decisions must be made inline and linearly". While I'm normally a huge fan of Velocity, it purposefully works best on simple templates--too much complexity and things can get ugly.

4. Very little logic in the generated output

   Code generation works best to flush out simple scaffolding. Not Rails-style throw-away scaffolding, but active scaffolding that can be rerun as needed but is simple nonetheless.

   The basic getters/setters/collections for an ORM a great example. Where logic will be needed, provide hooks for the developer to add in.

`sourcegen`
-----------

Over the last few years, I've embodied these principles into a Java code generation library called, imaginatively, `sourcegen`. It is currently hidden away in the [joist-util](http://joist.ws) subproject, but is likely worth promoting to its own project.

The idea behind `sourcegen` is to break out of Velocity-style templates and apply some abstraction:

* Any program generating Java code is going to have to output the `public class Xxx extends Yyy implements Zzz` incantation. Each template should not have to re-encode the logic of "if there is an interface, add `<space>extends<space>joinWithCommas(interfaceNames)`.

  Implementing an interface is a simple declaration:

      outputClass.implementsInterface(List.class);
  {: class=brush:java}

  `sourcegen` will then output the class declaration boilerplate:

      import java.util.List;

      public class Foo implements List {
      }
  {: class=brush:java}

* Any program generating Java code is going to do a lot with fields and methods. Each template should not have to worry about grouping them or putting the right amount of new lines between them.

      outputClass.addField("foo").type(String.class);
      outputClass.addMethod("getFoo").returnType(String.class).body.line("return foo;");
  {: class=brush:java}

  Would result in:

      public class Foo {
        private String foo; // private by default

        public String getFoo() {
          return foo;
        }
      }
  {: class=brush:java}

* Any program generating Java code is going to have to handle imports. Instead of pessimistically including any possible import a template might need at the start of the file (e.g. single pass, and resulting in a slew of detested "Unused import" warnings), a program should be able to say half-way through the file "btw, I need `foo.bar.Zaz` imported".

      // we've already added methods/fields/etc. to outputClass
      // but now we hit a conditional and need Zaz as well
      outputClass.addImports(Zaz.class);
  {: class=brush:java}

  (`sourcegen` actually goes further and implements auto-import--if you add a field of type `foo.bar.Zaz`, `sourcegen` will change the type to just `Zaz` in the output if a) you are already in the `foo.bar` package or b) the `Zaz` class does not clash with an existing import)

With this internal DSL in place, code generation can now read like regular programs. For example, this snippet from joist's getter/setter/collection generation:

    public void pass(Codegen codegen) {
      // Entity is a DTO for the domain object information sucked in from the schema
      for (Entity entity : codegen.getEntities().values()) {
          if (entity.isCodeEntity()) {
             continue;
          }

          // domainCodegen is the base class where we put all the
          // getters and setters, e.g. entity Employee will get
          // EmployeeCodegen. Real hand-written code can then go
          // in the Employee class, which extends EmployeeCodegen.
          GClass domainCodegen = codegen.getOutputCodegenDirectory().getClass(entity.getFullCodegenClassName());
          domainCodegen.setAbstract();
          domainCodegen.baseClassName(entity.getParentClassName());

          domainCodegen.getConstructor().setProtected().body.line("this.addExtraRules();");
          domainCodegen.getMethod("addExtraRules").setPrivate();

          this.addQueries(domainCodegen, entity);
          this.primitiveProperties(domainCodegen, entity);
          this.manyToOneProperties(domainCodegen, entity);
          this.oneToManyProperties(domainCodegen, entity);
          this.manyToManyProperties(domainCodegen, entity);
          this.changed(domainCodegen, entity);
          this.clearAssociations(domainCodegen, entity);
        }
    }
  {: class=brush:java}




