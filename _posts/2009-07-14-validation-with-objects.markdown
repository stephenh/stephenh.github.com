---
layout: post
title: Validation with Objects Instead Of Annotations
---

Validation With Objects Instead Of Annotations
==============================================

Intro
-----

Annotations are really popular these days for marking up validation rules.

I'm forcing myself to go through a Seam tutorial, and their example is fairly representative:

    public class FooDomainObject {
        @NotNull @Length(max=100)
        public String getTitle() {
            return title;
        }
    }
{: class=brush:java}

I cringe every time I see this--annotations are not inherently bad, but I see the annotation-hammer as having replaced the XML-hammer is the Java world. Specifying validation rules as annotations has its strength, but also its weaknesses, which I think are not always evaluated.

I've had success with a pure-OO approach I'll describe here.

But first let's look at the annotations approach.

The Pros of Annotations
-----------------------

* You get to type-safely add rules on an attribute-by-attribute basis.

  This is of course the huge win over XML--you don't have to retype an attribute name in an XML file and brave typos due to repetition that is not compile-checked.

* Very clean, succinct declarations.

The Cons of Annotations
-----------------------

* Annotations are static--you have no way of adding/removes rules as needed.

  One app I worked on had non-trivial validation rules--they were closer to business constraints than low-level "not null" checks. Which was good because it kept the data sane and caught bugs before the Unit of Work was committed. But, real life being what it is, we needed to occasionally turn them off. Especially if we had legacy data that we knew wouldn't conform to the new business rules.

  Obviously you want disabling rules to be a very one-off thing--I'd be worried if it become habitual. But it is handy when needed.

* Annotations cannot cross multiple attributes--often times rules want to bind across multiple parameters (e.g. stop/end for date ranges).

* Annotations seem harder to customize--most frameworks seem to have boilerplate not null/column length rules, but the real power of validation is when you start adding business-specific rules. It is not incredibly clear to me whether the annotation-based validation frameworks allow easy addition of your own custom annotations.

A Java Alternative
------------------

I've had success with each domain object having its own list of `Rule` objects. Rules can be added/removed as needed, and, being just POJOs themselves, are easy to create your own, business-specific rules.

For type-safety, this approach leverages [bindgen](http://joist.ws/bindgen.html). Instead of bindgen, it can also work by passing OGNL expressions to the rules (instead of bindgen's `Binding` objects), but then you give up type-safety.

So, an example of a domain object would be:

    public class FooDomainObject extends BaseClassWithAddRulesEtc {
      public FooDomainObject() {
          this.addExtraRules();
      }

      private void addExtraRules() {
          FooDomainObjectBinding b = new FooDomainObjectBinding(this);
          this.addRule(new NotNullRule(b.title()));
          this.addRule(new SaneDateRule(b.start(), b.stop()));
      }

      // ... title, start, stop getters &amp; setters ...

      // ... in the base class:
      public ValidationErrors validate() {
          ValidationErrors errors = new ValidationErrors();
          for (Rule rule : this.getRules()) {
              rule.validate(errors, this);
          }
          return errors;
      }
    }
{: class=brush:java}

This first alternative has a few trade-offs:

* All rules are within the `addExtraRules` method instead of alongside their getter/setter.

* It is more verbose, having to repeat `b.title()` in the `addRule` clause. But this only gets really annoying if you need a `private static` reference to a rule for later removal.

* It is simpler from an implementation perspective--just iterating over rules and calling `validate`. Annotations usually involve non-trivial lookup/storage/etc. that means delegating to a heavier-weight framework to handle.

* Turning off rules requires promoting rules to a static field, as in this 2nd example:

      public class FooDomainObject {

          private static FooDomainObjectBinding b = new FooDomainObjectBinding();
          private static Rule titleNotNull = new NotNullRule(b.title());
          private static Rule saneDateRule = new SaneDateRule(b.start(), b.end());

          public FooDomainObject() {
              this.addExtraRules();
          }

          private void addExtraRules() {
              this.addRule(FooDomainObject.titleNotNull);
              this.addRule(FooDomainObject.saneDateRule);
          }

          public void disableTitleRule() {
              this.removeRule(FooDomainObject.titleNotNull);
          }

          // ... title, start, stop getters &amp; setters ...
      }

      // ... sometime later ...
      fooDomainObject.disableTitleRule();
  {: class=brush:java}

A variation of this theme would be to kill the `addExtraRules` and use a list utility in the declarations:

    public class FooDomainObject {

        private static FooDomainObjectBinding b = new FooDomainObjectBinding();
        private static DefaultRules rules = new DefaultRules();
        private static Rule titleNotNull = rules.ref(new NotNullRule(b.title()));
        private static Rule saneDateRule = rules.ref(new SaneDateRule(b.start(), b.end()));

        public FooDomainObject() {
            FooDomainObject.rules.copyTo(this);
        }

        public void disableTitleRule() {
            this.removeRule(FooDomainObject.titleNotNull);
        }

        // ... title, start, stop getters &amp; setters ...
    }

    // ... sometime later ...
    fooDomainObject.disableTitleRule();
{: class=brush:java}

This:

* Adds another static variable (`rules`)

* Makes the rule declaration longer as we pass the rule reference through the `ref` method to keep track of it 

But, nicely:

* Removes the `addExtraRules` and rules being referenced in multiple places

A Scala Alternative
-------------------

And, actually, since two-way binding is not required, Scala's call-by-name functionality would work here:

    class FooDomainObject {
      addRule(new NotNullRule(title))
   
      // ... title ...
    }
   
    class NotNullRule[T](value: => AnyRef) implements Rule[T] {
      def validate(T instance) = {
        if (value == null) {
          // ... add error ...
        }
      }
    }
{: class=brush:scala}

However, this has one major trade-off:

* Passing `title` as call-by-name only lets us get the value--both annotations and bindgen also allow access to the name of the property for inclusion in error messages (e.g. "title is required"--with call-by-name, you don't actually know it's called "title").

  I think having the attribute name is required, so we'd have to pass another string parameter:

      class FooDomainObject extends BaseClassWithAddRulesEtc {
        addRule(new NotNullRule("title", title))
      }
  {: class=brush:scala}

But, even then, that's pretty slick and lightweight. If scala's call-by-name had something like "set-by-name" to make it two-way, and perhaps throw in a `getName()` for good measure, it would easily trump the need for [bindgen](http://joist.ws/bindgen.html)-like hacks.

Wrapping Up
-----------

I've been coming around on annotations. But I do like to be contrary and just highlight that they are not the only solution for specifying business rules against domain objects. Having had the success with it in the past, I'm currently partial to staying with object-based approaches to validation rules.

