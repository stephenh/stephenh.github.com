import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CollectionEntry } from "astro:content";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

function generatePostUrl(date: Date, postId: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const slug = getPostSlug(postId);
  return `${year}/${month}/${day}/${slug}.html`;
}

function getPostSlug(postId: string): string {
  return postId.match(/^\d{4}-\d{2}-\d{2}-/)
    ? postId.replace(/^\d{4}-\d{2}-\d{2}-/, "")
    : postId;
}

export function getItemLink(
  item: CollectionEntry<"blog"> | CollectionEntry<"projects">,
  opts: { leadingSlash?: boolean } = {},
): string {
  const { leadingSlash = false } = opts;
  let link = "";
  let trailingSlash = false;
  if (item.collection === "blog") {
    link = generatePostUrl(item.data.date, item.id);
    trailingSlash = true;
  } else {
    // For other types like projects, keep original structure
    link = `${item.collection}/${item.id}`;
  }
  return (leadingSlash ? "/" : "") + link + (trailingSlash ? "/" : "");
}
