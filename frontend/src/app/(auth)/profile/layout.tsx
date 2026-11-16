import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Waitlist Profile & Community Leaderboard",
  description:
    "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Join Your Community on the Vote Social Waitlist",
    description:
      "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Join Your Community on the Vote Social Waitlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join Your Community on the Vote Social Waitlist",
    description:
      "Confirm your local Municipal Ward, Provincial Riding, and Federal Riding on Vote Social and see how many neighbors in your community have joined the waitlist.",
    images: ["/og-image.png"],
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
