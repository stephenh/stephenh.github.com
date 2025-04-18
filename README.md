# Draconian Overlord Blog

This is the personal blog of Stephen Haberman, focusing on software engineering topics, programming best practices, and fighting software entropy.

The blog is built using [Astro](https://astro.build/), a modern static site generator.

## Project Structure

```text
├── public/           # Static assets (images, files, etc.)
├── src/
│   ├── components/   # Reusable UI components
│   ├── content/      # Blog posts and other content
│   ├── layouts/      # Page layouts
│   └── pages/        # Each file becomes a page or endpoint
├── astro.config.mjs  # Astro configuration
└── package.json      # Project dependencies
```

## Commands

All commands are run from the root of the project:

| Command                    | Action                                           |
| :------------------------- | :----------------------------------------------- |
| `npm install`              | Installs dependencies                            |
| `npm run dev`              | Starts local dev server at `localhost:4321`      |
| `npm run build`            | Build your production site to `./dist/`          |
| `npm run preview`          | Preview your build locally, before deploying     |

## Migration from Hugo

This blog was previously built with Hugo. The content has been migrated to Astro, maintaining the same URLs and permalinks structure for compatibility.

## Content Management

Blog posts are stored in `src/content/blog/` as Markdown files. The frontmatter schema includes:

- `title`: Post title
- `pubDate`: Publication date
- `description`: Optional post description
- `tags`: Array of post categories/tags
- `draft`: Boolean to mark post as draft

## Development Notes

- Styles are defined in `src/styles/global.css`
- The site uses custom components for Header, Footer, and blog post formatting
- RSS feeds are available at `/rss.xml` and `/atom.xml` (legacy URL)