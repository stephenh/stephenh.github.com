---
date: "2012-08-29T00:00:00Z"
section: Java
title: Optional Folders in Eclipse
---

{{page.title}}
==============

Often times in Eclipse, you'll add folders for generated code to the build path, e.g. `target/gen-java-src` or something like this.

Since the code is generated, you typically don't check it in, which is fine, but it means on initial checkout Eclipse will complain that the folder doesn't exist yet and stop the whole build.

It turns out there is a way to mark output folders as optional, but I pull my hair out trying to find the syntax every time because, AFAICT, there is not a config option for it in their UI. 

So, for posterity and my own sanity, the syntax is:


```xml
<classpathentry kind="src" path="target/gen-java-src">
  <attributes>
    <attribute name="optional" value="true"/>
  </attributes>
</classpathentry>
```

