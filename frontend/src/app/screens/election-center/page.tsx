import React from "react";
import ElectionCenterScreen from "@/components/screens/ElectionCenterScreen";
import ScreenshotToolbar from "@/components/screens/ScreenshotToolbar";

export const metadata = {
  title: "Screen 3: My Action & Election Center | Vote Social",
  description:
    "Politics is local — Tiered election tabs, candidate snapshot view, dynamic civic calendar, interactive polling place locator, and one-click civic actions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ElectionCenterPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <ElectionCenterScreen />
      <ScreenshotToolbar activeScreen={3} />
    </main>
  );
}
