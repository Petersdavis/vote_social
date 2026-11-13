import type { Metadata } from "next";
import React, { Suspense } from "react";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";
import { canonicalUrl, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return [
    { municipality: "toronto_2026" },
    { municipality: "ontario_2026" },
    { municipality: "canada_2026" },
  ];
}

function formatJurisdictionLabel(slug: string): string {
  const [entity = "toronto", year = "2026"] = slug.toLowerCase().split("_");
  const entityName =
    entity === "toronto"
      ? "City of Toronto"
      : entity === "ontario"
      ? "Province of Ontario"
      : entity === "canada"
      ? "Government of Canada"
      : entity.charAt(0).toUpperCase() + entity.slice(1);
  return `${entityName} (${year})`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipality: string }>;
}): Promise<Metadata> {
  const { municipality } = await params;
  const label = formatJurisdictionLabel(municipality);
  const title = `${label} Election Summary & Local Issue Feed`;
  const description = `Explore ${label} candidates, top local issues ranked by verified neighbor votes, organizational voter guides, and official candidate Q&A on ${SITE_NAME}.`;
  const url = canonicalUrl(`/${municipality}/summary`);

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default function ElectionSummaryPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
        <CommunityFeedScreen />
      </Suspense>
      <ScreenshotToolbar activeScreen={1} />
    </main>
  );
}
