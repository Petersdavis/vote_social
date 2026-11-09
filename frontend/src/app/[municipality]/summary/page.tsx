import type { Metadata } from "next";
import React, { Suspense } from "react";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";
import { SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return [
    { municipality: "toronto_2026" },
    { municipality: "ontario_2026" },
    { municipality: "canada_2026" },
  ];
}

export const metadata: Metadata = {
  title: "Election Summary & Local Issue Feed",
  description:
    "Explore candidates, top local issues ranked by verified neighbor votes, organizational voter guides, and official candidate Q&A on Vote Social.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Election Summary & Local Issue Feed | Vote Social",
    description:
      "Explore candidates, top local issues ranked by verified neighbor votes, organizational voter guides, and official candidate Q&A on Vote Social.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Election Summary & Local Issue Feed | Vote Social",
    description:
      "Explore candidates, top local issues ranked by verified neighbor votes, organizational voter guides, and official candidate Q&A on Vote Social.",
  },
};

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
