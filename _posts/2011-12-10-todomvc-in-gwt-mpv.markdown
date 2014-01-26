---
layout: post
title: todomvc in Tessell
---

{{page.title}}
==============

**Update 2011/12/29:** This post was originally about the gwt-mpv framework, which has since been rechristened Tessell, see [tessell.org](http://www.tessell.org).

Recently I came across [todomvc](https://github.com/addyosmani/todomvc) on HN, a nifty sample application that shows the same "todo app" functionality implemented in a number of different JavaScript UI frameworks.

It is a great way to compare JS frameworks, as [Jérôme Gravel-Niquet](http://jgn.me/)'s initial todo application has a great balance of features to lightly tax a framework but not take forever to implement. Kudos to [Addy Osmani](http://addyosmani.com/) for realizing this and gathering together the various implementations.

As a [GWT](http://code.google.com/webtoolkit/) user, I have a slightly different viewpoint on JavaScript application development (eh, it's just assembly...er, [C](http://blog.izs.me/post/10213512387/javascript-is-not-web-assembly)), but I nonetheless agree with these JS frameworks that intelligently structuring AJAX applications is important.

In the GWT world, Model View Presenter has been the hot way to do this [since 2009](http://www.google.com/events/io/2009/sessions/GoogleWebToolkitBestPractices.html), and I've obliged by hacking on [Tessell](http://www.tessell.org), an MVP framework, for various apps we're writing at [Bizo](http://www.bizo.com).

Tessell shares a lot of the same ideas and goals as the todomvc JS frameworks, namely:

* rich, event-driven models
* data-binding models to views declaratively

So I thought it'd be fun to port todomvc to Tessell as yet another implementation to compare and contrast with the others.

In doing so, and doing this writeup, I have two goals:

* Show GWT developers that Tessell's code generation-driven MVP leads to minimal boilerplate
* Show JavaScript developers that GWT can be a competent choice for rich-client development

Demo and Code
-------------

Although it looks just like the other implementations, the Tessell port's code is currently hosted here:

* [http://todomvc.tessell.org/TodoMvc.html](http://todomvc.tessell.org/TodoMvc.html)

And if you want to follow along in the source while reading this post, the source is on github:

* [https://github.com/stephenh/todomvc-tessell](https://github.com/stephenh/todomvc-tessell)

Project Layout
--------------

The Tessell todo implementation uses an idiomatic Java/GWT layout. The primary packages are:

* [org.tessell.todomvc.client.app](https://github.com/stephenh/todomvc-tessell/tree/master/src/main/java/org/tessell/todomvc/client/app) for presenters,
* [org.tessell.todovmc.client.model](https://github.com/stephenh/todomvc-tessell/tree/master/src/main/java/org/tessell/todomvc/client/model) for models, and
* [org.tessell.todomvc.client.views](https://github.com/stephenh/todomvc-tessell/tree/master/src/main/java/org/tessell/todomvc/client/views) for view templates.

For a small application like the todo app, having multiple files is likely harder to follow than the JS implementations, which typically have just one JS file + CSS file. However, this approach works best for GWT and means you already have a good setup if your project grows larger.

Models
------

To start with, all rich UI frameworks typically define models for the domain objects involved. In Tessell, this is done simply with a [Todo](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/model/Todo.java) class:

    public class Todo {
      public final BooleanProperty done = booleanProperty("done", false);
      public final StringProperty name = stringProperty("name");

      public Todo(String name) {
        this.name.set(name);
      }
    }
{: class="brush:java"}

Instead of traditional Java fields + getters/setters, Tessell models have property objects. Property objects fire events when they change, which allows the rest of the application to react accordingly.

You can also have lists of model objects, which fire events when items are added/removed to the list, e.g. in [AppState](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/model/AppState.java):

    public class AppState {
      public final ListProperty<Todo> allTodos = listProperty("allTodos");
      public final ListProperty<Todo> doneTodos = listProperty("doneTodos");
    }
{: class="brush:java"}

As with the JS frameworks, Tessell also supports derived properties, e.g. in [AppState](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/model/AppState.java#L18):

    numberLeft = integerProperty(new DerivedValue<Integer>() {
      public Integer get() {
        return allTodos.get().size() - doneTodos.get().size();
      }
    });
{: class="brush:java"}

Tessell models can also do validation of properties (required, length checks, etc.), but that wasn't needed for the todo application.

Views
-----

Tessell's views build on GWT's [UiBinder](http://code.google.com/webtoolkit/doc/latest/DevGuideUiBinder.html), which uses HTML-like XML to layout your application. The main distinguishing feature of UiBinder is that it lacks any logic (either behavior or data binding) in the view--there are no `<% if (...) %>` tags or `data-bind="..."` attributes.

For example, [ListTodoItem.ui.xml](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/views/ListTodoItem.ui.xml#L76):

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
{: class="brush:html"}

(If you're not familiar with the todo app, it alternates between the `displayPanel` when the user is viewing a todo and the `editPanel` when a user double-clicks to edit a todo.)

Some GWT specifics aside (widgets, etc.), this is basically HTML. A few things to note:

* The `ui:field` attributes expose their annotated elements/widgets to your presentation logic.

  (GWT eschews `id` attributes because a template may be included multiple times in the DOM and, ids being global, could collide.)

* `{style.todo}` is a reference to the `.todo` CSS class defined inline within the `ui.xml` file. This means:

   1. You have a good place to put per-view CSS (it all ends up bundled into one download in the end), which to me is a much saner alternative than the gigantic CSS files I usually see.
   
      It's a locality principle: if CSS is used only once, it should be as close to that usage point, and none other, as possible.

   2. The compiler checks all CSS class references--if `.todo` was renamed, you get a compile error.

   3. The compiler ensures all CSS identifiers are globally unique--if you use `.name` in one `ui.xml` or `css` file, you don't have to worry about it colliding with another `.name` in another `ui.xml` or `css` file.

The main feature that Tessell provides for views is generating derivative artifacts from the `ui.xml` files. In the MVP pattern, presenters code against an abstract `IsXxxView` interface, and then UiBinder needs a `XxxViewImpl` Java class, but Tessell can derive both of these from the `ui.xml` file.

For an example, the generated `IsListTodoItemView` looks like:

    interface IsListTodoItemView extends IsWidget {
      IsHTMLPanel li();
      IsElement displayPanel();
      IsCheckBox checkBox();
      IsLabel content();
      IsAnchor destroyAnchor();
      IsElement editPanel();
      IsTextBox editBox();
      ListTodoItemStyle style();
    }
{: class="brush:java"}

Where each `ui:field`-annotated element/widget in the `ui.xml` file is exposed, but only as an abstract `IsXxx` interface which themselves can be substituted for fake DOM-less versions at test time. We'll cover this more later when talking about testing.

Presenters
----------

Presenters are the glue between your model and view. Ideally presenters simply bind the model and view together; but, if needed, they can also implement more complex logic.

An extremely simple presenter is [AppPresenter](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/app/AppPresenter.java), which just assembles the three separate panels of the application:

    public class AppPresenter extends BasicPresenter<IsAppView> {

      private final AppState state = new AppState();
      private final CreateTodoPresenter createTodo = addPresenter(new CreateTodoPresenter(state.allTodos));
      private final StatsTodoPresenter statsTodo = addPresenter(new StatsTodoPresenter(state));
      private final ListTodoPresenter listTodos = addPresenter(new ListTodoPresenter(state));

      public AppPresenter() {
        super(newAppView());
      }

      @Override
      public void onBind() {
        super.onBind();
        view.createPanel().add(createTodo.getView());
        view.listPanel().add(listTodos.getView());
        view.statsPanel().add(statsTodo.getView());
        view.creditsPanel().add(newCreditsView());
      }
    }
{: class="brush:java"}

Obviously usually presenters do a bit more; in the todo app, the most busy presenter is the [ListTodoItemPresenter](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/app/ListTodoItemPresenter.java), which, amongst other things, binds the `todo.name` property to the view:

    binder.bind(todo.name).to(view.editBox());
    binder.bind(todo.name).toTextOf(view.content());
    binder.bind(todo.done).to(view.checkBox());
{: class="brush:java"}

These three one-liners setup two-way data binding between the model and the view. If `todo.name` changes, both `view.editBox()` and `view.content()` will be updated with the new name. If the user enters a new name into `view.editBox()`, it will flow back into `todo.name` (and subsequently into `view.content()`)).

Besides just binding fields, the binder DSL can also be used for performing other common view actions on model change, such as showing/hiding or setting/removing CSS classes:

    binder.when(editing).is(true).show(view.editPanel());
    binder.when(editing).is(true).hide(view.displayPanel());
    binder.when(editing).is(true).set(s.editing()).on(view.li());
{: class="brush:java"}

Finally, looking at [ListTodoPresenter](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/app/ListTodoPresenter.java), keeping the view's `ul` list of one-`li`-per-todo in sync with the `allTodos` list model can also be done with binding:

    binder.bind(state.allTodos).to(this, view.ul(), new ListPresenterFactory<Todo>() {
      public Presenter create(Todo todo) {
        return new ListTodoItemPresenter(state, todo);
      }
    });
{: class="brush:java"}

Hopefully you can see that, besides view boilerplate reduction, rich models and a fluent binding DSL are the other main strengths Tessell brings to the table to succinctly, declaratively wire together your application's behavior.

Testing
-------

Finally, the reason for the extra abstraction of the Model View Presenter architecture, it is now ridiculously easy to test your model and presenter logic without the DOM.

For the todomvc port, this means we can test the "add a new todo" functionality by:

1. Setting up a test list model
2. Instantiating the presenter to test
3. Retrieving the stub (no DOM) view implementation (which is generated by Tessell from the `ui.xml` template file) that has fake versions of each of our components

So a test starts out looking like [CreateTodoPresenterTest](https://github.com/stephenh/todomvc-tessell/blob/master/src/test/java/org/tessell/todomvc/client/app/CreateTodoPresenterTest.java):

    public class CreateTodoPresenterTest extends AbstractPresenterTest {
      final ListProperty<Todo> todos = listProperty("todos");
      final CreateTodoPresenter p = bind(new CreateTodoPresenter(todos));
      final StubCreateTodoView v = (StubCreateTodoView) p.getView();
{: class="brush:java"}

And then goes right into testing features:

    @Test
    public void enterOnSomeContentCreatesTask() {
      // model starts out empty
      assertThat(todos.get().size(), is(0));
      // user enters a new task, hits enter
      v.newTodo().type("new task");
      v.newTodo().keyDown(KeyCodes.KEY_ENTER);
      // model now has a new task with the right name
      assertThat(todos.get().size(), is(1));
      assertThat(todos.get().get(0).getName(), is("new task"));
    }
{: class="brush:java"}

The `newTodo().type(...)` method emulates a user typing into the "new todo" text box. `newTodo().keyDown(...)` is the enter key being pressed. And then we can assert our model was changed, and the new model object created with the right name.

The Tessell port has ~30 presenter tests like this one. They all run in 1/10th of a second, no selenium, no browser, etc.

To me, this means its now actually feasible to develop your UI logic in a TDD fashion. Which is a huge win.

Okay, now the caveats:

1. Yes, this is a lossy abstraction. It doesn't pretend to emulate cross-browser differences. It doesn't realize that setting "display: none" on a parent makes the children invisible. In practice, that doesn't matter for these sorts of tests.

2. Yes, this can't test DOM-heavy logic. That logic should ideally be encapsulated within a component. Then you test the component with `GWTTestCase` (which has a DOM) or selenium or whatever, but then let your presenter tests be DOM-less by using a fake version of the component assuming the real one will just work.

3. Yes, you still need integration tests.

So, it's not perfect. But if you had to choose:

* 500 unit tests + 50 selenium tests, or
* 550 selenium tests

I think it's a fair assertion you're much better off with the former.

Comparison with JS Frameworks
-----------------------------

Reading through the various JS implementations of the todo app, and Tessell's implementation, it's encouraging to see that they are all trying to do basically the same thing: use event-driven models and views to wire together a rich client.

I think this approach of declaratively setting up view/model bindings is the key to doing non-trivial AJAX applications without loosing your functionality (or sanity, whichever is less important) to growing balls of spaghetti code. Changing the model should lead to the view updates just working.

That being said, each framework does things slightly differently. Here I'll briefly cover how GWT/Tessell is different.

### Templates

GWT's `ui.xml` files seem like the most static/most dumb view templates. Whether this is good or bad is personal preference, although I like it because I think it forces as much view logic as possible into the presenter.

Some JS frameworks, like backbone, use more server-side-style templates:

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
{: class="brush:html"}

Where others use data-binding attributes, like knockout:

    <script id="todoitemtemplate" type="text/html">
      <li data-bind="css: {editing: editing}">
        <div data-bind="attr: { class : done() ? 'todo done' : 'todo'}">
          <div class="display">
            <input class="check" type="checkbox" data-bind="checked: done" />
            <div class="todo-content" data-bind="text: content, click: edit" style="cursor: pointer;"></div>
            <span class="todo-destroy" data-bind="click: viewModel.remove"></span>
          </div>
          <div class="edit">
            <input class="todo-input" type="text" data-bind="value: content, event: { keyup: editkeyup, blur: stopEditing }"/>
          </div>
        </div>
      </li>
    </script>
{: class="brush:html"}

These approaches typically require rendering the DOM elements to test the view logic. I generally think this is a bad thing, although I was surprised to learn that, if you avoid the traditional Selenium/etc., approaches, in-browser DOM testing can be [quite fast](http://tinnedfruit.com/2011/04/26/testing-backbone-apps-with-jasmine-sinon-3.html) these days.

Also with templates, in GWT you rarely re-render parts of the page to show changes, instead you just mutate the existing DOM (...unless using GWT's Cell widgets, which are for bulk display for tables/lists, but are exceptions). Some JS frameworks re-render, some don't, but in general I'm a fan of not re-rendering.

Avoiding re-rending is, in my opinion, more amenable to a rich, component-based UI because then your components (which have state) aren't having their underlying DOM elements constantly swept out from under them.
   
This may not be an issue when re-rendering tiny, leaf parts of the DOM, but as you work your way up in the DOM of a complex app, I think it would become harder to remember all the state needed to faithfully re-render things from scratch (like the checked state in the above backbone example).

I can see where the sentiment of "eh, just re-render" comes from. Having been a server-side web developer, I certainly miss the simplicity of the "each response is a clean slate" model. And re-rendering entire parts of the page certainly worked well for Rails, albeit it was still doing rendering on the server-side. However, I don't think it is as good of a conceptual fit on a stateful client.

### No Selectors

In GWT, you typically already have references to the DOM objects you want to mutate (albeit usually encapsulated by widgets), so you rarely, if ever, need selectors.

The is different than most of the JS frameworks. For example, in the backbone implementation, to update a list item's text when it changes, the code uses a selector to reach out and grab the text box:

    this.$('.todo-content').text(content);
{: class="brush:jscript"}

Where as in the [ListTodoItemPresenter](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/app/ListTodoItemPresenter.java#L66), the view kept a reference to the DOM element while building itself (done by UiBinder), so now we can just call it directly:

    view.content().setText(view.editBox().getText());
{: class="brush:java"}

(The `content()` method is just a getter than returns the view's `content` field, which is a GWT Label component, which just wraps a DOM `div` tag.)

Several of the JS frameworks also like to use selectors for event handling, again backbone:

    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-content" : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },
{: class="brush:jscript"}

Where as GWT typically uses old-school anonymous inner classes:

    view.newTodo().addKeyDownHandler(new KeyDownHandler() {
      public void onKeyDown(KeyDownEvent event) {
        // ...
      }
    });
{: class="brush:java"}

Although if you're just updating a model, this can be cleaned up by using the binder DSL:

    binder.bind(done).to(view.checkBox());
{: class="brush:java"}

Even though anonymous inner classes are not the most awesome thing ever, avoiding selectors has a few up-shots:

1. Your code more exactly denotes the elements it will change.

   This is a lot like dynamic vs. static typing; selectors are dynamic, deferring the binding of the selector to underlying elements until execution time, while GWT's known-references approach has a stronger assertion about which elements it will change.

   And so if you refactor the HTML in your `ui.xml` file, your view interface changes, and any presenter logic that was depending on it may now break, vs. the magic selector string just silently not matching.

2. Your application doesn't have to worry about selectors from various components overlapping each other.

   Naive DOM selectors will select against the global DOM, which in a large, complex application is less-than-ideal. Better selectors will start with the component's subtree of the DOM, and even better selectors will not continue searching within the component's nested children components.

3. Testing is easier because you don't need a fake DOM to run the selectors against. More on testing below, but if your code mutates explicit references, it's easier for tests to fake these references out at test time.

Personally, I think selectors are leftover baggage from the Web 1.0 days. When people first started doing AJAX, 95%+ of the page was rendered server-side, so of course you don't have JavaScript references to the things you want to change, the elements all came down in one big string of HTML. So selectors were a great way to reach back into a DOM you didn't create and get at them.

However, for full-page AJAX applications, when 95%+ of the page is rendered client-side, the very act of rendering provides the perfect opportunity to grab explicit references to the DOM objects as they are created and hold on to them within your application logic (in widgets, components, etc.). In my experience, this negates any need for selectors.

Disclaimers
-----------

* Per my earlier link to Ray Ryan's 2009 Google I/O talk, I can't take credit for the DOM-less testing approach. Tessell, and several other frameworks within the GWT sphere, are just running with a great idea.

* In the todo application, I used a global [AppState](https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/model/AppState.java) class to share the `ListProperty`s across presenters. Some GWT developers would probably lobby for even more decoupling by passing messages on an `EventBus`, but that seemed like overkill for this app.

* The original CSS was in one massive file, and I may have butchered it when moving it into each component. It looks fine in Chrome, but YMMV.

* Yes, Java isn't cool anymore, but [scala-gwt](http://scalagwt.github.com/) will make everything more awesome and terse when it ships.


[2]: https://github.com/stephenh/todomvc-tessell/blob/master/src/main/java/org/tessell/todomvc/client/app/ListTodoItemPresenter.java#L50

