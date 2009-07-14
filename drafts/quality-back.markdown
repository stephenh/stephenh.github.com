---
layout: post
title: You Don't Get Quality Back
---

<h2>{{ page.title }}</h2>

### Bad Code

I have seen a lot of bad codebases.

Most of them were my fault, from my early days building 1-man/2-3 month content-management systems and generally screwing them up. It was a good learning experience, as I felt pretty stupid doing maintenance work and telling the client it was hard to refactor code they had just paid me to write 6 months earlier.

After that, I watched two enterprise "system rewrite" projects throw away their first attempts and both start over with a clean codebase. One I got to help guide to success, the other is still up in the air.

In thinking about my experiences, I realized that I've never seen quality get back into a codebase.

### 30% APY

Using the notion of technical debt, it seems that codebases have a point of no return. When their technical debt interest rate is 30% APY, you have to admit you're just never going to pay it off, and declare bankruptcy.

But what is the "APY" number? 10%? 30%? What does that even mean? How do you judge software quality?

### Potential Factors

I've considered some combination of factors like:

* Lack of Automated Tests
* Lack of Features
* High Bug Count
* Developer productivity

Each of which you could potentially measure and combine to come up with an APY number.

The Agile notion of velocity is tempting to use, except that it inherently varies between teams and projects, due to the "new product" nature of software development.

### Gut

I'm guilty of using a gut-feel approach: does the code suck? If so, we should probably just stop now and do it again.

Understandably, clients do not like my gut-feel approach, especially when it is telling them they've wasted a lot of money for sub-par software. And then it leads to the debate about whether "suck" is an absolute notion, or just relative to my own personal opinion. Which, as a human being, of course it is.

### Business Terms

I can attempt to frame the argument in business terms, e.g. with higher quality software, you'll have better developer productivity, and hence lower costs over the long-term.

While I absolutely agree with this, I'm not going to pretend to have the data, especially for their specific project, to support it.

### Pilot Systems

Brooks asserts that you should build [Pilot Systems](http://en.wikipedia.org/wiki/The_Mythical_Man-Month):

<blockquote>
When designing a new kind of system, a team will design a throw-away system (whether it intends to or not). This system acts as a pilot plant that reveals techniques that will subsequently cause a complete redesign of the system. This second smarter system should be the one delivered to the customer, since delivery of the pilot system would cause nothing but agony to the customer, and possibly ruin the system's reputation and maybe even the company's.
</blockquote>



