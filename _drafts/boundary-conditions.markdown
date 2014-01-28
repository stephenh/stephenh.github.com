
Stylistic tangent, because, hey, that's what I do; this is currently (A):

{code}
if (condition) {
  // main logic
  // several lines
  // etc.
} else {
  log.error("condition was bad");
}
{code}

Where as the alternatives are (B):

{code}
if (!condition) {
  log.error("condition was bad")
} else {
  // main logic
  // several lines
  // etc.
}
{code}

Or (C):

{code}
if (!condition) {
  log.error("condition was bad")
  return
}
// main logic
// several lines
// etc.
{code}

I like B and C slightly better, because if A you have to squirrel away "oh right, what if batch size is 0", read the rest of the main logic, and then "oh, right, we just log and stop". You can avoid keeping the "batch size is 0" thread in your head but just taking care of it right away, since it's a one-liner/early return, and now I can go on thinking about the meat of the method with a clear stack.

