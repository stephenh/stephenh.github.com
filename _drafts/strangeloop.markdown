
0mq Talk
--------

The founder of 0mq gave a very interesting talk. I don't know a lot about 0mq, but the highlights of the talk where:

* Simple contracts and state machines are awesome--I agree!

  0mq, or at least this presenter personally, seems to have a nice way of documenting their contracts/state machines, and have been thinking about/using them successfully for a long time.
 
  I really need to go read up on what they do and steal their best practices.

* Code generation (when done well) is awesome--I also agree! This guy is smart!

  He mentioned a library "iMatix GSL" that is some kind of code generation super charger...I didn't really follow why, but I need to go check it out.

  He also makes an interesting assertion that code generation reduces the potential size of your contributor pool. If I recall correctly, the idea is that manual/boilerplate code is easy for anyone to just hack up, but that the abstractions of code generation can be harder for people to follow, or make it harder to customize one-off cases that don't hit the codified standard.

AngularJS
---------

The author of AngularJS, Misko Hevery, gave a good intro talk. Basically, AngularJS is awesome.

Afterwards, I caught up with Misko in the hallway, where he gave me his condolences for still being a fan of GWT ("Stockholm syndrome" was his exact words). 

When I proffered my explanation that I'm a static typing bigot, he related that he had been too, but had given it up once he could have a test suite that executed in ~1-2 seconds.

I'm not convinced; just like types don't replace tests, I don't think tests replace types.

For me, personally, both increase my productivity. Types make it extremely quick to refactor code, as you can see exactly where things break, and then tests follow up and make sure you're decisions were correct.

Granted, without the types, your tests will fail. But for each failure, you'll have to reason about the failure and go find the root cause. It seems faster to just have the compiler tell me, at least for the trivial cases, what is going to fail for syntactic reasons, and then I can focus on only the tests that fail for semantic reasons.

Also, Misko mentioned [Testacular](http://vojtajina.github.com/testacular/), which e
