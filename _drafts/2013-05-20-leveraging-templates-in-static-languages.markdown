---
layout: draft
title: Leveraging Templates from Static Languages
---

{{page.title}}
==============

Templates (as in "here, render this string for me", not the C++ variety) are ubiquitous; all languages seem to end up with a bevy of template syntaxes and engines, especially if they touch anything web/HTML related.

While the specific syntax of templates changes, the basic idea is usually/always the same: a bunch of static text to be output, interspersed with directories to merge in dynamic content, e.g.:

    some bit of text to print

    some $VARIABLE is interpolated here

    and now some loop...
    #for($FOO in $FOOS) foo $FOO #end

    and sometimes they support conditionals
    #if($BAR) hi! #end
{: class=brush:plain}

The idea, of course, is that the static text, given it is outside your host language, will be easier to massage/format to exactly what you want, vs. trying to massage it all together with `StringBuffers`.

Especially for web programming, templates take center stage, since laying out HTML hierarchically is one of the main tasks of web development.

Most Templates are Dynamically Typed
------------------------------------

Nearly all template engines use dynamic typing--in that they have no insight into what types/variables the directives in the template actually require, they just evaluate the template as the output is rendered, and lazily throws errors if things don't work out.

From an implementation standpoint, this is often understandable; and if your host language is a dynamic language anyway, it's likely what the user wants.

The template engine's API will usually look like (using the template above as an example):

    // make up some code...
    Template t = Template.parseFrom("my-template.txt");
    Map<String, Object> variables = newHashMap();
    variables.put("VARIABLE", "a");
    variables.put("FOO", newArrayList(foo1, foo2));
    variables.put("BAR", true);
    String output = t.render(variables);
{: class=brush:java}

This approach is very widely used, and obviously with a great deal of success.

But it will rub the static language bigots (like myself) the wrong way, because we're leaving it up to the programmer to manually wire together the host language's output to each template's input, and not doing any checking for basic "hey, you forgot this variable" type of errors.

Bringing Typing to Templates
----------------------------

This is not by any means my idea, but several templating languages have introduced types.

One of the most familiar-looking is [GXP](https://code.google.com/p/gxp/), which uses an JSP-like syntax, but has the template declare the input it requires:


    <gxp:template
      name='com.google.tutorial.HtmlHelloUser'
      xmlns:gxp='http://google.com/2001/gxp'
      xmlns='http://www.w3.org/1999/xhtml'>
      <gxp:param name='userName' type='String'/>
      <b>Hello, <br/> <gxp:eval expr='userName'/>!</b>
    </gxp:template>
{: class=brush:xml}

Here the template declares it takes a `userName` parameter, and it's type, which means now we can build tooling around the information, e.g.:

1. The template compiler can type-check all of the `gxp:eval` expressions
2. The template compiler can require the user to provide all of the necessary parameters

For example, now the API for the template looks like:

    HtmlHelloUser.write(System.out, context, theUserNameParam);
{: class=brush:java}

Assuming you can setup the template compiler to run quickly and automatically, I think this is a pretty good improvement for fans of static languages--you get the free-form output of the template, but with the compile-time checking of your input/expressions of a static language.

Generating Host Language Artifacts Automatically
------------------------------------------------

Just to specifically call it out, a typed template approach like GXP should have just enough type information to automatically reflect the contents of the template back into the host language.

This means the templates basically automatically generate their own APIs for the programmer to use.

In my experience, this is very nice to work with. Instead of having to write and maintain artifacts on both the template side (the template itself) and the host language side (some sort of type-safe class to load/render the template), the programmer gets a host-language, typed API for their templates automatically.

The Approach of GWT's UiBinder
------------------------------

[GWT](https://developers.google.com/web-toolkit/)'s [UiBinder](https://developers.google.com/web-toolkit/doc/latest/DevGuideUiBinder) has an interesting approach; it takes the "declare your parameters" approach of GXP (e.g. with its `ui:with` tags), but goes further and also declares elements to be exposed to the host language (e.g. with its `ui:field` attributes). E.g.:

    <ui:UiBinder xmlns:ui='urn:ui:com.google.gwt.uibinder'
        xmlns:g='urn:import:com.google.gwt.user.client.ui'>
      <ui:with field="username" type="java.lang.String"/>
      <g:HTMLPanel>
        some <b>html</b>
        <span ui:field="name"/>
      </g:HTMLPanel>
    </ui:UiBinder>
{: class=brush:xml}

With some slight hand-waving on implementation details, the user now gets to have the `name` element "given" to them, e.g.:

    class SomeTemplate {
      // skipping details...

      // UiBinder will set this element appropriately
      @UiField
      SpanElement name;

      void someMethod() {
        // Later, the user did something, we need
        // to update name
        name.setInnerText("...");
      }
    }
{: class=brush:java}

This approach is required because, in AJAX/Web 2.0 applications, the templates are not just rendered once and thrown away (although some Web template languages do work this way); the user is going to interact with the webapp, and the host language will need to continually update the DOM elements.

UiBinder's approach lets the application's logic go back and poke/update the already-rendered DOM elements, all while avoiding magic selector lookups that are typical of jQuery/Web 1.5 applications.

Handling Post-Render Events
---------------------------

So, as noted in the last UiBinder section, AJAX/Web 2.0 templates have a unique problem: events. They have to keep updating after the initial render.

GWT's UiBinder takes the approach of "that's not my problem", and lets the application deal with it however it like.

Personally, I built [Tessell](http://www.tessell.org) to make this easier, and I think (of course) the result is quite nice; templates with basically no expressions, and the application logic doing the heavy lifting (via a succinct DSL), e.g.:

    class ApplicationLogic {
      ...
      binder.bind(someModel).to(view.name());
{: class=brush:java}

The above snippet is basically moving the traditional template expressions into Java code/DSL, where it can be re-evaluated as necessary.

Native Re-Evaluation
--------------------






