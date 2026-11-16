import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/data/blogPosts";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPostDate = BLOG_POSTS[0]?.publishedAt
    ? new Date(BLOG_POSTS[0].publishedAt)
    : new Date();

  const blogArticleEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: canonicalUrl(`/blog/${post.slug}/`),
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: canonicalUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: canonicalUrl("/blog/"),
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogArticleEntries,
  ];
}
