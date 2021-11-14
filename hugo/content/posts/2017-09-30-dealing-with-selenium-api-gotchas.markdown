---
date: "2017-09-30T00:00:00Z"
section: Testing
title: Dealing with Selenium API Gotchas
---


I've used the Selenium API, in pleasure and rage, for years, and it's still difficult to find a 100%-perfect approach. So I thought I would write up the current options that I weighed.

Raw API
-------

You can start out using the raw API, e.g.:

```java
driver.findElement(By.cssSelector(".foo")).click();
driver.findElement(By.cssSelector(".input")).sendKeys("input");
```

There are a few issues with this:

* It scatters selectors throughout your tests
* The low-level `click` and `sendKeys` methods are somewhat naive

E.g. for the `click` method, invariably it works until we run on CI, and the browser resolution is slightly different, and the want-to-click element is off screen. So we need our own click method:

```java
public void click(WebElement e) {
  // Unfortunately Actions.moveToElement doesn't really work
  ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);
  new Actions(context.webDriver).moveToElement(element).click().perform();
}
```

Similarly, `sendKeys` doesn't cause a change/unfocus event (which is good if you don't want that to happen, but in ~90% of the times, you do), so we have a `setValue` method:

```java
public void setValue(WebElement e, String text) {
  // remove existing text
  element.clear();
  element.sendKeys(value);
  // onchange event will not fire until a different element is selected
  element.sendKeys(Keys.chord(Keys.SHIFT, Keys.TAB));
}
```

So, fair enough, we have some helper methods.

To solve the scattered-selectors problem, we use the well-known [page objects](https://github.com/SeleniumHQ/selenium/wiki/PageObjects) pattern:

```java
public class FooPage {
  public WebElement getFirstName() {
    // use a base class/helper method for findElement(By.cssSelector(...))
    return get(".first-name"); 
  }
}
```

(Granted, a more strict page objects approach would be not expose any WebElements at all, as they are treated as internal implementation details that the test should not be coupled to, and instead the page object exposes bespoke methods for the test to use, like `public void setFirstname(...)`; I get the appeal of this, but IMO it risks creating huge page objects, with a ton of boilerplate helper methods, so I generally prefer to let tests directly poke the `WebElements`, but at least get them from the page object, and as needed add higher-level helper methods, like `fooPage.fillInDefaults()`, which are abstractions that are legitimately useful.)

Fair enough. Now, the nuances.

Implicit Waiting
----------------

Note that, if at all possible, you should stay away from implicit waiting and use post-action waiting, e.g. see [this post](/2011/10/14/sane-selenium-testing.html). Knowing explicitly that your page has "settled" and all AJAX/deferred calls are done is the best way to get reliable selenium tests.

However, if your application does not have that instrumentation, you may want to enable implicit waiting:

```java
  driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);
```

This is handy, because the wait is built-in as a first-class notion in the Selenium wire protocol, so if it takes ~5 seconds for an element to show up, instead of your selenium test making ~10-20 wire calls to the (say) Chrome process or Selenium grid, asking "is it there?", "is it there?", "is it there?", you make a single blocking call, and the Chrome/Selenium grid will do the polling/waiting on it's side, and then return immediately.

So, if you have to use this, that's fine.

However, if you're using the page object pattern, that means every single call in your test will now get that implicit wait, e.g.:

```java
  // will implicit wait, good!
  setValue(page.getFirstName(), "foo");

  // will also implicit wait...we just wasted 30 seconds
  assertNotFound(page.getFirstName());
```

We basically need to conditionally disable the implicit wait, if we know that we're doing a "not found" assertion.

A boilerplate way of doing that would be:

```java
  disableImplicitWait();
  assertNotFound(page.getFirstName());
  renableImplicitWait();
```

But this is pretty boilerplate. A better approach would be to use a lambda to make our look up lazy:

```java
  assertEquals(isFound(() -> page.getFirstName()), false);

  ...

  public boolean isFound(Supplier<WebElement> f) {
    try {
      disableImplicitWait();
      return f.get().isDisplayed();
    } catch (TimeoutException | StaleElementReferenceException | NotFoundException e) {
      return false;
    } finally {
      enableImplicitWait();
    }
  }
```

Dealing with `StaleElementReferenceExceptions`
----------------------------------------------

So far, so good. We can occasionally make lookups lazy, e.g. for `isFound` calls, with a lambda.

Unfortunately, there is another, more pervasive, reason to make essentially all lookups lazy, which is StaleElementReferenceExceptions (again, unless you're posting post-action explicit "settle" waiting).

Obviously, stale exceptions can happen if you hold a `WebElement` for a long-time, e.g.:

```java
  WebElement firstName = page.getFirstName();
  
  // do something that causes a re-render
  setValue(firstName, "blah");

  // fails with StaleElementReferenceException, because WebElement
  // was a pointer to a very specific DOM element that has since
  // been thrown away and re-created
  assertTrue(firstName.isDisplayed());
```

This is pretty easy to solve (in theory) by not keeping local variables of `WebElement`, e.g.:

```java
  setValue(page.getFirstName(), "blah");

  // a re-render happened

  // re-lookup a fresh WebElement
  assertTrue(page.getFirstName().isDisplayed());
```

Seems good. But in reality we've only reduced the window where a stale exception can happen. E.g. pedantically if we did:

```java
  setValue(page.getFirstName(), "blah");

  // actual flow could be:
  // page.getFirstName() --> returns a WebElement
  // some pending rendered we didn't know about happens
  // inside setValue, StaleElementReferenceException happens
  nowStaleElement.sendKeys("blah");
```

Which, granted, this is a very tiny window, but still, we're shooting for 100% reliability.

So, without explicit post-action waiting, are we going to have to wrap *all* of our methods in "try again"? E.g.:

```java
  setValue(() -> page.getFirstName(), "blah");

  public void setValue(Supplier<WebElement> e, String value) {
    retryOnStaleElement(() -> {
      setValue(e.get(), value();
    });
  }

  private void retryOnStaleElement(Runnable r) {
    for (int i = 0; i < times; i++) {
      try {
        r.run();
        return;
      } catch (StaleElementReferenceException e) {
        // retry
      }
    }
    throw new RuntimeException("Retries failed");
  }
}
```

I think this is the most "robust", but passing lambdas all over the place sucks. It makes our tests a lot messier.

Returning Something Else?
-------------------------

So, maybe instead of returning `WebElement`, which is super-finicky and low-level, our page objects should return something else.

There are a few options.

### Returning `By` objects

To me, the most natural one would be to return the `By` type, which is Selenium's abstraction of "find me an element". So that might look like:

```java
  public class FooPage {
    public By getFirstName() {
      return By.cssSelector(".first-name");
    }
  }

  // in test
  setValue(page.getFirstName(), "blah");

  // in utils
  public void setValue(By by, String value) {
    retryOnStaleElement(() -> {
      setValue(driver.findElement(by), value);
    });
  }
}
```

Unfortunately, the biggest con to this is that `By` is not nestable.

What I mean if that sometimes (not often, but frequent enough) you want to find an element within an another, e.g. something like:

```java
  WebElement table = driver.findElement(By.css(".table"));
  WebElement cell = table.findElement(By.css(".cell"));
```

Granted, you can usually make this a single selector (if you're using CSS):

```java
  WebElement cell = driver.findElement(By.css(".table .cell"));
```

But you're duplicating the `.table` selector. If you have ~10-20 elements to find within the table, you're going to duplicate your `.table` string. Granted, you can do a constant like:

```java
  public class FooPage {
    private static final String TABLE_SELECTOR = ".table";

    public WebElement getTable() {
      return get(TABLE_SELECTOR);
    }

    public WebElement getCell() {
      return get(TABLE_SELECTOR + " .cell");
    }
  }
```

Which, dunno, maybe I should just be fine with that. But it assumes you're using CSS selectors, and just seems a little ugly.

I'd prefer first-class composition, like:

```java
  public class FooPage {
    public WebElement getTable() {
      return get(".table");
    }

    public WebElement getCell() {
      return get(getTable(), ".cell");
    }
  }
```

But we're back to the issue of `WebElement` being non-lazy, and there is no way, AFAIK to use `By` like:


```java
  public class FooPage {
    public By getTable() {
      return By.cssSelector(".table");
    }

    public By getCell() {
      // returns a "nested" By...this API does not exist
      return getTable().find(By.cssSelector(".cell"));
    }
  }
```

### Return string selectors

A very low-tech approach would be to just return string selectors:

```java
  public class FooPage {
    public String getFirstName() {
      return ".first-name";
    }

    public String getTable() {
      return ".table";
    }

    public String getCell() {
      return getTable() + " .cell":
    }
  }

  // in test
  setValue(page.getFirstName(), "blah");

  // in utils
  public void setValue(String selector, String value) {
    retryOnStaleElement(() -> {
      WebElement e = driver.findElement(By.cssSelector(selector), value);
      setValue(e, value);
    });
  }
```

This surprisingly solves a lot of our issues (it's inherently lazy, easily composable)...as long as all of your lookups use the same `By` lookup, e.g. `By.cssSelector`.

If you tried to use `By.cssSelector` sometimes and `By.xpath` others, this approach breaks down.

It's also just feels dirty, passing raw strings all over the place, but that is admittedly just my habitual gut reaction.

### Return element objects

One potential pattern is to introduce our own "element objects", which move the deferred lookup and helper methods into a "better-than-WebElement" API.

E.g. it might look like:

```java
  public class FooPage {
    public InputObject getFirstName() {
      return new InputObject(".first-name");
    }
  }

  public class InputObject extends ElementObject {
    public InputObject(String cssSelector) {
      super(By.cssSelector(cssSelector));
    }

    // now we put our util methods here
    public void type(String value) {
      retryOnStaleElement(() -> {
        WebElement e = super.getElement();
        setValue(e, value);
      });
    }
  }

  // in the test, we get a nice API
  page.getFirstName().type("blah");
```

I think this is my favorite abstraction, as it moves our tests away from knowing about `WebElement` all together.

I wrote a library that does this awhile back, unfortunately with a very unimaginative name, [pageobjects](https://github.com/stephenh/pageobjects/tree/master/src/main/java/com/bizo/pageobjects) but have not been using it recently.

Note that the element object still has the composable problem, e.g. if we wanted to do:

```java
  public class FooPage {
    public ElementObject getTable() {
      return new ElementObject(".table");
    }

    public ElementObject getCell() {
      return new ElementObject(getTable(), ".cell");
    }
  }
```

We need some way to lazily represent "look up element A, then element B".

My current guess is that both the "return `By`" approach and the element object approach fundamentally need a new type, currently/hackily called `Bys`, which knows how to add nested lookups on top of `By`, e.g. the API would be something like:

```java
  public class Bys {
    private List<By> bys = new ArrayList<>();

    public Bys(By single) {
      bys.add(single);
    }

    public Bys(Bys existing, By nested) {
      bys.addAll(existing);
      bys.add(nested);
    }

    public WebElement findElement(WebDriver driver) {
      WebElement current = driver.findElement(bys.get(0));
      for (int i = 1; i < bys.size(); i++) {
        current = current.findElement(bys.get(i));
      }
      return current;
    }

    public Bys then(By nested) {
      return new Bys(bys, nested);
    }
  }
}
```

Now our page objects can return it with easy nesting:

```java
  public class FooPage {
    public Bys getTable() {
      // creates new Bys(By.cssSelector(...));
      return get(".table");
    }

    public Bys getCell() {
      // creates new Bys(table, By.cssSelector(...));
      return getTable().then(".cell");
    }
  }
}
```

I've not actually used this yet, but I like it, and probably should.

Done
----

So, anyway, that is my current thoughts on the various gotchas related to Selenium and the `WebElement` API.

Basically, in my opinion, you have to wrap the `WebElement` API with some sort of higher-level library to get good usability, test readability, and most importantly test reliability.

Note that I don't fault Selenium for this, I'd prefer they focus on making a rock-solid core library, and defer to higher-level libraries to iterate on different styles, fluent DSLs, etc., where iteration can happen quickly/easily on top of their core.

