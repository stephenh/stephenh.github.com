---
layout: post
title: Code Generation Is Not Evil
---

Code Generation Is Not Evil
===========================

I'm a big fan of code generation (see [joist](http://joist.ws/orm.html), [bindgen](http://bindgen.org), [Tessell](http://www.tessell.org/viewgeneration.html), and [interfacegen](http://github.com/stephenh/interfacegen). I think active code generation can go a long way towards reducing boilerplate in a project.

Bad Reputation
--------------

However, it seems like code generation has a bad reputation these days. Especially in the Java community, most projects ([Hibernate](http://www.hibernate.org), etc.) have long preferred runtime byte code generation.

I will readily admit that most of code generation's reputation is well-deserved, as done incorrectly it can be ugly and painful.

For example, this snippet from the [Torque's](http://db.apache.org/torque) ORM [templates](http://svn.apache.org/viewvc/db/torque/templates/trunk/src/templates/om/bean/Bean.vm?revision=524492&view=markup):

    #if ($objectIsCaching)
      #foreach ($fk in $table.Referrers)
        #set ( $tblFK = $fk.Table )
        #if ( !($tblFK.Name.equals($table.Name)) )
          #set ( $className = $tblFK.JavaName )
          #set ( $relatedByCol = "" )
          #foreach ($columnName in $fk.LocalColumns)
            #set ( $column = $tblFK.getColumn($columnName) )
            #if ($column.isMultipleFK())
              #set ($relatedByCol= "$relatedByCol$column.JavaName")
            #end
          #end

          #if ($relatedByCol == "")
            #set ( $relCol = "${className}${beanSuffix}s" )
          #else
            #set ( $relCol= "${className}${beanSuffix}sRelatedBy$relatedByCol" )
          #end
          #set ( $collName = "coll$relCol" )

      protected List#if($enableJava5Features)<${className}${beanSuffix}>#end $collName;

      public List#if($enableJava5Features)<${className}${beanSuffix}>#end get${relCol}()
      {
          return $collName;
      }

      public void set${relCol}(List#if($enableJava5Features)<${className}${beanSuffix}>#end list)
      {
          if (list == null)
          {
              $collName = null;
          }
          else
          {
              $collName = new ArrayList#if($enableJava5Features)<${className}${beanSuffix}>#end(list);
          }
      }

      #end
    #end
{: class=brush:java}

Complex templates like this make both the initial development and long-term maintenance of code generators painful.

Another example is this generated output from [GXP](http://code.google.com/p/gxp/):

    package com.bizo.selfservice.services.email.templates;

    import com.google.gxp.base.*; // causes unused warning
    import com.google.gxp.css.*; // causes unused warning
    import com.google.gxp.html.*; // causes unused warning
    import com.google.gxp.js.*; // causes unused warning
    import com.google.gxp.text.*; // causes unused warning

    public class FooEmail extends com.google.gxp.base.GxpTemplate {

      private static final String GXP$MESSAGE_SOURCE = "com.foo.templates"; // causes unused warning

      public static void write(final java.lang.Appendable gxp$out, final com.google.gxp.base.GxpContext gxp_context) throws java.io.IOException {
        final java.util.Locale gxp_locale = gxp_context.getLocale(); // caused unused warning
        // ...more generated output...
      }
{: class=brush:java}

Ugly, warning-filled output makes developers turn up their noses when they invariably glance at the generated output as they use it.

I don't mean to pick on either project--Torque was awesome for its time, and I really like the idea of GXP. But neither necessarily endears users to code generation.

However, that does not mean the entire approach is flawed. With some effort and good techniques, code generation can be done well.

Benefits
--------

Code generation has several benefits, for example making a program faster at runtime by performing logic at build-time, which projects like [GWT](http://code.google.com/webtoolkit) excel at.

However, the biggest benefit from my perspective is that code generation excels at producing in-language abstractions (e.g. Java classes) from external primary source artifacts (e.g. some XML, a spec, etc.). Done well, it is a great way to percolate knowledge from source artifacts throughout the rest of your project [without manual drudergy](http://www.c2.com/cgi/wiki?DontRepeatYourself).

This is by no means a new idea--the first I'd read of it was in [The Pragmatic Programmer](http://www.pragprog.com/the-pragmatic-programmer), and that is probably just because I'm not old enough to have read about it in anything else.

This percolation becomes extra nice in IDEs like Eclipse/IntelliJ/etc., which see the build-time output of code generation. The IDE's type-awareness can then guide the programmer while programming code that interacts with the external resources.

Good examples of this are [joist](http://joist.ws/orm.html) making types that the mirror database schema so developers can write type-safe queries:

    public Child findByName(String name) {  
      // the ChildAlias class is generated and contains fields (c.name)
      // for each column in the db. If the db changes, the fields change,
      // and this query would no longer compile
      ChildAlias c = new ChildAlias("c");  
      return Select.from(c).where(c.name.equals(name)).unique();  
    }  
{: class=brush:java}

Or [Tessell](http://www.tessell.org/viewgeneration.html) making boilerplate Java classes based on HTML-like XML UI templates:

    <ui:UiBinder ...>
      <gwt:HTMLPanel>
        <h2 ui:field="heading">Client</h2>
        <gwt:TextBox ui:field="name"/><br/>
        <gwt:TextBox ui:field="description"/>
        <div><gwt:SubmitButton ui:field="submit" text="Submit"/></div>
      </gwt:HTMLPanel>
    </ui:UiBinder>
{: class=brush:xml}

That is turned into, among other things, an interface for the developer to code against:

    public interface IsClientView {
      IsElement heading();
      IsTextBox name();
      IsTextBox description();
      IsSubmitButton submit();
    }
{: class=brush:java}

Or any of the SOAP/RPC projects like [Axis](http://ws.apache.org/axis/), [Thrift](http://incubator.apache.org/thrift/), or [protobuf](http://code.google.com/p/protobuf/) creating in-language DTOs for cross-process communications.

In all of these instances, the main goal of code generation is to cater to a static-typing bigot's preference for a compile-time sanity check, while avoiding the manual grunt work of copy/pasting non-Java-source artifacts (database schemas, XML documents) into their equivalent Java-source form.

Done Well
---------

To get the benefits of code generation without the flaws that led to its reputation, I think good code generation should strive for:

1. Be [active](http://c2.com/cgi/wiki?ActiveCodeGeneration)

   Whatever a code generator's source artifact is (XML, a schema, etc.), it is pretty much guaranteed to change during the course of a project. When it does, updating the originally generated output should not be a manual process, which is tedious and error prone. Simply re-running the code generator should be quick, simple, and not overwrite any existing custom code that has been written.

   Active code generators can be especially cool when run automatically by IDEs. For example, in Eclipse both [Java annotation processors](http://download.oracle.com/docs/cd/E17476_01/javase/1.5.0/docs/guide/apt/GettingStarted.html) and [Spring Roo](http://www.springsource.org/roo) will run as soon as a programmer hits Save. The updated output is recognized within seconds and any new artifacts/compile-time errors are immediately available to the developer.

2. Easy to read output

   Even though it is generated, developers will inevitably look at the artifacts that code generation produces during the course of programming/debugging/etc. Opening up generated files should not cause their eyes to burn.
   
   Generated output should have good formating, no warnings, and be generally as hand-written as possible. This will gradually reduce the "oh god no generated code" feeling that most developers have picked up.

3. Easy to read templates

   Just like any code that developers write, code generation templates will have to be maintained. They should be easy to read, refactor, and test.

4. Abstraction in the templates

   Part of having easy to read templates is being able to apply abstraction.
   
   The previously cited Torque code snippet suffered from this: the template was a single pass "all decisions must be made inline and linearly". While I'm normally a huge fan of Velocity, it purposefully works best on simple templates--too much complexity and things can get ugly.

5. Very little logic in the generated output

   In my experience, code generation works best to flush out simple scaffolding. Not Rails-style throw-away/[passive](http://c2.com/cgi/wiki?PassiveCodeGeneration) scaffolding, but active scaffolding that can be rerun as needed but is simple nonetheless.

   The basic getters/setters/collections for an ORM a great example. Anything more complex than, say, a `not null` check should be left to the programmer to write via a hook. This keeps the code generation logic from getting out of hand and overly complex.

`sourcegen`
-----------

Over the last few years, I've embodied/stumbled upon these principles while working on a Java code generation library called, imaginatively, `sourcegen`. It is currently hidden away in the [joist-util](http://joist.ws) subproject, but is likely worth promoting to its own project.

The idea behind `sourcegen` is to break away from Velocity-style templates and apply some abstraction. Such as:

* Any program generating Java code is going to have declare classes, fields, and methods. These should be easy to add these without worrying about boilerplate grouping, spacing, indentation, new lines, etc.

  For example, implementing an interface with some methods is done via simple, DSL-ish calls:

      outputClass.implementsInterface(List.class);

      outputClass.addField("foo").type(String.class);
      outputClass.addMethod("getFoo").returnType(String.class).body.line("return foo;");

      outputClass.addField("bar").type(Integer.class);
      outputClass.addMethod("getBar").returnType(Integer.class).body.line("return bar;");
  {: class=brush:java}

  `sourcegen` will then output the class declaration boilerplate:

      import java.util.List;

      public class Foo implements List {
        private String foo; // private by default
        private Integer bar;

        public String getFoo() {
          return foo;
        }

        public Integer getBar() {
          return bar;
        }
      }
  {: class=brush:java}

* Any program generating Java code is going to have to handle imports. Instead of pessimistically including any possible import a template might need at the start of the file (e.g. single pass, and resulting in a slew of detested "Unused import" warnings), a program should be able to say half-way through the file "btw, I need `foo.bar.Zaz` imported".

      // we've already added methods/fields/etc. to outputClass
      // but now we hit a conditional and need Zaz as well
      outputClass.addImports(Zaz.class);
  {: class=brush:java}

  (`sourcegen` actually goes further and implements auto-import--if you add a field of type `foo.bar.Zaz`, `sourcegen` will change the type to just `Zaz` in the output if a) you are already in the `foo.bar` package or b) the `Zaz` class does not clash with an existing import.)

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

Now instead of one huge template, code generation can be broken into discrete chunks, e.g. `this.manyToOneProperties`, and at the end all of the classes/methods/fields can be output at once via a single `toCode()` call.

When Applicable
---------------

Of course, code generation is like any other technique--it is not always applicable and will be painful if misused in a situation where it doesn't make sense.

But, if you do have an appropriate situation, and can hopefully follow a good approach, code generation can be a powerful approach to building well-designed, easy-to-maintain systems.

