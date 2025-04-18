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

export function generatePostUrl(date: Date, postId: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const slug = getPostSlug(postId);
  return `/${year}/${month}/${day}/${slug}.html`;
}

function getPostSlug(postId: string): string {
  let slug = postId;
  if (postId.match(/^\d{4}-\d{2}-\d{2}-/)) {
    slug = postId.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  }
  return slug;
}

export function getItemLink(item: CollectionEntry<"blog"> | CollectionEntry<"projects">, includeTrailingSlash: boolean = false): string {
  let link = "";
  
  if (item.collection === "blog") {
    link = generatePostUrl(item.data.date, item.id);
  } else {
    // For other types like projects, keep original structure
    link = `/${item.collection}/${item.id}`;
  }
  
  return includeTrailingSlash ? link + '/' : link;
}
