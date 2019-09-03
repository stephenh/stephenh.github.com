---
layout: draft
title: Hooks Don't Have To Be Functions
section: TypeScript
---

{{page.title}}
==============

Hooks have made a big splash in the React ecosystem, and I'd been procrastinating taking a look at them. But I finally got a chance and have what I think is a unique-ish way of thinking/modeling them, if only to help understand how they work/what their benefits are.

As an up-front disclaimer/bias, I've had a nagging suspicion that hooks are over-hyped, as some of their marketing material leads to a "raised eye brow of suspicion", i.e. sections like [Classes confuse both people and machines](https://reactjs.org/docs/hooks-intro.html#classes-confuse-both-people-and-machines).

Statements like these, for me, require a ton of empirical evidence to back-up, because after doing this awhile, I've personally seen classes usually win out as "actually a pretty intuitive way for most people to model/think about the world".

I.e. when "OOP won" in the 90s (which I just missed), or (what I more directly witnessed) when "ES6 classes won" in the 2010s, despite much proclamations of "prototypes are superior" ... in theory, and yet everyone had their own bespoke "add classes" library.

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

Is complicated because you're organizing code by life cycle methods ("all mounts in `componentDidMount`, all unmounts are in `componentWillUnmount`") vs. by abstraction/purpose ("all thing 1 code" is in one spot and "all thing 2 code" is in another).

Do We Need to Kill Classes?
---------------------------

So, just as a thought experiment, I wanted to balance "okay, I get the goal of a different axis of organization" vs. "going all-in on functional components".

When I read their problem, what it makes me think is that we want to give discrete sets of business logic (i.e hook-using code, the "thing 1" and "thing 2" from our example above) two things:

1. Their own namespaced of the component's state 
2. Their own callbacks ("hooks") of the component's lifecycle.

So, let's try and model that.

Recreating `useEffect` in Classes
---------------------------------

I think `useEffect` is the easiest to recreate; we just want a list of functions to run as part of the lifecycle, i.e.:

```typescript
class HookableComponent extends Component {
  private effects: Array<Function> = [];

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

My first pass at this tried to use the child component's `state`/`setState`, but this would conflict with the child component's usage, particularly in the constructor when they do `this.state = { ... }`.

So, instead I ended up adding a dedicated `hookState` field:

```typescript
class HookableComponent extends Component {

  private nextHookId = 0;
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
  def?: T)
: [Getter<T>, Setter<T>] {
  const hookId = component.newHookId();
  const stateKey = `hook-${hookId}`;
  if (def) {
    component.hookState[stateKey] = def;
  }
  const getter = () => component.hookState[stateKey];
  const setter = (v: T) => {
    component.hookState[stateKey] = v;
    component.forceUpdate();
  };
  return [getter, setter];
}
```

Similar to the class-based `useEffect`, this function takes a reference to the `component`.

In contract to the FP-based `useState`, the return value is slightly different, it's a `Getter` + `Setter` combination instead of just the `value` + `Setter`.

This is because of the (current) instantiation differences between my class-based recreations and the FP-based originals: I assumed mine would generally be instantiated _outside of `render`_, i.e. a constructor or field initialization, and these run just once. So, instead of returning the value itself, we need to return a handle to the value, than then can be invoked in `render`, i.e. usage ends up looking like:

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

Passing Around the Component
----------------------------

One big difference in the APIs between the FP React hooks and my naive spike is that I'm currently passing around a `component` parameter as the 1st argument to any hook method.

This makes for a more verbose API, that is admittedly boilerplate: yes, each hook call is going to need a `component`, why repeat ourselves?

I've gone back and forth on this issue over the years, as it's an extremely common scenario when designing DSLs: a child piece of logic (here the hook) wants to know about the parent (here the class-based component, or in FP hooks the implicit FP component). So do you explicitly pass the parent, or somehow implicitly access it?

If you implicitly pass it, it means you store the parent in global state somewhere, where the caller doesn't have to assign it, but once inside the child logic, the child logic can immediately grab it.

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

Now our hooks can have the same shorter API as React's hooks:
```typescript
function useState<T>(def: T) {
  const component = HookableComponent.currentComponent;
  // our existing code as usual
  const hookId = component.newHookId();
}
```

Once you know this "is this parent passed explicitly or implicitly" pattern, it shows up in nearly all DSLs.

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

The `LambdaRestApi` child component needs to know what parent it is part of, so we pass along the `this` explicitly.

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

I think all things considered, I'd probably keep explicit.

Few Downsides of the Class-Based Hooks
--------------------------------------

I'll explicitly call out a few downsides of my current `HookableComponent` spike.

For one, it is based on inheritance, which I maintain "is not evil when used well/in-the-small", but will mean the usual "oh right" OO-isms like if a child overrides `componentDidMount()` and doesn't call `super.componentDidMount()`, then none of our effect hooks will work (the `useState` hooks would be fine in this scenario).

I don't think we have a great way to mitigate this: TypeScript doesn't let us mark our `componentDidMount` as final, nor are there other JavaScript/language-provided semantics (although there are probably ways of enforcing this at runtime, i.e putting "marker" code in the base `componentDidMount` and then failing at some later when we notice "hey wait, the marker didn't get run").

More generically, our API surface is generally more tied to implementation details of the `HookableComponent`.

I.e. in FP hooks, especially with the implicit passing of the component, the calling code has no idea/coupling to how `useState` works. Callers pass very little parameters, and can (within the rules), invoke whenever/however they want.

This really tiny API surface is enticing for React maintainers, as it means there would be less breaking changes as React needs to refactor things down the road.

...although, now that I think about it, with an implicit-passing API and "hiding" the `HookableComponent` implementation details (i.e. `addEffect`, `hookState`, etc.) directly into `Component` as hidden implementation details (which is similar to how FP hooks are baked directly into FP components), the API surface may really not be that different.

So Are FP-Based or Class-Based Hooks Better?
--------------------------------------------

This admittedly is a trick question, because I think it depends on your preferences/biases.

If you've already decided you want FP-only components as an end-goal/true north (which, perhaps putting words in their mouth, but I think the React team has), and need to access the React state/lifecycle, etc., FP hooks look like a great way of doing that.

But, vice versa, if you've decided you don't mind class-based components, I think I've shown (at least to myself) that you can achieve the very valid points of "decoupling chunks of state/lifecycle logic from class method layout" with a few additions to the existing class-based component API, and not have to give up on classes.

I do have a somewhat pedantic quibble that I think the React Hook literature goes a bit too far in it's anti-class push, by somewhat zealously pursuing FP even when its not really FP. I.e. hooks very explicitly have side-effects. They are mutating "something". The "not class"/functional component is still there, just behind the scenes, effectively still creating a "combination of state + behavior" (...sounds like a class...), not through the language-/spec-provided syntax, keywords, and semantics, but through a DSL that is effectively recreating it.

Which at some point I worry that it becomes a leaky abstraction, and somewhat of a [Greenspun-ish](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule) where they're trying really hard to not use classes; but when you invoke a functional component, but then have to provide side-effecting/global-accessing functions that are going to stitch back together what is effectively a class, you may not have something that is inherently a bug-ridden/half-implemented/etc. version of OO...but is it really better?

Although, fwiw, maybe it is.


I have my biases, and plan on sticking with class-based components indefinitely-ish, but the React team is paid to think about these issues full-time, across a huge React codebase within Facebook, and they're pretty smart. So, I should given them the benefit of the doubt (while also thinking critically/independently about their own biases/etc.).

And, even if React's hooks are "meh, something you can do with classes", pushing state-of-the-art thinking and implementations to approach something more FP is not bad either. Progress takes experimentation.


