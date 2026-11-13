import React from "react";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";

export const metadata = {
  title: "Screen 1: Local Community Feed & Discussion | Vote Social",
  description:
    "Democracy is a social activity — Hyper-local neighborhood timeline, upvoted local priorities, voter endorsement badges, and verified candidate Q&A.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommunityFeedPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <CommunityFeedScreen />
      <ScreenshotToolbar activeScreen={1} />
    </main>
  );
}
