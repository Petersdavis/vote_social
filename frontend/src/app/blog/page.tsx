import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import BlogShareBar from "@/components/blog/BlogShareBar";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_NAME, SITE_URL, canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Civic & Development Blog",
  description:
    "Essays on local democracy, campaign equity, and why elections need public-interest digital infrastructure.",
  alternates: {
    canonical: canonicalUrl("/blog/"),
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: SITE_NAME,
    url: canonicalUrl("/blog/"),
    title: `Civic & Development Blog — ${SITE_NAME}`,
    description:
      "Essays on local democracy, campaign equity, and why elections need public-interest digital infrastructure.",
    images: [
      {
        url: canonicalUrl("/og-image.png"),
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${SITE_NAME} — Civic & Development Blog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Civic & Development Blog — ${SITE_NAME}`,
    description:
      "Essays on local democracy, campaign equity, and why elections need public-interest digital infrastructure.",
    images: [canonicalUrl("/og-image.png")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const blogIndexJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `${SITE_NAME} Civic & Development Blog`,
  url: canonicalUrl("/blog/"),
  blogPost: BLOG_POSTS.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle,
    datePublished: post.publishedAt,
    url: canonicalUrl(`/blog/${post.slug}/`),
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: SITE_URL,
    },
    keywords: post.tags.join(", "),
  })),
};

export default function DevelopmentBlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogIndexJsonLd) }}
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
              href="/"
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
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

      {/* Blog Index Header */}
      <header className="pt-10 pb-8 border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Civic Mission &amp; Development Blog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Vote Social Blog
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Essays on local democracy, campaign equity, and why elections need
            public-interest digital infrastructure.
          </p>
        </div>
      </header>

      {/* Article Feed */}
      <main className="py-10 lg:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              id={post.slug}
              className="scroll-mt-24 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm hover:border-slate-300 transition space-y-4"
            >
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

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 leading-tight">
                <Link
                  href={`/blog/${post.slug}/`}
                  className="hover:text-blue-700 transition"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                {post.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
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

                <Link
                  href={`/blog/${post.slug}/`}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <BlogShareBar
                slug={post.slug}
                title={post.title}
                subtitle={post.subtitle}
              />
            </article>
          ))}

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
