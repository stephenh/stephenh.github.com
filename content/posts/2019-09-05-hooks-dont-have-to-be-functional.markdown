---
date: "2019-09-05T00:00:00Z"
section: TypeScript
title: Hooks Don't Have To Be Functional
---


**Update**: After having angst about this for a good week or so (i.e. writing the post), I came across Dan Abramov's well-articulated [post on function components](https://overreacted.io/how-are-function-components-different-from-classes/). Specifically I liked that he: a) directly talked about how obviously-similar FP and OO components are, and b) gave a very specific articulation of the goal FP's are trying to solve, which is capturing a snapshot of the entire props+state during each render.

I'm still skeptical that "hacking cross-render state back in to FP components" vs. "just use OO components with nice non-HOC/non-render prop 'hooks'-style APIs" is necessarily the best choice, but I can at least now appreciate what they're trying to do.

And, personally, it is somewhat annoying that I found Dan's one post much more helpful than the several pages of the official React hooks/FP/etc. docs I'd read, especially with their "trigger words" that "classes suck", without a more thorough/detailed explanation (as Dan provided). 

---

Hooks have made a big splash in the React ecosystem, and I'd been procrastinating taking a look at them. But I finally got a chance and have what I think is a unique-ish way of thinking/modeling them, if only to help understand how they work/what their benefits are.

As an up-front disclaimer/bias, I've had a nagging suspicion that hooks are over-hyped, as some of their marketing material leads to a "raised eyebrow of suspicion", i.e. sections like [Classes confuse both people and machines](https://reactjs.org/docs/hooks-intro.html#classes-confuse-both-people-and-machines). So in this post, I may just be chasing a self-confirming bias.

That said, statements like these, for me, require a ton of empirical evidence to back-up, because after doing this awhile, I've personally seen classes usually win out as "actually a pretty intuitive way for most people to model/think about the world".

I.e. when "OOP won" in the 90s (which I just missed), or (what I more directly witnessed) when "ES6 classes won" in the 2010s, despite much proclamations of "prototypes are superior...in theory", and yet everyone had their own bespoke "add classes to JavaScript" library in practice.

As a balance to this stated bias, I have become much more appreciative of FP (i.e. in many ways "FP has won" too), initially by working with Scala's collections and pattern matching, and more lately TypeScript's ADTs/etc. And I've started naturally preferring "just data + transformations" for domain/entity data, vs. "everything must be a class" (see [ts-proto](https://github.com/stephenh/ts-proto)).

So, I can see both pros/cons of the OOP/FP idioms and happily play both sides of the fence.

Anyway, back to the hooks.

What Are Hooks Good For?
------------------------

I'm going to assume general knowledge of hooks, and jump straight to the "oh I get" [raison detre](https://reactjs.org/docs/hooks-intro.html):

> Each [class] lifecycle method often contains a mix of unrelated logic. For example, components might perform some data fetching in componentDidMount and componentDidUpdate. However, the same componentDidMount method might also contain some unrelated logic that sets up event listeners, with cleanup performed in componentWillUnmount.
>
> ...
>
> To solve this, Hooks let you split one component into smaller functions based on what pieces are related (such as setting up a subscription or fetching data), rather than forcing a split based on lifecycle methods.

Ah, okay. That actually makes sense.

What they're saying is that a class like:

```typescript
class MyComponent {
  componentDidMount() {
    // do thing 1
    // do thing 2
  }

  componentWillUnmount() {
    // undo thing 1
    // undo thing 2
  }
}
```

Is complicated because you're organizing code by life cycle methods ("all mounts are in `componentDidMount`, all unmounts are in `componentWillUnmount`") vs. organizing by abstraction/purpose ("all thing 1 code" is in one spot and "all thing 2 code" is in another).

Do We Need to Kill Classes?
---------------------------

So, just as a thought experiment, I wanted to balance "okay, I get the goal of a different axis of organization" vs. "going all-in on functional components".

When I read their problem, it makes me think that we want to give discrete sets of business logic (i.e hook-using code, the "thing 1" and "thing 2" from our example above) two things:

1. Their own namespaced spot within the component's state 
2. Their own callbacks ("hooks") of the component's lifecycle.

So, let's try and model that.

Recreating `useEffect` in Classes
---------------------------------

I think `useEffect` is the easiest to recreate; we just want a list of functions to run as part of the lifecycle, i.e.:

```typescript
class HookableComponent extends Component {
  private effects: Array<Function> = [];
  private lastEffects: Array<Function> = [];

  public componentDidMount(): void {
    this.cancelAndRunEffects();
  }

  public componentDidUpdate(): void {
    this.cancelAndRunEffects();
  }

  public addEffect(effect: () => void): void {
    this.effects.push(effect);
  }

  private cancelAndRunEffects(): void {
    // If any effects returned functions, cancel them
    this.lastEffects.forEach(e => e());
    // Invoke the effects, and keep any return values that are functions
    this.lastEffects = this.effects.map(e => e()).filter(e => e instanceof Function);
  }
```

This "class-based hook" extension of `Component` let's us write our own (very naive, proof-of-concept) `useEffect`:

```typescript
function useEffect(
  component: HookableComponent,
  effect: () => void
): void {
  component.addEffect(effect);
}
```

And now our usage is extremely similar; here is out-of-the-box with a FP component and React hook:

```typescript
export function useFriendStatus(friendID: string): string {
  ...

  useEffect(() => {
    ...
  });

}
```

And here is our class-based approach:


```typescript
export function useFriendStatus(
  component: HookableComponent,
  friendID: string
): string {
  ...

  useEffect(component, () => {
    ...
  });

}
```

Note that we have to pass `component`, but I'm going to gloss over that for now.

So, all things considered, this was really pretty trivial: our `HookableComponent` just provides an API for snippets of code (`useEffect`, `useFriendStatus`, etc.) to subscribe to our lifecycle events.

In general, maintaining a list of callbacks like this is really pretty common in UI frameworks, so this is not terribly novel; although if anything what is novel is making `addEffect` a public API, and exposing an "implementation detail" like our lifecycle to just any random snippet of code.

(Note that, part of the benefit of modeling hooks this way (could we do this class-based?) is precisely because they bring up interesting correlations like this: the FP-based `useEffect` is effectively providing a public API for random snippets of code. Which is not bad, it is actually precisely the point that allows scattered (decoupled) logic to still coordinate around the component's lifecycle, and just interesting to think of it that way.)

Recreating the `useState` in Classes
------------------------------------

Making a class-friendly `useState` is just a little more intricate.

My first pass at this tried to use the component's regular `state`/`setState` methods, just with "hidden"/unique-per-hook keys, but this would conflict with the component's actual state usage, particularly in the constructor when they do `this.state = { ... }`.

So, instead I ended up adding a dedicated `hookState` field:

```typescript
class HookableComponent extends Component {

  private nextHookId = 0;
  // would probably not be public but this is proof-of-concept
  public hookState: { [hookId: string]: any } = {};

  public newHookId(): number {
    return ++this.nextHookId;
  }
}
```

Which when the class-based `useState` secures itself a unique key in:

```typescript
function useState<T>(
  component: HookableComponent,
  def?: T
): State<T> {
  const hookId = component.newHookId();
  const stateKey = `hook-${hookId}`;
  if (def) {
    component.hookState[stateKey] = def;
  }
  return {
    get(): T {
      return component.hookState[stateKey];
    },
    set(v: T): void {
      component.hookState[stateKey] = v;
      component.forceUpdate();
    }
  };
}
```

Similar to the class-based `useEffect`, this function takes a reference to the `component`.

In contrast to the FP-based `useState`, the return value is slightly different, it's a single `State` interface, with two `get` and `set` methods, instead of the `value` + `Setter` tuple.

This is because of the instantiation differences between my class-based hooks and the FP-based originals: I assumed mine would generally be instantiated _outside of `render`_, i.e. in a constructor or field initialization, and these run just once. So, instead of returning the value itself, we need to return a handle to the value, than then can be invoked in `render`, i.e. usage ends up looking like:

```typescript
export class AppClass extends HookableComponent {
  private status = useState(this);

  public render() {
    return <div> {this.status.get()} </div>
  }
}
```

I dunno, personally I think a single `State` return value with `get()` and `set()` methods is a more natural representation of what's happening, and it doesn't rely on the FP-based "this `useState` call happens to be invoked in the middle of (implicit FP component's) `render`, so we can go ahead return the concrete value" nuance/implementation detail. But, all things considered it's not a huge deal.

What's also interesting about my tiny/naive re-implementation is that it immediately highlights why the FP hook rule of "you must instantiate hooks in order" exists: because hooks don't have an identifiable, programmer-provided id, their "key in the bag of hook-based state" is based on implicit execution order. If you reorder hook calls, both my naive implementation, and the real FP implementation, will assign different hook ids.

Other Effects
-------------

I've not had a chance to create the other effects use, i.e. `useContext`, `useCallback`, etc., but I imagine the approach would be similar: just make a more concrete representation of how the effect is mutating the component, have the base `HookableComponent` keep the appropriate bookkeeping, and then invoke the effect's lambda at the appropriate time.

Composing Class Hooks
---------------------

Just like the FP hooks, our class-based hooks compose very naturally.

Here is the (simplified with timers and `console.log`s) `useFriendStatus` example from the hook tutorial:

```typescript
export function useFriendStatus(friendID: string): string {
  const [isOnline, setIsOnline] = useState('offline');

  function handleStatusChange(status: string) {
    setIsOnline(status);
  }

  useEffect(() => {
    console.log('Subscribing');
    const timer = setInterval(() => {
      handleStatusChange(`${friendID} ${new Date().getTime().toString()}`);
    }, 1000);

    return () => {
      console.log('Unsubscribing');
      clearInterval(timer);
    };
  });

  return isOnline;
}
```

And here is the class hook version:

```typescript
export function useFriendStatus(
  component: HookableComponent,
  friendID: string
): State<string> {
  const online = useState(component, 'offline');

  function handleStatusChange(status: string) {
    online.set(status);
  }

  useEffect(component, () => {
    console.log('Subscribing');
    const timer = setInterval(() => {
      handleStatusChange(`${friendID} ${new Date().getTime().toString()}`);
    }, 1000);

    return () => {
      console.log('Unsubscribing');
      clearInterval(timer);
    };
  });

  return online;
}

```

They are essentially identical.

Passing Around the Component
----------------------------

One big difference in the APIs between the FP React hooks and my naive spike is that I'm currently passing around a `component` parameter as the 1st argument to any hook method.

Honestly, I solely did this for expediency, as it's quicker/easier to prototype by passing it around explicitly than figuring out an implicit global state trick (more discussion below). But it's also an interesting design question.

Passing the component explicitly makes for a more verbose API, and it is admittedly boilerplate: yes, each hook call is going to need a `component`, why should we repeat ourselves every single time?

I've gone back and forth on this issue over the years, as it's an extremely common scenario when designing DSLs: a child piece of logic (here the hook) wants to know about the parent (here the class-based component, or in FP hooks the implicit FP component). So do you explicitly pass the parent, or somehow implicitly access it?

If you implicitly pass it, it means you store the parent in global state somewhere (usually in a stack to handle recursive instantiations), where the caller doesn't have to assign it, but once inside the child logic, the child logic can immediately grab it.

I.e. my naive class-based hooks could do something like this via:

```typescript
class HookableComponent {
  static currentComponent;

  constructor() {
    currentComponent = this;
    // let sub class's constructor run, which means any
    // hooks they create during their constructor can 'see' our
    // static currentComponent value.
  }
}
```

Now our hooks can have the same shorter API as React's FP hooks:
```typescript
function useState<T>(def: T) {
  const component = HookableComponent.currentComponent;
  // our existing code as usual
  const hookId = component.newHookId();
}
```

Once you know this "is this parent passed explicitly or implicitly" pattern, it shows up in many DSLs.

I.e. here is the [aws-cdk](https://docs.aws.amazon.com/cdk/latest/guide/home.html) DSL for creating an AWS Lambda in CloudFormation:

```
class MyStack extends Stack {
  constructor() {
    super();
    const api = new LambdaRestApi(this, "graphql-service", {
      handler,
      domainName: {
        domainName: `graphql.${domainTld}`,
        certificate: Certificate.fromCertificateArn(this, "cerf", certArn),
      },
      proxy: true,
    });
  }
}
```

The `LambdaRestApi` child component needs to know what parent it is part of (the `MyStack` instance), so we pass along the `this` explicitly.

...actually a third way is to have `add` methods in the parent component, i.e. something like:

```typescript
class HookableComponent {
  constructor() {
  }
  
  public addHook(hook: Hook) {
    hook.setup(this);
  }
}

// now in client code
class MyComponent extends HookableComponent {
  constructor() {
    this.addHook(useState(...));
  }
}
```

So, `useState` doesn't immediately create a hook, but instead waits just a little bit until `addHook` pushes the `parent` into it via a follow-up `setup` call. But, anyway, just mentioning for exhaustiveness.

Which approach is better? Explicit or implicit?

It's hard to say.

When learning how things work, I prefer the explicit approach because it really highlights "ah sure, this `useState(component, ...)` is "attaching" itself to `component` as a side-effect". Without that hint, I'm left wondering about how these two unrelated things, the `component` and the `useState`, are magically woven together. (Granted, it's almost always a global variable, but still just makes me stop and think.)

However, admittedly when churning out 1000s of components, as Facebook engineers are wont to do, I could see the repetitiveness being a little annoying, and once you know how it works, having the bookkeeping done automatically can be enticing.

I think all things considered, I'd probably keep explicit. Maybe.

Few Downsides of the Class-Based Hooks
--------------------------------------

I'll explicitly call out a few downsides of my current `HookableComponent` spike.

For one, it is based on inheritance, which I maintain "is not evil when used well/in-the-small", but will mean the usual "oh right" OO-isms like if a child overrides `componentDidMount()` and doesn't call `super.componentDidMount()`, then none of our effect hooks will work (the `useState` hooks would be fine in this scenario).

(Although if class-based hooks were built into React, they could invoke them in a safer/not-accidentally-override-able manner.)

I don't think we have a great way to mitigate this: TypeScript doesn't let us mark our `componentDidMount` as final, nor are there other JavaScript/language-provided semantics (although there are probably ways of enforcing this at runtime, i.e putting "marker" code in the base `componentDidMount` and then failing at some later when we notice "hey wait, the marker didn't get run").

More generically, our API surface is generally more tied to implementation details of the `HookableComponent`.

I.e. in FP hooks, especially with the implicit passing of the component, the calling code has no idea/coupling to how `useState` works. Callers pass very little parameters, and can (within the rules), invoke it whenever/however they want. It is more declarative.

This really tiny API surface is enticing for React maintainers, as it means there would be less breaking changes as React needs to refactor things down the road.

...although, now that I think about it, with an implicit-passing API and "hiding" the `HookableComponent` implementation details (i.e. `addEffect`, `hookState`, etc.) directly into `Component` as hidden implementation details (which is similar to how FP hooks are baked directly into FP components), the API surface may really not be that different.

So Are FP-Based or Class-Based Hooks Better?
--------------------------------------------

This admittedly is a trick question, because I think it depends on your preferences/biases.

If you've already decided you want FP-only components as an end-goal/true north (which, perhaps putting words in their mouth, but I think the React team has), and need to access the React state/lifecycle, etc., FP hooks look like a great way of doing that.

But, vice versa, if you've decided you don't mind class-based components, I think I've shown (at least to myself) that you can achieve the very valid points of "decoupling chunks of state/lifecycle logic from class method layout" with a few additions to the existing class-based component API, and not have to give up on classes.

I do have a somewhat pedantic quibble that I think the React Hook literature goes a bit too far in it's anti-class push, by somewhat zealously pursuing FP even when its not really FP. I.e. hooks very explicitly have side-effects. They are mutating "something". The "not class"/functional component is still there, just behind the scenes, effectively still creating a "combination of state + behavior" (...sounds like a class...), although not through the language-/spec-provided syntax, keywords, and semantics that we all already know, but through a DSL that is effectively recreating it.

Which at some point I worry that it becomes a leaky abstraction, and somewhat of a [Greenspun-ism](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule) where they're trying really hard to not use classes; but when you invoke a functional component, but then have to provide side-effecting/global-accessing functions that are going to stitch back together what is effectively a class, you may not have something that is inherently a bug-ridden/half-implemented/etc. version of OO...but is it really better?

Although, who knows, maybe it is.

I have my biases, and plan on sticking with class-based components indefinitely-ish, but the React team is paid to think about these issues full-time, across a huge React codebase within Facebook, and they're pretty smart. So, I should given them the benefit of the doubt (while also thinking critically/independently about their own biases/etc.).

And, even if React's hooks are "meh, something you can do with classes", pushing state-of-the-art thinking and implementations, and providing options, to approach something more FP is not bad either. Progress takes experimentation.

Hm...Why Not Support Both FP and Class Components?
--------------------------

Now that I've kicked the tires a bit, I'm actually curious whether React could/should just support hooks in both component styles (i.e. using hooks from either FP-based or class-based components).

Right now hooks blow up if you're not in a FP component (using that implicit global state as an indicator); but they could just as well use the same state to flip from FP-mode to class-mode, and add all of the same hooks they're adding to the FP component to the user's class component (granted, with some caveats/compromises/contracts about how it interacts with any explicit logic the user has hand-coded in their own `componentDidMount`/etc. methods).

And if you change my naive prototypes to use the implicit passing style, the `useState`, `useEffect` usage code is 100% the same (...almost, see the next paragraph). I.e. the `useFriendStatus` meta-hook still builds on the `useState` and `useEffect` hook primitives and none of them have to be any wiser about whether they were used in a FP-based component or a class-based component.

The biggest compromise (i.e. breaking change) would be the `useState` return values changing from `[value, setter]` to `State`, to unlock/allow class-based components to instantiate their hooks outside of the `render` cycle. Perhaps it is too late for such a breaking change, but it would be unfortunate if a "only very slightly worse" API for FP components (i.e. they need to call `state.get()` now) would mean now an entire class of components (class-based) are locked out of hook-based APIs and business logic (which is the case today).

I dunno, it just seems like a boon for libraries (like Apollo, etc.) to have a single way of supporting all of their clients (FP-using and class-using), without the maintenance, documentation, and learning overhead of providing separate APIs for each style.

...given how easy I think this _should_ be, I have to imagine this design consideration came up during the Hooks design process (i.e. "hey if we made a few small compromises, then class components could use hooks too, so why not?"), and they must have explicitly decided _not_ to support hooks in class-based components.

That seems irksome if so, because it supports the somewhat-tin-foil-but-perhaps-not-really theory that React's long term view is to deprecate class-based components all together. Which I don't want to immediately/knee-jerk dislike...but seems like it (throwing out class-based components) could another "HoCs are amazing...two years later...oh wait" type things.

Or, alternatively and more realistically, there is a lot more nuance to supporting hooks in both styles in a first-class/best-in-class manner.

Hacking Invitation
------------------

If you'd like to play with, spike, fork, add tests, pull request any of the "hooks-for-classes" code, it's currently [here](https://github.com/stephenh/hooks-sandbox).

Post-Draft Thoughts
-------------------

After writing this up, I did a few days of thinking and prototyping.

I'm hooking up React Apollo in our app, so gave Higher-Order-Components a try. After reading [this great post](https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb), I don't think HOC's are _that_ bad in theory. Instead, I blame the React Apollo HOC implementation specifically for trying to have too jank of "sometimes we flatten, sometimes we alias" semantics in which props it injects, which turns out yes is hard to type. I'm tempted to think that just making the semantics simpler (not only to type but then also use), the backlash against HOC would not have been so bad. (That and also more widespread use the `Subtract` type mentioned in that post, which as far as I understand is essentially required to make the HOC types work.)

I very briefly looked at porting the React Apollo `useQuery` / `useMutation` FP hooks to my very-naive/WIP class-based versions, but that sucks, I don't want to be continually porting over every FP-based hook I want to use to my (again naive) class-based hook primitives, just to prove it's possible. Even if it's (ideally) very trivial due to how similar the mine-vs-theirs APIs are, they are not exact.

And, as I think about compromising and "fine, I'll write FP-based components", it strikes me as annoying how _similar_ they will be to OO components: they'll have a bunch of local state (hooks) defined at the start (like OO fields) with a bunch of small functions (like methods) broken up to handle the rendering. They will essentially be isomorphic, or as a friend put it: "classes vs functions is a misnomer - classes are just bundles of (organized) functions that close over mutable state".

Which is exactly what FP components + hooks are reinventing.

That said, I think I'm caving; fine, I'll use FP components. I'm honestly fairly resentful, given I like to use both OO and FP, where each is appropriate, but, even just while playing with React Apollo, it's apparent that React really is effectively forcing everyone to use FP components by locking up all of the "non-shitty ways of using libraries" behind the "FP only" hooks paradigm.

If this was purposeful, it was well-played. I seem to be the only one complaining "wtf hooks, no classes?"; the wider ecosystem seems to be thrilled with hooks, which having fought React Apollo's HOC, I get.

Perhaps I am missing something about why hooks could not have been implemented into both class-based component and FP-based components; I wasn't paying enough attention at the time they were proposed/talked about/released to have watched for any design docs with "could we support classes too?" rationale.




