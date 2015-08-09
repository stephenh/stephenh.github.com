---
layout: post
title: Joist/ORM Prefetching
---

{{page.title}}
==============

Prefetching is pretty well-known technique for optimizing ORM/database access. However, I was surprised at how much thought and cool stuff people are doing with it.

`n+1` Selects
-------------

The problem prefetching solves is known as `n+1` selects. It is best seen by a code example:

    Blog blog = loadBlog(1); // load from somewhere
    for (Post post : blog.getPosts()) {
        for (Comment comment : post.getComments()) {
            render(comment);
        }
    }
{: class="brush:java"}

This usage almost always means:

* 1 query of `SELECT * FROM blog WHERE id = 1`--loads 1 blog
* 1 query of `SELECT * FROM post WHERE blog_id = 1`--loads N posts
* N queries of `SELECT * FROM comment WHERE post_id = x`--loads 1 comment, repeatedly for each post

If you have 20 blogs, you'll end up with 22 SQL calls back/forth to the database. Each call is a network trip, so this can quickly slow down your application.

The goal of prefetching is to load the entire blog/posts/comments object graph with as few SQL calls as possible. Depending on the approach, you can have as few as 1 SQL call, which is a huge savings and will result in very real performance improvements.

Explicit Pre-Fetching
---------------------

Traditionally, ORMs required explicit custom queries to prefetch an entire object graph.

For example, with Hibernate you'd do [something like](http://docs.jboss.org/hibernate/stable/core/reference/en/html_single/#querycriteria-dynamicfetching):

    public Blog loadViaCustomQuery(int id) {
      List blogs = sess.createCriteria(Blog.class)
        .add(Restrictions.equal("id", id))
        .setFetchMode("posts", FetchMode.EAGER)
        .list();
      return blogs.get(0);
    }
{: class="brush:java"}

The code then becomes:

    Blog blog = loadViaCustomQuery(1);
    for (Post post : blog.getPosts()) {
        for (Comment comment : post.getComments()) {
            render(comment);
        }
    }
{: class="brush:java"}

This usage means:

* 1 query of `SELECT b.*, p.* FROM blog b, LEFT OUTER JOIN posts p ON b.id = p.blog_id WHERE b.id = 1`--loads 1 blog plus `n` posts
* `n` queries of `SELECT * FROM comment WHERE post_id = x`--loads 1 comment, repeatedly for each post

So we removed 1 extra query, going from 22 calls to 21 calls, but we really we haven't avoided the `n+1` problem--I'm still poking around Hibernate docs to see if you can bring back sub-sub-collections via prefetching.

(**Disclaimer**: I don't have an active Hibernate setup right now--I'll come back and update this if I ever get it figured out, but until then, please correct any of the technical points I have wrong.)

Even so, there are several problems with explicit prefetching:

* It requires up-front developer effort to write a custom query with correct prefetch semantics
* It requires on-going developer effort to update the custom query as the code changes what parts of the object graph it does/does not need--performance could actually end up degraded if the wrong data is being prefetched

Implicit Pre-Fetching
---------------------

What seems more novel to me is eschewing custom queries and the ORM just being more intelligent about its usage.

One trick that Hibernate actually already implements is [subselect fetching](http://docs.jboss.org/hibernate/stable/core/reference/en/html_single/#performance-fetching-subselect). The idea is that when you're mapping your `Post` class, you set `fetch=subselect` on the `comments` element:

    <class name="Post">
        <!-- ... other mappings ... -->
        <set name="comments" fetch="subselect">
            <key column="post_id" not-null="true"/>
            <one-to-many class="Comment"/>
        </set>
    </class>
{: class="brush:xml"}

Now our original code snippet:

    Blog blog = loadBlog(1); // load from somewhere
    for (Post post : blog.getPosts()) {
        for (Comment comment : post.getComments()) {
            render(comment);
        }
    }
{: class="brush:java"}

Will result in these queries:

* 1 query on `loadBlog(1)` of `SELECT * FROM blog WHERE id = 1`--loads 1 blog
* 1 query on `blog.getPosts()` of `SELECT * FROM post WHERE blog_id = 1`--loads `n` posts
* 1 query on the 1st `post.getComments()` of `SELECT * FROM comment WHERE post_id IN (N post ids)`--loads `m` comments

**Update**: I reproduced this behavior in a project with `Parent`/`Child`/`GrandChild`, here is SQL Hibernate generated:

    select
      parent0_.id as id0_0_,
      parent0_.version as version0_0_,
      parent0_."name" as name3_0_0_
      from "parent" parent0_
      where parent0_.id=?
    select
      childs0_.parent_id as parent3_1_,
      childs0_.id as id1_,
      childs0_.id as id1_0_,
      childs0_.version as version1_0_,
      childs0_."parent_id" as parent3_1_0_,
      childs0_."name" as name4_1_0_
      from "child" childs0_
      where childs0_.parent_id=?
    select
      grandchild0_.child_id as child3_1_,
      grandchild0_.id as id1_,
      grandchild0_.id as id2_0_,
      grandchild0_.version as version2_0_,
      grandchild0_."child_id" as child3_2_0_,
      grandchild0_."name" as name4_2_0_
      from "grand_child" grandchild0_
      where grandchild0_.child_id in (
        select childs0_.id
        from "child" childs0_
        where childs0_.parent_id=?
      )
{: class="brush:sql"}

What happened is that Hibernate applied a heuristic of saying: "okay, you have `Post A`, and you want its `Comments`...but you also have `Post B`, `Post C`, etc., in your session, I'm going to go ahead and get the `Comments` for all of those `Posts` at the same time."

From my perspective, this seems like a pretty sweet optimization. 

* It dramatically reduces the SQL queries--not all the way down to 1 query, but 3 is still a lot better than 22 (or whatever `n` is)
* It's automatic, and so requires no extra initial/on-going thought from the developers to maintain.
* You risk over-fetching data, however I think this is not a big deal because:
  * You're already making a SQL call, which is dominated by the wire-call/latency
  * The `WHERE post_id IN (N posts ids)` is still a very simple query--no outer left joins which can lead to data duplication--so should return very fast even if slightly more data is coming back than you need
  * Extremely large collections that would ruin this approach should probably not be mapped via implicit object graph navigation anyway--as soon as a parent has >100-500 children, you probably don't want to load them in a single UnitOfWork anyway and so should not map `parent.getChildren()` to prevent developers from accidentally causing session size bloat

Optimized Implicit Prefetching
------------------------------

What is even cooler than implicit prefetching, is *profiled* implicit prefetching.

I came across the paper [Automatic Prefetching by Traversal Profiling in Object Persistence](http://userweb.cs.utexas.edu/~wcook/papers/AutoFetch/autofetch.pdf), where the authors extend Hibernate 3.1 to keep live statistics about the application's object graph navigation.

So, initially you'll get the worst case `n+1` selects, but after a few iterations, their AutoFetch algorithm recognizes that, given the line number/stack trace of the `loadBlog(1)` line, it will soon need all of the posts and comments, so issues a single:

* 1 query of:

      SELECT b.*, p.*, c.*
      FROM blog b
      LEFT OUTER JOIN posts p ON b.id = p.blog_id
      LEFT OUTER JOIN comments c ON p.id = c.post_id
      WHERE b.id = 1
  {: class="brush:sql"}

  That loads the entire blog/posts/comments object graph

This is pretty magically awesome.

I think the only downside is that technically that many outer joins in 1 query will lead to potentially large data duplication due to it being a cross product. I do not know how much of an issue this would be in real-world usage.

They might be better off sending a trio 3 simple statements:

* `SELECT * FROM blog WHERE id = 1`
* `SELECT * FROM post WHERE blog_id = 1`
* `SELECT * FROM comment WHERE post_id IN (SELECT id FROM post WHERE blog_id = 1)`

Across the wire all the same time, then getting back 3 separate result sets. This would avoid the nested `LEFT OUTER JOIN`s, but still get all the data in a single wire call.

However, I really have no idea how well multi-statement result sets are supported in JDBC and the various databases that Hibernate supports.

Active Research
---------------

What is most surprising to me is that ORM techniques are an active area of academic research. For example, the AutoFetch paper came out of the University of Texas at Austin and was supported by a National Science Foundation.

I never would have guessed that federal academic funding was going into such a real-world/everyday technology like ORMs.

Besides the AutoFetch algorithm, the AutoFetch paper is also interesting as it cites several other ORM papers that seem worth tracking down and reading. I definitely suggest anyone else interested in the ORM problem try and do the same.

