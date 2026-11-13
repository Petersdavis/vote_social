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
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Vote Social Early Access Waitlist",
    description:
      "Connect with verified neighbors in your ward, compare candidates side-by-side on local policy surveys, and track every election in one place.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
