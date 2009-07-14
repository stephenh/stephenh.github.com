---
layout: post
title: Writing Annotation Processors (with a GWT sample)
---

Writing Annotation Processors
=============================

Overview
--------

Annotation processors are a JDK6 feature that allows the `javac` compiler (or Eclipse) to, while compiling, call custom processors that can generate source code. The new source code is then immediately compiled, transparent to the user (e.g. it doesn't require two calls to `javac`).

Annotation processors allow you to leverage build-time code generation that is run automatically--in the case of Eclipse, anytime you hit save.

Annotation processors are also given access to the basic type information (names and types of classes, methods, fields) of the code currently being compiled, so the processor can output generated source code that is based on your input source code.

This combination of run-on-demand and type-information allows a crude sort of build-time meta-programming, The big restriction is that processors can only create new source files, and not change the source nor AST of existing source files.

Writing annotation processors is pretty simple. The [javadocs](http://java.sun.com/javase/6/docs/api/javax/annotation/processing/Processor.html) are also great. But there are a few neat trick I will outline some here that hopefully will be useful.

Specifically, we'll build an annotation processor that will automatically produce the "Async" version of interfaces for GWT.

Processor interface
-------------------

Annotation processors implement the [`javax.annotation.processing.Processor`](http://java.sun.com/javase/6/docs/api/javax/annotation/processing/Processor.html) interface, whose primary methods are `getSupportedAnnotationTypes` and `process`:

<pre name="code" class="java">
    Set&lt;String&gt; getSupportedAnnotationTypes();

    boolean process(Set&lt;? extends TypeElement&gt; types, RoundEnvironment roundEnv);
</pre>

During compilation, the compiler will instantiate your processor and call `getSupportedAnnotationTypes`. For any annotation types you return, the compiler will find out if it has touched any types with your annotations during this compile, and, if so, pass the newly-compiled types to your `process` method.

Note that by "type", it could be either a package type (for package-level annotations) or a class type (for class-level annotations). When I was doing it, package-level annotations worked in `javac` but not Eclipse, but that may have been fixed.

Leveraging sourcegen
--------------------

When generating Java source code for fun and profit, I like to use a utility library I wrote for the [Joist](http://joist.ws) project: [sourcegen](http://github.com/stephenh/joist/tree/master/util/src/main/joist/sourcegen).

Called `sourcegen`, it's 3-4 classes that model the high level of Java source objects: directories, classes, methods, and fields. By making objects for each of these, the idea is that you can make a `GClass` object in one place, pass it around to a few other methods that add `GMethods`, and at the end call `toCode()` and get out a reasonably-formatted Java source file.

All of the formatting within a method is your job--this isn't the Eclipse formatter. It just handles the basics of packages, imports, class declaration, interface implementation, extending base classes, and the like done so that you can just configure these as properties on a `GClass`/`GMethod` and let `sourcegen` to the repetitive rest.

Here is a random example for the Joist project of what `sourcegen` is good at:

<pre name="code" class="java">
    // Completely unrelated to the gwt sample--this is from Joist and is code
    // that makes enum classes from designated tables in your database. Each
    // instance has an id, code, and name, with a constructor for each.
    //
    // Note there are other methods that add stuff to the "code" GClass, but
    // those are done elsewhere--this is a small method dedicated to just the
    // fields and constructor.
    private void addFieldsAndConstructor(GClass code) {
        code.getField("id").type(Integer.class).makeGetter();
        code.getField("code").type(String.class).makeGetter();
        code.getField("name").type(String.class).makeGetter();

        GMethod c = code.getConstructor(
            "Integer id",
            "String code",
            "String name").setPrivate();
        c.body.line("this.id = id;");
        c.body.line("this.code = code;");
        c.body.line("this.name = name;");
    }
</pre>

Nothing fancy--just a higher-level way of generating source code than low-level Velocity templates (which I originally used).

Also note that `sourcegen` isn't meant to generate code that is hundreds (or even tens) of lines-per-method. But, generally, you shouldn't generate code like that anyway.

GWT sample processor implementation
-----------------------------------

So, now let's start our sample processor. It is going to be simple--it looks for any classes with the existing [`RemoteServiceRelativePath`](http://google-web-toolkit.googlecode.com/svn/javadoc/1.6/com/google/gwt/user/client/rpc/RemoteServiceRelativePath.html) annotation, and makes an `Async` version of them.

Usually you'll make your own annotations specific to your processor, like the [bindgen](http://joist.ws/bindgen.html) annotation processor's `@Bindable` annotation, but for now we don't need to bother with that.

The processor itself looks like:

<pre name="code" class="java">
        // Get the annotation
        TypeElement annotation = this.processingEnv.getElementUtils()
            .getTypeElement(gwtAnnotationClassName);
        // Find all classes that use the annotation
        for (Element element : roundEnv.getElementsAnnotatedWith(annotation)) {
            if (element instanceof TypeElement) {
                // Defer to our Generator
                new Generator(this.processingEnv, (TypeElement) element).generate();
            } else {
                this.processingEnv.getMessager().printMessage(
                    Kind.WARNING,
                    "Unhandled element " + element);
            }
        }
        return true;
</pre>

Most of the smarts are in the `Generator` class. `generate` looks at the class we've been given and iterators over its elements, looking for instance methods, which it adds, then saves the code.

<pre name="code" class="java">
    public void generate() {
        // element is a javax.lang.model.element.TypeElement, which the compiler
        // provided to us after doing a first-pass compile of our source code
        // getEnclosedElements() lets us iterator over the fields and methods
        for (Element enclosed : this.element.getEnclosedElements()) {
            if (this.isInstanceMethod(enclosed)) {
                this.addMethod((ExecutableElement) enclosed);
            }
        }
        this.saveCode();
    }
</pre>

`addMethod` takes a non-async method and shifts the return type into a final `AsyncCallback<Type>` argument. After that, it adds the method to the async `GClass`, and adds an import for the `AsyncCallback` class.

<pre name="code" class="java">
    private void addMethod(ExecutableElement method) {
        List&lt;String&gt; args = new ArrayList&lt;String&gt;();
        this.addMethodArguments(method, args);
        this.addCallbackArgument(method, args);

        // This is an interface, so just touch the method
        String nameAndArgs = method.getSimpleName() + "(" + Join.commaSpace(args) + ")";
        this.asyncClass.getMethod(nameAndArgs);

        this.asyncClass.addImports("com.google.gwt.user.client.rpc.AsyncCallback");
    }
</pre>

`saveCode` is pretty simple, too:

<pre name="code" class="java">
    private void saveCode() {
        try {
            // with createSourceFile, we tell the compiler we want to make a new
            // source file, with the async class name, and that it is based on
            // the current element (used to create dependency trees among classes,
            // e.g. so that Eclipse knows to recompile us if someone changes the
            // original file
            JavaFileObject jfo = this.processingEnv.getFiler().createSourceFile(
                this.asyncClass.getFullClassNameWithoutGeneric(),
                this.element);
            Writer w = jfo.openWriter();
            w.write(this.asyncClass.toCode());
            w.close();
        } catch (IOException io) {
            this.processingEnv.getMessager().printMessage(
                Kind.ERROR,
                io.getMessage());
        }
    }
</pre>

Processor Development Environment Setup
---------------------------------------

To start developing an annotation project, honestly I just copy/paste a very awesome project setup that I got from [Walter Harley](http://www.cafewalter.com/), who was the BEA lead on the Eclipse Annotation Processor implementation. He put together a sample project that I started using as a basis for my own.

The great thing about the project setup is that it is an Eclipse PDE project. This means that, to test your plugin, instead of jar'ing it up and manually starting up another Eclipse environment (which I did for quite awhile), you can "Run as Eclipse" your annotation processor project, get a *child* Eclipse environment going, and actually set debug points that will be hit when the child Eclipse environment starts using your annotation processor.

Debugging like this is tremendously useful for non-trivial annotation processors.

The only con is that you'll need the "Eclipse for RCP/Plugin Developers" edition of Eclipse to debug while developing the annotation processor. In practice, this isn't a big deal, just another download.

The basics of the project structure are:

* `build.properties`: used by Eclipse PDE somehow
* `build.xml`: compiles and [jarjar's](http://code.google.com/p/jarjar/) your processor into a jar file
* `plugin.xml`: configures an Eclipse extension point with your annotation processor so that it is available to the child Eclipse environment 
* `GwtExamples.launch`: launches the child Eclipse environment
* `META-INF/services/javax.annotation.processing.Processor`: contains the class name of your processor so, after it is packaged, that it is available to compilers like `javac` and Eclipse

Honestly, I've never gone through a "New Project" setup, it's worked really well to just copy/paste this base template and change the project names and class names. Dirty, yes, but quick.

Running the Child Eclipse Environment
-------------------------------------

When you do "Run, Run as Eclipse", or use `GwtExamples.launch`, the child Eclipse environment will need a different workspace than the one you are currently using. In `GwtExamples.launch`, I use a path relative to the project location, so an `examples-workspace` directory will be made as a sibling to the `examples` directory.

On the first launch, you won't have any projects in `examples-workspace` yet, so import the `gwtasyncgen-examples` project from the `examples` directory.

You can check out how the PDE setup works in the child environment by going:

* Project/Properties/Java Compiler/Annotation Processing/Factory path
* Note it is enabled for this project
* The `org.exigencecorp.gwtasyncgen` processor matches the extension point entry from the `plugin.xml` in the parent Eclipse environment

&nbsp;

Seeing the GWT example in action
--------------------------------

This project is an out-of-the-box GWT application, with only the default `GreetingServiceAsync` interface deleted and instead generated by the annotation processor.

The `GreetingService` interface currently looks like:

<pre name="code" class="java">
@RemoteServiceRelativePath("greet")
public interface GreetingService extends RemoteService {
	String greetServer(String name);
	boolean didGreet();
	void fooGreat(String one, int two);
}
</pre>

If you add another method to it, e.g. `void bar();`, and hit save, you can now open up `GreetingServiceAsync`, and it will have a `bar(AsyncCallback<Void> callback)` method in it.

That's the basic idea--edit your code, hit save, and have changes show up immediately.

Wrapping up
-----------

This has been a pretty simple example, but I think shows the power of annotation processors, and how to setup a good environment for developing them in Eclipse.

I've likely missed a few things, as I'm writing up these notes after the fact instead of as I go. Please let me know if there are edits I should make.

Also, for a more complex annotation processor, see [Bindgen](http://joist.ws/bindgen.html), which generates type-safe bindings for your classes as you type.

While annotation processors will not make Java as cool as, say, Scala is these days, it is a handy tool to have if you run into a situation that can benefit from it.


