---
layout: default
title: Waiting During GWT Tests
---

{{page.title}}
==============

A frequent pain point for testing AJAX applications is synchronization between the application and the browser-driven test suite (e.g. Selenium).

While Web 1.0 apps have a very convenient assumption that "page loaded" == "okay, everything is done", Web 2.0/AJAX applications perform logic in lots of JavaScript callback functions where a tool like Selenium can't readily tell when "done" has happened. 





Testing Ajax applications has always been frustrating because, lacking the traditional Web 1.0 "page loaded" means "stuff is done" event, it can be hard for a test to know when it should continue with it's assertions.

