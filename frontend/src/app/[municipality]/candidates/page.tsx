import type { Metadata } from "next";
import React, { Suspense } from "react";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";
import CandidateHubScreen from "@/components/screens/CandidateHubScreen";
import { SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return [
    { municipality: "toronto_2026" },
    { municipality: "ontario_2026" },
    { municipality: "canada_2026" },
  ];
}

export const metadata: Metadata = {
  title: "Candidate Profiles & Side-by-Side Policy Comparison",
  description:
    "Compare local candidates on standardized policy surveys, inspect past council voting records, read verified neighbor testimonials, and pledge your vote.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Candidate Profiles & Side-by-Side Policy Comparison | Vote Social",
    description:
      "Compare local candidates on standardized policy surveys, inspect past council voting records, read verified neighbor testimonials, and pledge your vote.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Candidate Profiles & Side-by-Side Policy Comparison | Vote Social",
    description:
      "Compare local candidates on standardized policy surveys, inspect past council voting records, read verified neighbor testimonials, and pledge your vote.",
  },
};

export default function DynamicCandidatesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <ScreenshotToolbar activeScreen={2} />
      <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
        <CandidateHubScreen />
      </Suspense>
    </div>
  );
}
