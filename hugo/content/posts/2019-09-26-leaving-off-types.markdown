---
date: "2019-09-26T00:00:00Z"
title: When Leaving Off Types is Okay
---


As a tangential start to the post, I have a love/hate relationship with Hindley-Milner type inference; love because those languages (Haskell, etc.) are considered the pinnacle of static typing, but hate b/c I frankly consider 



```
function foo(a): number {
  return 1;
}

type Dict = { foo(a: number): number };

const dict: Dict = {
  foo(a): number {
    return 1;
  }
};
```

