---
layout: post
title: todomvc in gwt-mpv
---

{{page.title}}
==============

[todomvc](https://github.com/addyosmani/todomvc) is a nifty sample application that shows what the same functionality looks like when implemented in a number of different JavaScript UI frameworks.

[Jérôme Gravel-Niquet](http://jgn.me/)'s initial todo application has a great balance of features to lightly tax a framework but not take forever to implement. And [Addy Osmani](http://addyosmani.com/)'s insight that it would be great for comparing frameworks was spot on.

As far as the various JS frameworks go, I like the direction they are going--decoupling the model, view, etc. It makes a lot of sense as your application scales up.

As a [GWT](http://code.google.com/webtoolkit/) user, I have a slightly different viewpoint on JavaScript application development (eh, it's just assembly...er, [C](http://blog.izs.me/post/10213512387/javascript-is-not-web-assembly)), but I nonetheless agree with these JS frameworks on finding an intelligent way to structure AJAX applications.

In the GWT world, Model View Presenter has been the hot way to do this [since 2009](http://www.google.com/events/io/2009/sessions/GoogleWebToolkitBestPractices.html), and I've obliged by hacking on [gwt-mpv](http://www.gwtmpv.org) for various apps we're writing at [Bizo](http://www.bizo.com).

Since gwt-mpv shares a lot of the same goals as these other frameworks, I thought it'd be fun to port todomvc and see how it compares and contrasts. 

Demo and Code
-------------

Although it looks just like the other implementations, the gwt-mpv port's code is currently hosted here:

* [http://todomvc.gwtmpv.org/TodoMvc.html](http://todomvc.gwtmpv.org/TodoMvc.html)

And if you want to follow along in the source while reading this post, the source is on github:

* [https://github.com/stephenh/todomvc-gwtmpv](https://github.com/stephenh/todomvc-gwtmpv)


Models
------

To start with, both the JS implementation and the gwt-mpv implementation rely heavily on event-driven models of both simple properties (booleans, strings, etc.) and lists (adds, removes, changes).

Each JS framework does this slightly differently, but knockout has a clear usage:

    // creates models that fire events when changed
    var viewModel = {
      todos: ko.observableArray(),
      current: ko.observable(),
    ...

    // and derived properties of those
    viewModel.remaining = ko.dependentObservable(function () {
          return this.todos().filter(function (el) {
              return el.done() === false;
         });
    }, viewModel),
{: class=brush:jscript}

And then views that bind to the properties and will auto-update when the properties change:

    <span class="todo-count" data-bind="visible: remaining().length > 0">
{: class=brush:xml}

So, `viewModel.todos` changes when something is added/removed, then `viewModel.remaining` changes, and then finally the view changes automatically.

I think this style of declaratively settings up view/model bindings is the key to doing non-trivial AJAX applications without loosing your functionality (or sanity, whichever is less important) to growing balls of spaghetti code. Changing the model should lead to the view updates just working.

In the gwt-mpv port, this is achieved slightly differently, although the affect is the same:

In the [StatsTodoPresenter](https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/app/StatsTodoPresenter.java#L36), this shows/hides the stats automatically on model changes:

    binder.when(state.allTodos.size()).is(0).hide(view.stats());
{: class=brush:java}

Where `allTodos` is a `ListProperty` model object and the `binder.when` call is a DSL to setup common "when this, do that" bindings.

Derived properties are done the same way as knockout:

    numberLeft = integerProperty(new DerivedValue<Integer>() {
      public Integer get() {
        return allTodos.get().size() - doneTodos.get().size();
      }
    }).depends(allTodos, doneTodos);
{: class=brush:java}

gwt-mpv doesn't implement knockout's crazy (cool) auto-detection of dependent properties, hence having to call `depends(allTodos, doneTodos)` to explicitly set them. I'm on the fence about whether the magic to do this is worth implementing, but it's definitely pretty cool.

Also, gwt-mpv doesn't yet have a way to declaratively sync a `ListProperty` to view objects. Many of the JS frameworks do: you add a new object to the list, and the bound view auto-adds a new todo line. This requires a [small amount of boilerplate](https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/app/ListTodoPresenter.java#L34) right now that would be nice to clean up.

So, that's similarities; basically, yay for the model.

Components
----------

While most of the JS implementations have a single HTML file, a single CSS file, and a single application JS file, GWT is very component-oriented, which leads to a more spread-out project structure. The files for the todomvc port are:

* `App.ui.xml` + `AppPresenter` for just the high-level layout
* `CreateTodo.ui.xml` + `CreateTodoPresenter` for the top "new todo" portion
* `ListTodo.ui.xml` + `ListTodoPresenter` for the list of todos
* `ListTodoItem.ui.xml` + `ListTodoItemPresenter` for each item in the list of todos
* `TodoStats.ui.xml` + `StatsTodoPresenter` for the "left" count and "clear" link

Each part of functionality has its own template view file, its own presenter, its own unit test, and can be comprehended on its own without, for the most part, knowing how the rest of the application works.

While initially all these separate files might seem excessive for a small application, it means there is an inherent structure that will scale well as your application grows.

Templates
---------

GWT uses declarative XML to layout your HTML and various widgets, but it lacks any notion of conditional logic typically seen in server-side templates (the `<% if (...) %>` stuff), which most of the JS frameworks use.

So, the backbone implementation includes templates like this:

    <script type="text/template" id="item-template">
      <div class="todo <%= done ? 'done' : '' %>">
        <div class="display">
          <input class="check" type="checkbox" <%= done ? 'checked="checked"' : '' %> />
          <div class="todo-content"></div>
          <span class="todo-destroy"></span>
        </div>
        <div class="edit">
          <input class="todo-input" type="text" value="" />
        </div>
      </div>
    </script>
{: class=brush:html}

Note the conditional `done` class and `checked` attributes.

The GWT template (which is a separate file, [here][1]), ignoring the `gwt:Xxx` widgets, lacks these in-view conditions, so everything is completely static:

    <gwt:HTMLPanel ui:field="li" tag="li" styleName="{style.todo}">
      <div ui:field="displayPanel">
        <gwt:CheckBox ui:field="checkBox" styleName="{style.check}" />
        <gwt:Label ui:field="content" styleName="{style.todo-content}" />
        <gwt:Anchor ui:field="destroyAnchor" styleName="{style.todo-destroy}" />
      </div>
      <div ui:field="editPanel">
        <gwt:TextBox ui:field="editBox" styleName="{style.editBox}" />
      </div>
    </gwt:HTMLPanel>
{: class=brush:html}

Which means that it's the responsibility of the presenter logic to later toggle the CSS classes, etc. when needed.

This has two affects:

1. The conditional logic is not within the view, but in the presenter, which can be unit tested (discussed later)

2. In GWT, you rarely re-render parts of the page to affect change, instead you just mutate the existing DOM (...unless using GWT's Cell widgets, which are for bulk display for tables/lists, but are exceptions).

   Avoiding re-rending is, in my opinion, more amenable to a rich, component-based UI because then your components (which have state) aren't having their underlying DOM elements constantly swept out from under them.
   
   This may not be an issue when re-rendering tiny, leaf parts of the DOM, but as you work your way up in the DOM of your complex app, I think it would become harder to remember all the state needed to faithfully re-render things from scratch (like the checked state in the above backbone example).

   I can see where the sentiment of "eh, just re-render" comes from. Having been a server-side web developer, I certainly miss the simplicity of the "each response is a clean slate" model. And re-rendering entire parts of the page certainly worked well for Rails, albeit it was still doing rendering on the server-side. However, I don't think it is as good of a conceptual fit on a stateful client.

A few other notes about GWT's templates:

* The `{style.todo}` line is a reference to the `.todo` CSS class, which is declared inline within the `ui.xml` file. This means:

   1. You have a good place to put per-component CSS (it all ends up bundled into one download in the end), which to me is a much saner alternative than the gigantic CSS files I usually see.
   
      It's a locality principle: if CSS is used only once, it should be as close to that usage point, and none other, as possible.

   2. The compiler checks all CSS class references--if `.todo` was renamed, you get a compile error.

   3. The compiler ensures all CSS identifiers are globally unique--if you use `.name` in one `ui.xml` or `css` file, you don't have to worry about it colliding with another `.name` in another `ui.xml` or `css` file.

No Selectors
------------

This is probably a bigger difference than the templates, but somewhat derives from it.

In GWT, because it is component based, you nearly always already have references to the DOM objects you want to mutate, albeit usually encapsulated by GWT's widgets.

Let's see what I mean. In the backbone implementation, to update a list item's text when it changes, the code uses a selector to reach out and grab the text box:

    this.$('.todo-content').text(content);
{: class=brush:jscript}

Where as in the [ListTodoItemPresenter](https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/app/ListTodoItemPresenter.java#L66), the view kept a reference to the text box while building itself (done by UiBinder), so now we can just call it:

    view.content().setText(view.editBox().getText());
{: class=brush:java}

(The `content()` method is just a getter than returns the view's `content` field, which is a GWT Label component, which just wraps a DOM `div` tag.)

The same thing for event handling--while backbone uses selectors for event listening:

    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },
{: class=brush:jscript}

In GWT, we use regular, old-school anonymous event listeners:

    view.newTodo().addKeyDownHandler(new KeyDownHandler() {
      public void onKeyDown(KeyDownEvent event) {
        // ...
      }
    });
{: class=brush:java}

Although this can sometimes be cleaned up by using the binder DSL:

    binder.bind(done).to(view.checkBox());
{: class=brush:java}

Avoiding selectors has a few up-shots:

1. Your code more exactly denotes the elements it will change.

   This is a lot like dynamic vs. static typing; selectors are dynamic, deferring the binding of the selector to underlying elements until execution time, while GWT's known-references approach has a stronger assertion about which elements it will change.

   And so if you refactor the HTML in your `ui.xml` file, your view interface changes, and any presenter logic that was depending on it may now break, vs. the magic selector string just silently not matching.

2. Your application doesn't have to worry about selectors from various components overlapping each other.

   DOM selectors inherently execute against the entire, global DOM. In a large, structured application, this is less-than-ideal, both for performance and separation of concerns.

3. Testing is easier because you don't need a fake DOM to run the selectors against. More on testing below, but if your code mutates explicit references, it's easier for tests to fake these references out at test time.

Personally, I think selectors are leftover baggage from the Web 1.0 days. When people first started doing AJAX, 95%+ of the page was rendered server-side, so of course you don't have JavaScript references to the things you want to change, the elements all came down in one big string of HTML. So selectors were a great way to reach back into a DOM you didn't create and get at them.

However, for full-page AJAX applications, when 95%+ of the page is rendered client-side, the very act of rendering provides the perfect opportunity to grab explicit references to the DOM objects as they are created and hold on to them within your application logic (in widgets, components, etc.). In my experience, this negates any need for selectors.

Testing
-------

Testing is the final difference I'll touch on. For me, it's the biggest win.

Thanks to the Model View Presenter approach, and gwt-mpv's judicious use of code generation, it is ridiculously easy to test your view logic without the DOM.

As far as I can tell, this isn't possible yet with the JS frameworks. They may decouple the model, but view logic is still strongly coupled to the DOM. (Not because it's impossible, but because none of the frameworks have built the necessary abstractions yet.)

For the todomvc port, this means we can test the "new todo" functionality by:

1. Setting up a test model
2. Instantiating the presenter to test
3. Retrieving the stub (no DOM) view implementation (which is generated by gwt-mpv from the `ui.xml` template file) that has fake versions of each of our components

So a test starts out looking like [CreateTodoPresenterTest](https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/test/java/org/gwtmpv/todomvc/client/app/CreateTodoPresenterTest.java):

    public class CreateTodoPresenterTest extends AbstractPresenterTest {
      final ListProperty<Todo> todos = listProperty("todos");
      final CreateTodoPresenter p = bind(new CreateTodoPresenter(todos));
      final StubCreateTodoView v = (StubCreateTodoView) p.getView();
{: class=brush:java}

And then goes right into testing features:

    @Test
    public void enterOnSomeContentCreatesTask() {
      assertThat(todos.get().size(), is(0));
      v.newTodo().type("new task");
      v.newTodo().keyDown(KeyCodes.KEY_ENTER);
      assertThat(todos.get().size(), is(1));
      assertThat(todos.get().get(0).getName(), is("new task"));
    }
{: class=brush:java}

The `type` method (naively) emulates a user typing into the "new todo" text box. `keyDown` is the enter key being pressed. And then we can assert our model was changed, and the new model object created with the right name.

There are 29 other tests like this I wrote awhile porting todomvc. They run in 1/10th of a second, no selenium, no browser, etc.

Which, to me, actually makes it feasible to develop your UI logic in a TDD fashion.

Okay, now the caveats:

1. Yes, this is a lossy abstraction. It doesn't pretend to emulate cross-browser differences. It doesn't realize that setting "display: none" on a parent makes the children invisible. In practice, that doesn't matter for these sorts of tests.

2. Yes, this can't test DOM-heavy logic. That logic should ideally be encapsulated within a component. Then you test the component with `GWTTestCase` (which has a DOM) or selenium or whatever, but then let your presenter tests be DOM-less by using a fake version of the component assuming the real one will just work.

3. Yes, you still need integration tests.

So, it's not perfect. But if you had to choose:

* 500 unit tests + 50 selenium tests, or
* 550 selenium tests

I think it's a fair assertion you're much better off with the former.

Disclaimers
-----------

* Per my earlier link to Ray Ryan's 2009 I/O talk, I can't take credit for the DOM-less testing approach. gwt-mpv, and several other frameworks within the GWT sphere, are just running with a great idea.

* I used a global [AppState](https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/model/AppState.java) class to share the `ListProperty`s across presenters. Some GWT developers would probably lobby for even more decoupling by passing messages on an `EventBus`, but that seemed like overkill for this app.

* The original CSS was in one massive file, and I may have butchered it when moving it into each component. It looks fine in Chrome, but YMMV.

* Yes, Java isn't cool anymore, but [scala-gwt](http://scalagwt.github.com/) is another project I contribute to which would make everything more terse when it ships, although it looks like we'll have to start on scala-dart here pretty soon.

[1]: https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/views/ListTodoItem.ui.xml#L76

[2]: https://github.com/stephenh/todomvc-gwtmpv/blob/master/src/main/java/org/gwtmpv/todomvc/client/app/ListTodoItemPresenter.java#L50

