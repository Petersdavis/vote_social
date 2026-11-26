import React from "react";
import AutoModeratePostWidget from "@/components/comms/AutoModeratePostWidget";

export const metadata = {
  title: "Screen: Auto-Moderate Post Widget Preview | Vote Social",
  description:
    "Preview the automated content moderation widget that flags posts semantically similar to a toxic reference set.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AutoModeratePostPreviewPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AutoModeratePostWidget />
      </div>
    </main>
  );
}
