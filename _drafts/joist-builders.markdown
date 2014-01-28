
In scala, we generally leave off the parens for methods that are just getters (e.g. they don't do/change anything, they just return an object), so: 
p1.partnerSettings.get.setMarketingAutomationBecameActiveDate(dec31)

Also, Joist's builders have "fluent" methods for the properties, so instead of calling get, you can do: 
p1.partnerSettings.marketingAutomationBecameActiveDate(dec31)

Tangentially: 

When people say a Java API is "fluent", it generally means instead of doing: 
employee.getEmployer() // returns Bar
employee.setEmployer(...) // returns void

E.g. getters and setters, the methods are setup to return the object itself, e.g.: 
employee.employer(...) // returns employee

This is handy, because if you're setting multiple properties, traditionally you have separate lines: 
employee.setEmployer(...)
employee.setSalary(...)

But since the fluent "setters" return the object, you can do it in one line: 
employee.employer(...).salaray(...)

In general, I think in the business logic itself, you don't want to stuff too much functionality into a single line. 

But for setting up test data, the fluent style is pretty handy to quickly set a few properties you're interested in. So that's why Joist's builders use them.
