---
layout: post
title: GWT MVP Tables
---

<h2>{{ page.title }}</h2>

---

I'm building a GWT application and, per the latest [best practices](http://code.google.com/events/io/2009/sessions/GoogleWebToolkitBestPractices.html), using a MVP (model view presenter) approach.  

For awhile I was confused about how to build non-trivial views. For example, a dashboard-type table where each row is not just strings of text but an interactive unit.

Last week I finally found an approach that I like: per-row presenters. The trick with complex views seems to be searching for a sweet spot in the decomposition of your presenter/view pairs that is:

* fine-grained enough to facilitate easy implementation and testing, but
* not so fine-grained that it buries you in MVP/DI boilerplate. 

I'll add the disclaimer that if there is anything GWT is not, it is not succinct. Boilerplate seems to be the norm for GWT, and especially the MVP approach. I think the assertion is that, for large AJAX applications/codebases, you should be willing to accept some boilerplate as a tradeoff for gaining compile-time checking of type-safety and mockable views for extremely fast/non-browser-based test suites.

MVP Review
----------

So, just to be on the same page, GWT MVP exists primarily to divorce your AJAX application's business logic from the GWT UI widgets. This is imperative because, unfortunately, the widget are all concrete classes that rely on browser-provided behavior and will not run in a pure-Java unit test.

Since GWT itself does not put interfaces between your code and the browser, GWT MVP is how you by convention put interfaces between your code and the browser. With these interfaces in place, you can mock/stub them out and test your logic in a fast, browser-less unit test.

To show an example, a regular form that would edit a `Foo` object in GWT MVP is usually a `FooPresenter`/`FooView` pair that looks something like:

    public class FooPresenter extends BasicPresenter<Display> {
      // inner-interface defines the UI contract
      // our FooPresenter modifies
      public interface Display {
        // these HasXxx are all interfaces
        HasValue nameField();
        HasValue descriptionField();
        HasClickHandlers saveButton();
      }

      private final Foo foo;

      public FooPresenter(Display display, Foo foo) {
        // display is an implementation of our view, either
        // provided by the real view that uses GWT widgets
        // (typically named FooView) or a mock/stub
        super(display);
        this.foo = foo;
      }

      // Called when the page/tab for our foo loads
      public void onBind() {
        // hook up business logic to the display's
        // HasXxx interfaces
        display.nameField().setText(foo.getName());
        display.nameField().addValueChangeHandler(new OnNameChanged());
        display.descriptionField().setText(foo.getDescription());
        display.descriptionField().addValueChangeHandler(new OnDescriptionChanged());
      }

      private class OnNameChanged implements ValueChangedHandler<String> {
        public void onChange(String newValue) {
          foo.setName(newValue);
        }
      }

      private class OnDescriptionChanged implements ValueChangedHandler<String> {
        // etc.
      }
    }

    public class FooView implements FooPresenter.Display {
      // uibinder code...
      @UiField
      TextBox nameField;

      public nameField() {
        return nameField;
      }
    }
{: class=brush:java}

The idea is that the `Display` interface is easily mockable, so you can write a `FooPresenterTest` that creates a mock `Display`, with mock `HasValue`/etc., and test all of your `FooPresenter` business logic without actually using any GWT widgets that would require running in a browser environment (like `GWTTestCase`).

So, that was the review, on to tables.

GWT Tables
----------

To me, it was not immediately obvious how to implement tables in GWT MVP. There is no `HasTable` interface that holds your hand like `HasText`/`HasValue`.

GWT tables are also complicated by the fact that UiBinder only does static templating--unlike nearly every other HTML rendering library out there, it lacks any notion of iteration or `for` loops or even `if` statements. You cannot just `#for($row in $rows) <tr>row HTML goes here</tr>` like you would in Velocity/JSP/etc.

Table Models
------------

Instead, the usual MVP approach is to use a `TableModel`. The presenter gathers the domain objects (or creates an interface that can load domain objects on demand) and puts them into a `TableModel` instance. It then pushes the model into the view, which iterates over the model and creates widgets as needed.

One of the GWT examples uses a `List<String[]>` as a very naive `TableModel`, but it works well to show the basic idea:

    // displays a parent and its list of Foo children
    public class ParentPresenter extends BasicPresenter<Display> {
      public interface Display {
        void setData(List<String[]> model);
      }

      private final Parent parent; // set by constructor

      // Called when the page/tab for our parent loads
      public void onBind() {
        List<String[]> model = new ArrayList<String[]>();
        for (Foo foo : parent.getFoos()) {
          model.add(newLine(foo));
        }
        display.setData(model);
      }

      // translate Foo domain object into strings for each cell
      private String[] newLine(Foo foo) {
        return new String[] { foo.getName(), foo.getDescription() };
      }
    }

    public class ParentView implements ParentPresenter.Display {
      // uibinder code...
      @UiField
      HTMLTable table;
      public void setData(List<String[]> model) {
        table.resizeRows(model.size());
        int i = 0;
        for (String[] row : model) {
          table.setText(i, 0, row[0]);
          table.setText(i, 1, row[1]);
          i++;
        }
      }
    }
{: class=brush:java}

The GWT incubator has a much more powerful, elaborate `TableModel` for their [`PagingScrollTable`](http://code.google.com/p/google-web-toolkit-incubator/wiki/PagingScrollTable) that is worth checking out if this approach works for you.

But, the basic idea here is that we're shoving data into the view and pretty much stopping there.

Where Table Models Work
-----------------------

I think it works very well if your presenter can pre-format everything into basic `String`s, which makes the view logic very dumb.

The GWT incubator `TableModel` certainly looks very nice if your auto-loading-on-scroll 100s/1000s of rows. They have a `CachedTableModel` wrapper that will ensure you only fetch rows from the server that you really need. Pretty neat.

However, I do start to get a little hesitant when the view interface starts looking more like `setData(List<Foo> model)` (or `TableModel<Foo>`) and the view starts interrogating domain objects directly, as this is more complex logic that won't be under unit tests. But it's not that big of a deal.

Where Table Models Don't Work
-----------------------------

The main problem I see with `TableModel`s is that there is not an obvious way for the presenter that calls `display.setData(model)` to get back out `HasXxx` interfaces for each of the widgets the view creates.

For example, for a "dashboard"-style table, each row doesn't have just read-only data, but interactive features where a user can start/stop/pause each row's domain object, which then causes various row-specific style/images changes that are best performed and tested against `HasXxx` interfaces.

I looked at [Hupa](http://james.apache.org/hupa/index.html) and others, but did not find anyone using a `TableModel` and then pushing per-row/per-cell `HasXxx` interfaces back into a presenter. Perhaps I just missed it, in which case please correct me.

There is an idiom where you can attach a listener to the entire table, and then ask the view to derive which element it is for:

    public class ParentPresenter extends BasicPresenter<Display> {
      public interface Display {
        // fired for any click anywhere in the table
        HasClickHandlers tableClicked();
        // translate event -> int
        int getRowForClick(ClickEvent event);
        // then any changing row method requires an int
        changeStyle(int row, String otherParams);
      }

      public void onBind() {
        display.tableClicked().addClickHandler(new OnTableClick());
      }

      private class OnTableClick implements ClickHandler {
        public void onClick(ClickEvent event) {
          int row = display.getRowForClick(event);
          if (row != -1) {
            // perform action against row
            display.changeStyle(row, "foo");
          }
        }
      }
    }
{: class=brush:java}

However this seems less than ideal to me. The view becomes more complicated, and the presenter no longer has concrete `HasXxx` interfaces that are easy to wire up and stub out. There is also no clear place to store per-cell/per-row state, except perhaps in maps or other fields in the parent presenter.

First Attempt: Per-Cell Presenters
----------------------------------

My initial thoughts were that I wanted each cell to have its own presenter instance. This seems awfully intuitive, as the presenter would have its own view with the `HasXxx` interfaces for its cell.

It also fits very nicely with the GWT `HTMLTable` API, which is all about cells (e.g. the method `setWidget(int row, int column, Widget widget)` and friends).

This approach would look something like:

    public class ParentPresenter extends BasicPresenter<Display> {
      public interface Display {
        void setCell(int row, int column, WidgetDisplay display);
      }

      public void onBind() {
        int i = 0;
        for (Foo foo : parent.getFoos()) {
          display.setCell(i, 0, new CellOnePresenter(foo).getDisplay());
          display.setCell(i, 1, new CellTwoPresenter(foo).getDisplay());
          i++;
        }
      }
    }
    
    public class ParentView implements ParentPresenter.Display {
      // uibinder code...
      @UiField
      HTMLTable fooTable;
      public void setCell(int row, int column, WidgetDisplay display) {
        fooTable.setWidget(row, column, display.asWidget());
      }
    }
{: class=brush:java}

Just looking at this example, it doesn't seem that bad. I thought it'd work out nicely.

However, several folks on the [gwt-presenter](http://code.google.com/p/gwt-presenter/) mailing list warned me against going this route. And turns out they were exactly right.

The overhead of having a separate presenter-view pair for every table column was just too much boilerplate. After `CellOnePresenter`, `CellOneView`, `CellOneView.ui.xml`, `CellTwoPresenter`, and `CellTwoView`, I just couldn't bring myself to implement the rest of the columns.

Second Attempt: Per-Row Presenters
----------------------------------

After much complaining, I finally realized that the combination of `HTMLTable`'s per-cell API and my assumption that "this is a table because there is a `<table>` tag" was leading me astray.

A dashboard-style table is not really a table--it's a vertical listing of per-row views. That the HTML code uses `<table>` tags is purely an implementation detail.

A per-row presenter, with its parent presenter as well, would look like:

    public interace HasRows {
      void addRow(WidgetDisplay display);
    }

    // this is the parent presenter which
    // has the dashboard on its page
    public class ParentPresenter extends BasicPresenter<Display> {
      public interface Display {
        HasRows dashboard();
      }
      public void onBind() {
        for (Foo foo : parent.getFoos()) {
          FooRowPresenter p = new FooRowPresenter(foo);
          display.dashboard().addRow(p.getDisplay());
        }
      }
    }

    // this is the per-row presenter that will be instantiated once-per-Foo
    // and have its view added to the parent's dashboard table
    public class FooRowPresenter extends BasicPresenter<Display> {
      // here are the per-row HasXxx interfaces
      public interface Display {
        HasCss columnCss();
        HasText nameCellText();
        HasText descriptionCellText();
        HasClickHandlers actionFooLink();
      }
      private final Foo foo; // set by constructor
      public void onBind() {
        // finally here is our per-row business logic
        display.nameCellText().setText(foo.getName());
        display.descriptionCellText().setText(foo.getDescription());
        display.actionFooLink().addClickHandler(new OnActionClick());
      }
      private class OnActionClick implements ClickHandler {
        public void onClick(ClickEvent click) {
          // hit server, etc.
          display.columnCss().addStyleName("nowRed");
        }
      }
    }
{: class=brush:java}

As far as how each row's concrete view class is implemented, I did some hacking so that the entire row has its own UiBinder file. E.g. `FooRowView.ui.xml` might look like:

    <ui:UiBinder xmlns:ui='urn:ui:com.google.gwt.uibinder' xmlns:gwt='urn:import:com.google.gwt.user.client.ui'>
      <gwt:HTMLPanel tag="table">
        <tr ui:field="column">
          <td ui:field="nameCell" />
          <td ui:field="descriptionCell" />
          <td><gwt:Anchor ui:field="actionFoo"/></td>
        </tr>
      </gwt:HTMLPanel>
    </ui:UiBinder>
{: class=brush:xml}

This `ui.xml` file initially looks a little odd because each row has its own `<table>` tag--however, this is just a necessary hack because `HTMLPanel` does not like its `tag` attribute to be set to `tr`. I guess when browsers do `innerHTML`, they don't like a `tr` running around without its parent `table`.

So, to get around this, plus `HTMLTable`'s lack of a per-row API, I wrote a `RowTable` widget that knows how to assemble rows (not cells) of content:

    public class RowTable extends Panel implements HasRows {
      // copy/paste some boilerplate from HTMLTable

      // here is the key method--display is the HTMLPanel
      // with tag=table from FooRowView.ui.xml
      public void addRow(final WidgetDisplay display) {
        // get actual widget from the view interface
        Widget widget = display.asWidget();
        // Detaches if necessary
        widget.removeFromParent();
        // Logical attach
        rows.add(widget);
        // Physical attach (all TRs)
        final NodeList<Element> nodes = widget.getElement().getElementsByTagName("TR");
        for (int i = 0; i < nodes.getLength(); i++) {
          bodyElement.appendChild(nodes.getItem(i));
        }
        // Adopt
        adopt(widget);
      }
{: class=brush:java}

So, we logically attach the entire `HTMLPanel` widget (to get the usual `Widget`/`attach` magic), but for physically attaching we raid the `HTMLPanel`'s table element of all of its `TR` elements (which should be just one given this display is for one row) and append them to our own `bodyElement`.

Any Downsides?
--------------

So far, the only downside to per-row presenters is that it'll require another presenter/view pair, each with its own class, DI entry, etc. This can be considered boilerplate, but, per my disclaimer, that is pretty much the name of the game for GWT.

I'm also implementing the table's header row as its own presenter/view pair, meaning for one dashboard table I'll have 4 classes: `FooHeaderPresenter`, `FooHeaderView`, `FooRowPresenter`, and `FooRowView`. I would not mind avoiding the extra header presenter/view, but so far it has been the simplest to get working with the `RowTable` (`HasRows` actually has two methods, `addRow` and `addHeader` for adding to `tbody` and `thead` respectively).

And, just to be clear, I'm not advocating per-row presenters for any and every table in a GWT app. E.g. I would stick with `TabelModel` and `TableBulkRenderer` for more typical "data" tables--hundreds/thousands of rows that are read-only (or near-read-only).

Wrapping Up
-----------

That's about it. I've been very pleased with how things are going with this approach so far.

By stepping back and realizing the row was really its own view--finding the presenter/view decomposition sweet spot--I'm now able to unit test the in-row interactions on their own without even setting them up in the parent table.

The per-row display interfaces, so far, have been awfully simple and just as easy to stub out as the usual form-style name/description examples that make MVP look easy.

