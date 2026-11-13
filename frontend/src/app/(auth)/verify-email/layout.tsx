import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Your Email Address",
  description:
    "Verify your email address to complete your Vote Social early access waitlist profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
