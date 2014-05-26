
Personally, instead of having class-wide test data like this, I like to move any test data related to assertions into the test methods themselves, because it makes it much more explicit that "for this test case, we're using this test data". 

(E.g. I was reading some of the "basicTest" and wondering "huh, I wonder why money.cnn.com is good/bad/special here ... oh, right, here it is, 20 lines up in the file" vs. just seeing it 2-3 lines above the assertion.) 

(Obviously if you end up having some test data setup in each test method that is truly the same, e.g. it's not related to any of the test methods' assertions, then class-wide data is great to reduce copy/paste.)


---




---


I find when you get 3-4 test methods in, it's easy to forget what exactly was done in setup, hence when reading unfamiliar code, I prefer setup to be all tangential/infrastructure type stuff that is not really interesting to any of the use cases being tested. 

Then when I'm 3/4ths of the way down in the class, always having the trio of "input, action, output" or "given, when, then" makes following the use cases easier, IMO. Even if it results in a few lines of duplication of a few common "given" lines. 

Otherwise it's easy to just see "action, output" (or "when, then") and wonder why the behavior output happened--does it always happen that way with no input? Is it the default? Oh, no, it's just the response to the "common" input that was in setUp 20-30 lines up. 

That is my preference anyway. This is a small enough class/test that isn't not a big deal either way.


