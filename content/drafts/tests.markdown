
What you did was fine, but sometimes if there are a lot of fields, I'll have one "shouldRequireFields" type test that just does setupPresenter, then immediately clicks save, and then asserts that each of fields that should be required have the "Required" errors next to time. 

It ends up being less code than having one testXxx method with the setup/click/etc. for each field. 

Admittedly/tangentially, part of the Given/When/Then style is that each test should have only one assertion, and while some people follow that religiously, I'm fine treating it as a guideline and saying that, while this "shouldRequireFields" method would have multiple "assertThat" lines, conceptually "assert that the fields that are required say 'Required'" to me is 1 high-level assertion, so I don't think it fundamentally ruins the test's value/approach. 

(E.g. to me it's the same boundary case; where tests get confusing is when they try to hit multiple boundary conditions.)
