import React from "react";
import CandidateHubScreen from "@/components/screens/CandidateHubScreen";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";

export const metadata = {
  title: "Screen 2: Candidate & Ballot Intelligence Hub | Vote Social",
  description:
    "Knowledge is power — Side-by-side platform comparisons, comprehensive candidate profiles, organization voter guides, and direct candidate messaging.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CandidateHubPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <CandidateHubScreen />
      <ScreenshotToolbar activeScreen={2} />
    </main>
  );
}
