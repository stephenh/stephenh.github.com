
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
