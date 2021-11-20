---
date: "2018-07-08T00:00:00Z"
categories:
  - Testing
title: Avoid Using External Files in Tests
---

I've seen more projects using external files in unit tests lately.

By external files, I mean a unit test that uses checked-in files like `test/.../MyTest-input.json` or `test/.../MyTest-output.json` for doing either input data setup or output data verification.

It seems like I went awhile without seeing many of these file-based tests, at least widely used, but then recently two primary culprits seem to have made them more popular:

* Jest snaphots of DOM/React trees
* HTTP request/response input/output mocking

Although I understand their allure, I'm generally not a fan of these approaches; specifically, I don't like that they cause:

Constant Eye Jumping During Code Reviews
----------------------------------------

In my opinion, code reviews with input/output files are a mess.

My eye has to constantly jump around:

* "Okay, what boundary case is this...look in the test...the test name is 'expect foo bar'..."
* "Okay, go find the 'foo bar' input file...where it is, find-by 'foo bar', okay got it!"
* "Okay, now actually read the input file, does that much the boundary test we say it is?"
* "Damn it, what was the boundary case? Skim back to the test file...okay, it's X..."
* "Back to the input file...yes, yes, that looks like X, good."

This jumping around wastes a ton of time, and mental pattern matching that I should be applying to "does the code/test actually do what it says it does".

With one or maybe two tests in a PR, I can hold out, but especially once there are ~3+ boundary cases in a PR, I inevitably give up and figure, well, the author probably got it right.

(I have considered adapting my PR workflow to always have two windows open, side-by-side, so I can read the test on the left, and the input/output file on the right, but I've not tried this yet.)

Input Data Overload During Code Reviews
---------------------------------------

As I'll likely repeat a few times, file-based input has zero abstractions, which means constant repetition in the files themselves.

This can *seem* like simplicity, "the input data is obvious because all 20 lines of the input file/HTTP request/whatever are right there".

However, in a code review, or maintenance, it's exactly the opposite:

* "Okay, what boundary case is this...okay, 'when the account is frozen'..."
* "Okay, go find the input file...there are 10 accounts in this input file...which one is the frozen one...?"
* "Okay, found the test account that I'm ~80% sure is for the frozen boundary case...there are 20 lines of JSON attributes for this one account...how many of them matter for this test? Just status=frozen?..."
* "Huh, on this frozen account, the account name is slightly different than the other accounts in this file...does that matter for this boundary case?"
* "What about this account status date? Is that just default status date, and so I should ignore it, or does the combination of status=frozen and status date matter?"

The purported simplicity of "you see exactly what all of the input data is" actually drowns out the signal of "what matters for this test case".

I'll discuss this more below, but I think abstractions are good to say "here's all the default stuff you don't care about (hidden behind 1-2 lines of fixture code) + here's what makes this case unique". This gives you a much higher signal to noise ratio.

Output Data Overload During Code Reviews
----------------------------------------

The same thing happens when doing code reviews of output files, e.g. Jest snapshots or HTTP responses.

For example, if a test is for the "turn the button blue" UI boundary case:

* "Okay, what boundary case is this...the button turns to blue..."
* "Okay, go find the output file...found it..."
* "Okay, there are ~20 lines of JSON here with random tree of DOM tags in it...where is 'blue'..."
* "Ah, found it, line 15 of 20...yep, looks good"

I've had to skim-to-ignore 95% (19/20) lines in the output file to find the *single* line that is meaningful to this boundary case.

Note that, for test cases that do focus on "how is the entire tree of DOM elements rendered", I think Jest snapshots are more warranted/can be okay. You get the obvious portrayal of "no really, here is how *all* of your components look". That's great, and I think is what starts people down the "these snapshots are amazing" path.

However, I assert these "focus on the shape of the entire tree" boundary tests are only a small subset of your UI tests, and that most will be "how did this *one* aspect of the UI change", and for those tests, output file verification over-encode way more data than needs to be there.

Output Data Over-Specification Leads to False Negatives
-------------------------------------------------------

Following on the previous point, file-based output assertions are very likely to break unnecessarily.

For example, consider the "turn the button to blue" boundary case again.

With a snapshot test, if I change my component layout in any way, every single snapshot test for that component will break.

But did I really break the "change the button to blue" business logic? Probably not. ...or maybe so... Who knows?

To figure this out, we're back to the game of "guess what lines of the output file actually matter":

* "Okay, the snapshot for this 'change to blue' test changed..."
* "I see line -10 red lines and +10 green lines in git diff..."
* "What exactly in the red lines before was good/actually mattered...oh right, the line that says 'blue'"
* "Where is the new line that says 'blue'...okay, it's over here...yes! that is still working"

And, also, we have to play this game *at least* twice: once when the author figures it out, and again when the code reviewer verifies the change. (It can also easily be more than two times, if the author has to attempt their refactoring more than once, and also if there is more than one code reviewer.)

So, now you're staring at ~15 snapshot-based test failures (assuming your component has ~15 boundary cases it covers), that are all failing due to nit-picky tree changes, with tons of red/green lines, are you really going to read every single line, and figure out "did this 1 line of JSON out of 30 lines of JSON still look like it should?"

No, you're going to skim it, assume "yeah, it's probably good", and commit.

And then your code reviewer will do the same thing on the PR.

No Capability To Build Abstractions
-----------------------------------

All of the issues so far have hinged on the same thing: files have no ability to apply abstractions.

With file formats, like JSON or XML or plain/text files, you have no ability for code reuse: all you can do is copy/paste.

Programming languages have abstractions for a reason, and we're programmers, leveraging and building good abstractions is what we do (less bad abstractions, more good abstractions); so, let's stay in the language and get that benefit.

Too Much Accidental Focus on Serde
----------------------------------

Besides just lack of abstraction, file-based formats are typically over-coupled to the serde (serialization/de-serialization) concerns/details of your system.

For example, let's say my boundary case is "make sure I upload the account with status=closed".

That's what I really want to make sure my business logic does.

But what does the file-based HTTP response output/snapshot look like? It's a dump of what an account serialized as JSON with `status: closed` looks like.

Does my test really care whether my wire protocol is JSON? No. Does my test really care that I talk HTTP to my external system? No.

However, because I'm using file-based input/output snapshots, I've introduced this accidental coupling to all of my tests that "when this account is dropped on the wire, it's in JSON, via HTTP, with these various HTTP headers".

All sorts of things that don't matter to the business case of "just set the status to closed".

Typically I avoid this by using client interfaces (as in Java interfaces, or whatever equivalent your language of choice has), e.g. instead of asserting "JSON on the wire looks like X", you assert "I handed off the account to be saved", e.g. `accountClient.save(account)` was called (or, even better, have a [state-based stub/fake client](/2010/07/09/why-i-dont-like-mocks.html)), and that your code-under-test passed the `account` with the right attributes/state for your test case.

Basically you have an abstraction layer (ideally a type-safe contract!) between your system and outside systems, and have the majority of your tests use that decoupled contract, but can be blithely unaware of how that contract puts things on the wire in production.

Granted, you're giving up "covering what this account *actually* looks like on the wire", but that should be tested elsewhere: you should have dedicated tests for "how does `AccountClient` put `Account` JSON on the wire", and test that once/in one place, and not sprinkle/duplicate that concern in every single account business logic test.

(I talked about this [back in 2012](/2012/07/23/faking-at-the-right-level.html) but the article needs some touching up.)

(Also, I understand that asserting "`accountClient.save(account)` is good enough" but then having non-trivial serde logic behind the `save` method that is untested can be unnerving, and that is very valid, but it's also why I enjoy IDL-/code generation-driven schemas/contracts, because you can trust the codegen-/library-based serde.)

So Why Is It So Popular?
------------------------

So, if "snapshot testing sucks" (taken to the extreme), why is it so popular?

I think there are a variety of reasons that file-based input/output testing is initially compelling:

1. An increased sense of confidence, because you're asserting more "end to end" (as in to the wire level).

   A tongue-in-cheek version of this is: "look at all the output it's asserting against, it must be better".

   And, granted, [cross-system integration testing sucks](/2017/08/23/futility-of-cross-system-integration-testing.html), so I'm very sympathetic of trying to solve that problem, I just think file-based input/output is too behavior-based and too low-level.

   Granted, building state-based abstractions is expensive (e.g. a fake stateful backend), but you could at least construct your behavior-based input/output via abstractions/builders instead of copy/paste (avoids information overload and over-specification).

2. Dynamically-typed languages lack basic guarantees over serde, so forcing even business logic tests down to the serde-level assertions in less total tests, as you've combined your "does business logic work" with "does serde work".

   E.g. with dynamic formats like JSON, constructed in dynamic languages like JavaScript, via just maps of maps of maps, intricate/rare pieces of your serde output may only be exercised when specifically driven by equally-intricate/rare business logic, and it would be tedious to make two tests (one logic, one serde) for each rare business case in your system.

   So, for these systems, it is technically cheaper to test both at once. Which is true, but for me is a (debatable) local optimum vs. finding/moving to a better global optimum of having a more reliable, typed contract interface between systems.

3. Assuming you get snapshot infra out-of-the-box (e.g. Jest snapshots or VCR libraries), file-based input/output tests are extremely quick and cheap to get started.

   E.g. for input-based tests, you don't have to write/explore a builder/DSL/fixture library that is inherently specific to your domain (i.e. by definition you *can't* get off the shelf) to setup "world looks like X". This takes time and investment, vs. something like record/replay, where you just assume "hey, we've got this huge production database, let's record that, and we're done".

   And e.g. for output-based tests, you don't have to write assertion helpers to tease apart your "world now looks like Y" component/system/state, you can just learn a single `.toMatchSnapshot()` convention up-front, and then get the "make sure it hasn't changed" assertion "for free" in all of your tests.

4. File-based approaches are similar to table-based testing, e.g. a fairly declarative "take X, make it Y".

   I actually like declarative approaches, but my angst is that ideally the declarations of `input X`, `output Y` are small and specific (which makes writing, debugging, and code reviewing the test's boundary case easier), vs. external files which are typically large/repetitive.

   E.g. your declarations should be succinct enough to fit into the test's source code file directly.

Sometimes They Do Make Sense
----------------------------

As a quick aside, I don't think file-based tests are always inherently evil: sometimes they do make sense.

If you're parsing real file-based input (e.g. large/binary input), or generating real file-based output (e.g. PDFs), both of which would be hard to represent in source code "here's my few lines of input" form, then external files can be good/necessary.

Particularly if your output assertions are very intricate, e.g. I've seen compiler test suites use text-encoded versions of the AST of parsed input as output assertions: this makes sense to me as ASTs are extremely verbose/tedious, and also compilers in general have to be very exact (but are also low-churn, e.g. I don't imagine how a compiler parses a given input program into a given output AST changes that much).

(This is in contrast to React/DOM trees, which are often validly high-churn, hence the previously-mentioned risk of over-specification and false negatives.)

What To Do Instead? First Principles
------------------------------------

Fine, I've complained a lot, what should we do instead?

Instead of just saying "I like this better", I propose the following two 1st principles:

1. A boundary case's test method should have lines of code that *only matter to that boundary case*.

   If I'm setting up account input data for handling closed accounts, there shouldn't be lines about "the account name is foo" (doesn't matter), "the account currency is USD" (doesn't matter), or whatever the other boilerplate/default attributes of my entities are. Similarly, I shouldn't have lines that are coupled to the serde format (unless these test methods are specifically dedicated to testing the serde format itself).

   If I'm asserting against button output behavior (e.g "when clicked, turn blue"), there should not be lines about "the button has the text 'Save'" (doesn't matter), "the button is nested within a container with attributes ..." (doesn't matter).

   **Only lines that differentiate the input data and output data for this specific boundary case matter.**

   The benefits here are as highlighted above: maintainers and reviewers don't get lost considering "does this line matter to the test? which lines do matter? which lines do I care about?"

2. A boundary case's test method should have *as much locality as possible*.

   The author/maintainer and code reviewer should be able to stay locally within the method, as much as possible.

   **This keeps their attention in one place, and avoids breaking flow, for both writing and reviewing code.**

   Obviously this pretty much disqualifies file-based input/output outright.

   (Note that, I advocate test fixtures/DSLs and, pedantically, if you are new to the DSL, your first few times you do need to go read the fixture/DSL methods and figure out what they do, however: a) ideally they are extremely obvious, e.g. `newAccount().closed()` is probably a closed account, and b) you'll quickly learn the DSL, know to trust/infer the data it is creating, and keep your primary attention to within the test method itself.)

What Do To Instead? An Example
------------------------------

As long as you follow these principles, I'm generally ambivalent about what your tests look like (probably...), but for me they lead to my "one true format for tests":

```java
public void testWhatever() {
  // Given the world looks like X
  ...make entity one...
  ...make entity two...
  ...make entity three...

  // When action happens
  ...system under test...

  // Then the world looks like Y
  ...assert entity one is now...
  ...assert entity two is now...
}
```

This builds on many things: [Using Given/When/Testing](/2017/11/28/given-when-then.html), [Obsessively Simple Test Values](/2017/01/07/obsessively-simple-test-values.html), [Why I Don't Like Mocks](/2010/07/09/why-i-dont-like-mocks.html), and an as-yet-unwritten piece of test builders/fixtures.

Making this more concrete, for "save the account" test, what I like to see is:

```java
public void testSaveAFrozenAccountAsClosed() {
  // Given a user with a frozen account
  var user = newUser().defaults();
  var account = user.newAccount().frozen().defaults();

  // When we process the account
  process(account);

  // Then we've flagged it as closed
  assertThat(load(account).getStatus, is(CLOSED));
}
```

For a component test that is "make the button blue", what I like to see is:

```javascript
it('turns the button blue', () => {
  // given our component is mounted
  const view = mount(<Hello name="World" />);

  // when the user does something good
  view.find(Button).filter({ title: "+" }).props().onPress();

  // then we've turned the text blue
  expect(view.find(Text).hasClass('blue')).toBeTruthy();
})
```

For both of these cases:

* I've used test builders/DSLs/fixtures to quickly configure a "world looks like X" input. Using abstractions.
* I have a single (or ~2-4 max) lines of assertions that pin-point exactly what the test cares about, for "world now looks like Y", and nothing else.
* It's extremely easy to copy/paste ~these 10 line test methods into a new test method, tweak the input case, and go back to TDD.

As a maintainer, and a code reviewer, I would feel more much comfortable scanning these ~10 lines of code, all in one screen, and vetting "yep, this does what the boundary case says", vs. finding/scanning/finding/scanning external files.

Granted, the code reviewer and maintainer have to know and trust the DSL: e.g. maybe I don't know what `mount` does, or maybe `mount` is broken: but that is life as a programmer, learn the abstraction, make sure the abstraction works, and then reuse it across your entire codebase. That is where the pay-off is; if we wrote `mount` and only used it once, it'd be super expensive and silly. But if we used it across all React components in our project? Then it's probably useful.

Conclusion
----------

tldr: I think external file-based tests are tedious write, maintain, and code review.

It is more up-front work, but I think systems are better off building abstractions and infra to allow **high signal to noise ratios** and **high test locality** with test methods, to **avoid data overload** and **overly specific/fragile/coupled tests**.

(Apologies, I might be **abusing bold text**.)

See Also
--------

* [The case against React snapshot testing](https://engineering.ezcater.com/the-case-against-react-snapshot-testing) makes many of the same points


