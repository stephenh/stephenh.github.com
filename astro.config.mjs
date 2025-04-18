// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	site: 'https://www.draconianoverlord.com',
	integrations: [sitemap(), mdx(), pagefind()],
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		shikiConfig: {
			theme: "css-variables",
		},
	},
	// Configure permalink structure to match Hugo's format
	permalinks: {
		posts: '/:year/:month/:day/:slug.html',
	},
});
