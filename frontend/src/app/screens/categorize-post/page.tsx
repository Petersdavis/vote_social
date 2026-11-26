import React from "react";
import CategorizePostWidget from "@/components/comms/CategorizePostWidget";

export const metadata = {
  title: "Screen: Categorize Post Widget Preview | Vote Social",
  description:
    "Preview the semantic topic clustering widget powered by Hugging Face embeddings and a force-directed layout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CategorizePostPreviewPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <CategorizePostWidget />
      </div>
    </main>
  );
}
