import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "Draconian Overlord",
  DESCRIPTION: "Suppressing software entropy.",
  EMAIL: "stephen.haberman@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 2,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Draconian Overlord.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Articles on topics I enjoy thinking about.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my open-source projects.",
};

export const SOCIALS: Socials = [
  {
    NAME: "GitHub",
    HREF: "https://github.com/stephenh",
  },
  {
    NAME: "RSS",
    HREF: "https://www.draconianoverlord.com/atom.xml",
  },
  {
    NAME: "X",
    HREF: "https://twitter.com/shaberman",
  },
];
