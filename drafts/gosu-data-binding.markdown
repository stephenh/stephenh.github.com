---
layout: default
title: Gosu has First Class Data Binding
---

{{page.title}}
==============

[Gosu](http://www.gosu-lang.org) 0.8 was recently released, with an incredibly
exciting new feature: feature literals, or, to me, first class data binding.

Briefly, data binding is declaratively setting up relationships between two objects (see [here](here.html) for more details).

This data binding is quite common in UI code, where two-way "when model X changes, update view Y, and when view Y changes, update model X" relationships are setup.

Without data binding, UI code can quickly become a mess of boilerplate inner classes that react to each individual UI event and shunt the view's data back into the model object.

In Java
-------

Earlier, I wrote (though did not publish) a data binding review for various approaches in Java. See that link for more details, but the best compromise I could come up with was [bindgen](http://www.bindgen.org), which leverages APT code generation to facilitate declarative bindings like:

However, bindgen isn't perfect--APT is can be fickle at times, and bindgen itself outputs a prodigious amount of generated code because it can't anticipate exactly what bindings you may/may not use.

In Gosu
-------

Gosu has a much better alternative which is simply brilliant--build data binding directly into the language.

    class Employer {
      var _name: String as Name
    }

    class Employee {
      var _employer: Employer as Employer
      var _name: String as Name
    }
{: class="brush:java"}

    var er = new Employer() { :Name = "er-a" }
    var ee = new Employee() { :Employer = er, :Name = "ee-1" }

    var b1 = Employee#Employer#Name
    b1.set(ee, "er-b")
    puts(ee.Employer.Name)

    var b2 = ee#Employer#Name
    b2.set("er-c")
    puts(ee.Employer.Name)

    var b3 = ee#Name
    b3.set("ee-1")
    puts(ee.Name)
{: class="brush:java"}




