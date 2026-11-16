import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import BlogShareBar from "@/components/blog/BlogShareBar";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_NAME, SITE_URL, canonicalUrl } from "@/lib/site";

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((entry) => entry.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: { index: false, follow: false },
    };
  }

  const articleUrl = canonicalUrl(`/blog/${post.slug}/`);

  return {
    title: post.title,
    description: post.subtitle,
    keywords: post.tags,
    authors: [{ name: post.author.name, url: SITE_URL }],
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url: articleUrl,
      title: `${post.title} — ${SITE_NAME}`,
      description: post.subtitle,
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${post.title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — ${SITE_NAME}`,
      description: post.subtitle,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((entry) => entry.slug === slug);

  if (!post) {
    notFound();
  }

  const articleUrl = canonicalUrl(`/blog/${post.slug}/`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle,
    datePublished: post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    url: articleUrl,
    image: `${SITE_URL}/og-image.png`,
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    keywords: post.tags.join(", "),
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition">
                VS
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Vote Social
                </span>
                <span className="hidden sm:inline-block ml-2.5 text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                  Development Blog
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/blog"
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
            <Link
              href="/#join-waitlist"
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-2xs"
            >
              Join the Waitlist
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Article Content */}
      <main className="py-10 lg:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-700 hover:text-blue-800 font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vote Social Blog</span>
            </Link>
          </div>

          <article
            id={post.slug}
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm"
          >
            {/* Article Meta Header */}
            <div className="border-b border-slate-200/80 pb-6 mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight">
                {post.title}
              </h1>

              <p className="text-base text-slate-600 leading-relaxed">
                {post.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
                <span className="font-sans font-semibold text-slate-800">
                  {post.author.name} • {post.author.role}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  {post.publishedAt}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  {post.readingTimeMinutes} min read
                </span>
              </div>

              {/* Top Social Share Links with UTM */}
              <BlogShareBar
                slug={post.slug}
                title={post.title}
                subtitle={post.subtitle}
              />
            </div>

            {/* Markdown + Mermaid Body */}
            <MarkdownRenderer content={post.markdown} />

            {/* Bottom Social Share Links with UTM */}
            <div className="mt-8">
              <BlogShareBar
                slug={post.slug}
                title={post.title}
                subtitle={post.subtitle}
              />
            </div>
          </article>

          {/* Bottom Waitlist Callout */}
          <div className="mt-10 rounded-2xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Help Us Reach 2,500 Signups</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Reserve your spot on the Vote Social early access waitlist
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Verify your postal zone and put your municipality at the front of
                the Stage 2 rollout queue.
              </p>
            </div>
            <Link
              href="/#join-waitlist"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0 transition"
            >
              <span>Join the Waitlist</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
