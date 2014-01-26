---
layout: post
title: ErraiUI Initial Impression
---

{{page.title}}
==============

JBoss's [Errai](http://www.jboss.org/errai) project has always been on my list of GWT technologies to play with.

AFAICT it's original/core purpose was sending events not just between the client and server, but between clients as well (via the server, I assume). This seems pretty useful, but I just hadn't had a need for it yet.

Lately it seems like Errai's scope is growing--it's becoming more about "bringing JEE to the client-side" instead of "just an EventBus". As a non-JEE user, I'm not entirely sure this is a good idea, but I suppose for existing JEE users it makes more sense.

The latest feature to be [announced](https://twitter.com/JBossMike/status/214066336375111680) is ErraiUI, an approach to HTML templates in GWT that is reminiscent of UiBinder.

Since I'm watching the [demo video](http://vimeo.com/44141164) now, I thought I'd write up a few thoughts.

If you want to jump right into their example code that's shown in the video, here are links to their GitHub [demo project](https://github.com/lincolnthree/errai-ui-demo) for:

* The [App.html](https://github.com/lincolnthree/errai-ui-demo/blob/master/src/main/java/org/jboss/errai/ui/demo/client/local/App.html) template
* The [App.java](https://github.com/lincolnthree/errai-ui-demo/blob/master/src/main/java/org/jboss/errai/ui/demo/client/local/App.java) component
* The [Spotlight.java](https://github.com/lincolnthree/errai-ui-demo/blob/master/src/main/java/org/jboss/errai/ui/demo/client/local/Spotlight.java) sub-component

So, my thoughts:

1. Their pure HTML templates are pretty spiffy.

   The de facto GWT template library, UiBinder, is HTML-*ish*, but really XML (not even XHTML), so you can't just open it up in a browser. Besides being XML, it has various GWT markup (`gwt:TextBox`, `ui:field`) thrown in that won't mean anything until rendered.

   Having worked a lot with UiBinder, I've gotten used to UiBinder's almost-HTML templates and no longer think it's a big deal. But I can why see sticking with pure HTML templates would be a good idea.

   One cool feature of ErraiUI is that'll strip headers/footers from your `.html` template file, so if you have a mockup from your designer that looks like:

       <html>
         <head><!--various js/style stuff--></head>
         <body>
           <!--common static header-->
           <div data-field="template">
             <!-- the HTML you really care about is here -->
           <!--common static footer-->
         </body>
       </html>
   {: class="brush:html"}

   By using the `@Templated("#template")` annotation, ErraiUI will find the `data-field=template` element, use it as the root of your component's template, and drop all of the HTML before/after it.

   This makes a lot of sense, because you usually don't want this header/footer cruft in your component itself (the styles/window dressing/etc. have already been drawn when your app loaded), but it's very handy to leave it there for designers/developers to just pop open in a browser and see what the HTML renders like, sans GWT.

   This seems to be their biggest feature and, kudos, it's pretty cool.

2. Another awesome feature is that they can split a single `.html` file up across multiple components.

   In UiBinder, if you have a parent component with various child components, each child needs it's own new `ui.xml` file, as there is no way to get separate/multiple `UiBinder` instances from a single `ui.xml` file. So you end up with `Parent.ui.xml` and a separate `ParentChild.ui.xml` containing just the (typically few) lines of child markup.

   ErraiUI templates, on the other hand, allows you have to take a single static template like:

       <div data-field="parentTemplate">
         <!-- some stuff -->
         <div data-field="children">
           <div data-field="childTemplate">
             <!-- child markup -->
             <span data-field="label">Child One</label>
           </div>
           <div>
             <!--
               markup for another child the designer included
               for illustration, but stripped by ErraUI
             -->
             <span>Child Two</label>
           </div>
         </div>
       </div>
   {: class="brush:html"}

   And then you can have two separate component classes, `Parent` annotated with `@Templated("#parentTemplate")` and `Child` annotated with `@Templated("Parent.html#childTemplate")` getting their respective markup from the same file.

   This is great--I've personally wanted to do this with UiBinder for awhile. As usual with UiBinder, you get used to  not being able to do it. But it is annoying to make a new `ui.xml` file every time you need to separate out a child's markup from its parent's markup.

3. Despite ErraiUI's otherwise awesome focus on pure/static HTML templates, sometimes abstracting boilerplate markup is handy, and I'm curious how/if they'll handle it.

   For example, Twitter [Bootstrap](http://twitter.github.com/bootstrap/) is great, but even if you're using it, once you get into non-trivial HTML forms, there is a lot of markup boilerplate. Each field needs a place for the label, the help text, the validation error, the input itself, all with the right CSS classes/HTML structure, etc.

   The markup for a complete form field (just one field), might look something like (making this up as I go):

       <div class="{style.controlGroup}">
         <div class="{style.controlLabel">
           <span>label</span>
           <i class="{style.helpIcon}"></i>
         </div>
         <div class="{style.control}">
           <input type="text" name="name" />
         </div>
         <div class="{style.errors}">
           errors go here
         </div>
       </div>
   {: class="brush:html"}

   Which isn't that bad.

   But then it's copy/pasted for every field in the form. And then copy/pasted for every field *in the application*.

   This is fine for static mockups--being static, they have to work this way.

   But once in the application, I think it's another form of boilerplate if you have more than a handful of form fields. Markup like this, that is very commonly used but also non-trivial, should be abstracted into a component so it can be defined once and maintained in a single place.

   With UiBinder, you can make an application-specific `TextBox` or `TextLine` component and then in your forms do something like:

       <form>
         <app:TextLine ui:field="name"/>
         <app:TextLine ui:field="title"/>
         <app:TextLine ui:field="description"/>
       </form>
   {: class="brush:html"}

   Which, personally, I think is a real boon for reducing boilerplate and increasing developer productivity.

   Unfortunately, it doesn't mesh at all with ErraiUI's approach of templates being completely static to facilitate WYSIWYG.

   Part of ErraiUI's philosophy, AFAICT, is that you no longer need to hack up your designer's mockups to use their HTML templates for your application. Which, on one hand is great; I've done that hacking before, and it's tedious. But, on the other hand, I think there are benefits, namely being able to bring abstractions like components to bare to reduce duplication.

   ...but then, yeah, once your template is using not-just-static-HTML abstractions, there goes WYSIWYG. So, who knows, pick your trade off, I guess.

4. ErraiUI seems like slightly less boilerplate than UiBinder, primarily because there is no `GWT.create` in sight.

   I would not get overly excited about this, however, as it just means the `GWT.create` is hidden behind some annotations. It is a few less lines of code, and I'll readily admit much cleaner, but the coupling (to deferred binding magic) is still there. Just better hidden.

5. Which brings me to my biggest question with ErraiUI: how do you do MVP?

   AFAICT, ErraiUI heavily relies on the Errai JEE-style injection infrastructure. Having not used Errai before, I'm not sure, but would all of the injection/data-binding work in a unit test? I'm kinda guessing not.

   Even if did, the demo code at least directly uses GWT's `Button` and `TextBox` classes, which can't be unit tested outside of a `GWTTestCase`.

   Both [traditional MVP](https://developers.google.com/web-toolkit/articles/mvp-architecture) and [Tessell](http://www.tessell.org) use a different approach, that has the application refer to interfaces, e.g. `HasText` or `IsTextBox`, which can be doubled out at test time. This gets you awfully quick tests, and is something I'd be really hard pressed to give up.

   Perhaps the intention with ErraiUI is that you could still do MVP, but ErraiUI is only concerned with your view implementation itself, and not the higher-level presenter. I would say this really makes sense, but the demo had included data binding logic, which is something I generally like to have be the presenter's responsibility so it can be tested.

6. As a final nit, ErraiUI still involves basically duplicating the fields within the template into the Java class.

   This was one of my original frustrations with UiBinder: after I add `<input type=text ... />` to the template, I have to also add a `private TextBox text;` to my Java class.

   In ErraiUI's case, it means another field (`private TextBox text`) and at least two annotations (`@Injected` and `@DataField)`, potentially a 3rd annotation (`@SuppressWarnings`) if you don't directly access the field and are using their data binding.

   (Tangentially, how weird is that? A field so magical you have to add `@SuppressWarnings`? To me this is another indication the code is essentially non-working until GWT compile/deferred bindings runs, so can't be unit tested. GWT's deferred bindings are great, but I think within the GWT ecosystem are overly used when more traditional code generation techniques (that let the user's code actually see the output) would be more appropriate. Yet another plug, but see [Tessell](http://www.tessell.org) for what I mean.)

   Nonetheless, since ErraiUI is not doing MVP, this template/Java re-declaration of fields isn't that bad, because you're also not updating presenter/view interfaces.

Conclusion
----------

There is a lot I like about ErraiUI. I can tell they had a specific set of goals (using static/designer-produced mockups as much as possible) and did a good job achieving them.

Admittedly, I like [Tessell](http://www.tessell.org)'s approach, to both the view and view/model data binding, enough that I'm not going to jump to ErraiUI anytime soon.

Although it would be interesting to look into replacing UiBinder within Tessell's stack with ErraiUI. Especially for having multiple components driven from one template file. If Tessell's code generation saw an ErraIUI `.html` file, it could MVP-ize it by creating an interface-plus-implementation based on the HTML tags with `data-field` attributes. Not entirely sure how it would recognize sub-components given they also use `data-field`. But seems like it could work.

Just the development of ErraiUI itself is also interesting--it shows that RedHat/JBoss are quite willing to step away from stock GWT libraries like UiBinder and innovate their own solutions. Which is great. It's awesome to see them putting this much investment in the GWT ecosystem.

