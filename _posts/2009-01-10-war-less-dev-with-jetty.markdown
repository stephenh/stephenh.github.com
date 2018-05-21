---
layout: post
title: War-less Development with Jetty
section: Java
---

<h2>{{ page.title }}</h2>

**Update:** see the [jtty](http://github.com/stephenh/jtty) project for a single jar based on this approach that contains both the Jetty dependencies and a generic bootstrap class.

Reviewing my posts, most of them are negative rants, so I figured I should contribute something positive every now and then.

One of my favorite hacks for Java web development is using Jetty for a war-less development environment to get automatic updating of classes/JSPs while debugging your app. Although limited by the usual JVM limitation of no hot reloading class declaration changes, I've nonetheless found this approach to be quick and useful.

Perhaps lots of people use this type of approach already, but I haven't come across it much.

The idea is to be able to start Jetty as your server against your web project and not have to go through a war step--instead, Jetty will pick up the `web.xml`, JSPs, etc. directly from your source folder, like an exploded war deployment.

This assumes you have a war-like directory structure of:

```plain
yourapp
  - WebContent
    - ...content...
    - WEB-INF
      - web.xml
```

If for whatever reason your project's source tree doesn't match this, or needs several build steps to generate/massage a web.xml file, then YMMV.

Instead of a standard jetty script, I typically create a `Jetty` wrapper class directly in the project (either `src/main` or `src/bootstrap`) that resembles:

```java
public class Jetty {
    private static final Server SERVER = new Server();

    public static void main(String[] args) {
        String webapp = "./WebContent";
        if (args.length > 0) {
            webapp = args[0];
        }

        WebAppContext app = new WebAppContext();
        app.setContextPath("/yourapp");
        app.setWar(webapp);
        // Avoid the taglib configuration because its a PITA if you don't have a net connection
        app.setConfigurationClasses(new String[] { WebInfConfiguration.class.getName(), WebXmlConfiguration.class.getName() });
        app.setParentLoaderPriority(true);

        // We explicitly use the SocketConnector because the SelectChannelConnector locks files
        Connector connector = new SocketConnector();
        connector.setPort(Integer.parseInt(System.getProperty("jetty.port", "8080")));
        connector.setMaxIdleTime(60000);

        Jetty.SERVER.setConnectors(new Connector[] { connector });
        Jetty.SERVER.setHandlers(new Handler[] { app });
        Jetty.SERVER.setAttribute("org.mortbay.jetty.Request.maxFormContentSize", 0);
        Jetty.SERVER.setStopAtShutdown(true);

        try {
            Jetty.SERVER.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

And run this Java class from Eclipse with a `Jetty.launch` target. You'll need `jetty-6.X.jar` and `jetty-util-6.X.jar` on your classpath--either in `lib/main` or a `lib/bootstrap` as you won't need the Jetty jars ending up in your production war.

Jetty will start up, see your `WebContent/WEB-INF/web.xml`, and fire up your servlet classes.

Now the interesting part is how it finds the servlet classes--typically there is the `WEB-INF/lib`, `WEB-INF/classes`, etc., which works great for production, but you're not going to have those without going through a war step.

But since Eclipse (or IDEA or whatever) is running the `Jetty` class as a Java Application, it will put all of your project's classes and libraries on the application loader classpath, much like it would if it were running your JUnit tests.

So, we're cheating a bit, as Jetty will get your classes from the same application classloader it finds its own classes on instead of the usual `WebappClassloader`, but in practice I've found this is not a big deal.

Plus, it allows hot code reloading and editing of JSP files (if you have to use them) and seeing the changes automatically in your app without a war/restart delay.

Now if only Sun would fix hot code replacement to not blow up when you change classes. I know nothing about JVM internals, so I'll trust them that this is hard, but, please, pretty please, even if enabled with a debug-only, hurts-perf-25%, never-use-this-in-production flag?

Also, if you need JNDI resources, you have a few alternatives. One app I worked on did not rely on the container for anything (it used its own c3p0 pool), so this was no problem. Another app did want the DataSource in JNDI, so we wrote a `FakeJndiFactory` that returned a `FakeContext`--it's kind of stupid, `FakeContext` has a 10-15 methods in it, but only `lookup` ever seems to be called, so we left most of `FakeContext`'s methods as no-op and had `lookup` use a static `HashMap`. Then the project-specific Jetty class just did:

```java
System.setProperty("java.naming.factory.initial", FakeJndiFactory.class.getName());
FakeJndiFactory.properties.put("java:comp/env/jdbc/yourapp", FakeDataSource.getDataSource());
```

Where `FakeDataSource` was a c3p0-backed data source. If you need more container resources than a DataSource, you'll have to invent your own ways to mount them in Jetty or else just stay in the container.

The ability to customize the `Jetty` wrapper class as needed for your project is one of the strengths of this approach, I think. For example, it wouldn't make much sense for me to make a `github` project out of this, because I think everyone is best off copy/pasting the 20 or so lines of code and just customizing them as needed to their project.

As alternatives to this war-less Jetty approach, I have seen a few cool reloading hacks like Tapestry 5 live class reloading and JavaRebel's ZeroTurnaround. They both seem a bit tricky, though I haven't investigated them as much as I should.

So far, this low tech approach has worked very well on our projects. I hope
others like it as well.

Let me know if you have other cool, avoid-server-restart tips.

