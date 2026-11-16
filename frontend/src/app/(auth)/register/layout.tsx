import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Join the Early Access Waitlist",
  description:
    "Sign up for Vote Social early access to connect with verified neighbors in your ward, compare candidates, and track upcoming Municipal, Provincial, and Federal elections.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Join the Vote Social Early Access Waitlist",
    description:
      "Connect with verified neighbors in your ward, compare candidates side-by-side on local policy surveys, and track every election in one place.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Join the Vote Social Early Access Waitlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Vote Social Early Access Waitlist",
    description:
      "Connect with verified neighbors in your ward, compare candidates side-by-side on local policy surveys, and track every election in one place.",
    images: ["/og-image.png"],
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
