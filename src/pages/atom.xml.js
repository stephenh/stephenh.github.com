import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { getItemLink } from "@lib/utils";
import { getCollection } from "astro:content";

export async function GET(context) {
  const blog = (await getCollection("blog")).filter((post) => !post.data.draft);
  const items = [...blog].sort(
    (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
  );
  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => {
      return {
        title: item.data.title,
        description: item.data.description,
        pubDate: item.data.date,
        link: getItemLink(item, { leadingSlash: true }),
      };
    }),
  });
}
