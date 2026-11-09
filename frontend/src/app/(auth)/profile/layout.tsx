import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Waitlist Profile & Community Leaderboard",
  description:
    "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Join Your Community on the Vote Social Waitlist",
    description:
      "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join Your Community on the Vote Social Waitlist",
    description:
      "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
