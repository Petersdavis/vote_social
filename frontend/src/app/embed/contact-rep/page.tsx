"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ContactRepresentativeWidget from "@/components/comms/ContactRepresentativeWidget";
import type { GovernanceTierSlug } from "@/lib/opennorth";

const VALID_TIERS = new Set<GovernanceTierSlug>([
  "municipal",
  "regional",
  "provincial",
  "federal",
]);

function EmbedContactRepInner() {
  const searchParams = useSearchParams();

  const rawTier = (searchParams.get("tier") ?? "").trim().toLowerCase();
  const defaultTier = VALID_TIERS.has(rawTier as GovernanceTierSlug)
    ? (rawTier as GovernanceTierSlug)
    : null;
  const defaultSubject = searchParams.get("subject") ?? "";
  const defaultBody = searchParams.get("body") ?? "";
  const defaultPostcode = searchParams.get("postcode") ?? "";

  return (
    <div className="bg-transparent text-slate-900 font-sans p-2 sm:p-3">
      <ContactRepresentativeWidget
        defaultTier={defaultTier}
        defaultSubject={defaultSubject}
        defaultBody={defaultBody}
        defaultPostcode={defaultPostcode}
        embedded
      />
    </div>
  );
}

export default function EmbedContactRepPage() {
  return (
    <Suspense fallback={null}>
      <EmbedContactRepInner />
    </Suspense>
  );
}
