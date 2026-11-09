"use client";

import React, { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  Flag,
  Loader2,
  MapPin,
  Newspaper,
  User as UserIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import CandidateHubScreen from "@/components/screens/CandidateHubScreen";
import CommunityFeedScreen from "@/components/screens/CommunityFeedScreen";
import ElectionCenterScreen from "@/components/screens/ElectionCenterScreen";
import WaitlistCarousel from "@/components/screens/WaitlistCarousel";
import WaitlistShareEmbed from "@/components/screens/WaitlistShareEmbed";
import { saveUserProfile } from "@/lib/auth";
import {
  fetchBoundariesForPostcode,
  formatCanadianPostcode,
  normalizeCanadianPostcode,
  type PoliticalBoundaryOption,
  type PostcodeBoundaryResolution,
} from "@/lib/opennorth";
import {
  isValid,
  validateVoteSocialProfileForm,
  type FieldErrors,
} from "@/lib/validation";

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileForm />
    </Suspense>
  );
}

function ProfileForm() {
  const router = useRouter();
  const { user, loading, profile, profileLoading, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postcode, setPostcode] = useState("");

  // OpenNorth Political Boundary Lookup State
  const [boundaryResolution, setBoundaryResolution] =
    useState<PostcodeBoundaryResolution | null>(null);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  const [selectedMunicipal, setSelectedMunicipal] =
    useState<PoliticalBoundaryOption | null>(null);
  const [selectedProvincial, setSelectedProvincial] =
    useState<PoliticalBoundaryOption | null>(null);
  const [selectedFederal, setSelectedFederal] =
    useState<PoliticalBoundaryOption | null>(null);

  // 1. Are you a candidate (+ election)
  const [isCandidate, setIsCandidate] = useState(false);
  const [candidateElection, setCandidateElection] = useState("");

  // 2. Are you a representative of a local organization (+ organization name)
  const [isOrgRepresentative, setIsOrgRepresentative] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  // 3. Are you a journalist (+ link to published article)
  const [isJournalist, setIsJournalist] = useState(false);
  const [publishedArticleUrl, setPublishedArticleUrl] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<"details" | "districts">("details");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<1 | 2 | 3>(1);

  // Redirect signed-out visitors to /register
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/register");
    }
  }, [loading, user, router]);

  // Populate form from existing Firestore profile or Google Auth displayName
  useEffect(() => {
    if (loading || profileLoading || !user) {
      return;
    }

    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.postcode) setPostcode(profile.postcode);
      if (profile.municipal_district) setSelectedMunicipal(profile.municipal_district);
      if (profile.provincial_district) setSelectedProvincial(profile.provincial_district);
      if (profile.federal_district) setSelectedFederal(profile.federal_district);
      if (typeof profile.is_candidate === "boolean") {
        setIsCandidate(profile.is_candidate);
      }
      if (profile.candidate_election) {
        setCandidateElection(profile.candidate_election);
      }
      if (typeof profile.is_org_representative === "boolean") {
        setIsOrgRepresentative(profile.is_org_representative);
      }
      if (profile.organization_name) {
        setOrganizationName(profile.organization_name);
      }
      if (typeof profile.is_journalist === "boolean") {
        setIsJournalist(profile.is_journalist);
      }
      if (profile.published_article_url) {
        setPublishedArticleUrl(profile.published_article_url);
      }
    }

    // If first/last name aren't saved yet, pre-fill from Google Auth displayName
    if (!profile?.first_name && !profile?.last_name && user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      const given = parts[0] ?? "";
      const family = parts.slice(1).join(" ");
      setFirstName((curr) => curr || given);
      setLastName((curr) => curr || family);
    }
  }, [loading, profileLoading, user, profile]);

  // Step 1 Submit: Validate form & fetch political boundaries from OpenNorth
  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setBoundaryError(null);

    const validation = validateVoteSocialProfileForm({
      first_name: firstName,
      last_name: lastName,
      postcode,
      is_candidate: isCandidate,
      candidate_election: candidateElection,
      is_org_representative: isOrgRepresentative,
      organization_name: organizationName,
      is_journalist: isJournalist,
      published_article_url: publishedArticleUrl,
    });
    setErrors(validation);
    if (!isValid(validation)) {
      return;
    }

    const cleanPostcode = normalizeCanadianPostcode(postcode);
    setBoundaryLoading(true);
    try {
      const res = await fetchBoundariesForPostcode(cleanPostcode);
      setBoundaryResolution(res);

      // Single match auto-selects; ambiguous (>1) requires explicit user selection on the next page
      setSelectedMunicipal(
        res.municipalOptions.length === 1 ? res.municipalOptions[0] : null,
      );
      setSelectedProvincial(
        res.provincialOptions.length === 1 ? res.provincialOptions[0] : null,
      );
      setSelectedFederal(
        res.federalOptions.length === 1 ? res.federalOptions[0] : null,
      );

      setFormStep("districts");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not resolve political districts for this postal code.";
      setBoundaryError(message);
    } finally {
      setBoundaryLoading(false);
    }
  }

  // Step 2 Confirm: Finalize and save profile once all ambiguous districts are chosen
  async function handleConfirmProfile() {
    if (!user || !boundaryResolution) {
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await saveUserProfile(user, {
        first_name: firstName,
        last_name: lastName,
        postcode: formatCanadianPostcode(postcode),
        city: boundaryResolution.city ?? profile?.city ?? null,
        province: boundaryResolution.province ?? profile?.province ?? null,
        municipal_district: selectedMunicipal,
        provincial_district: selectedProvincial,
        federal_district: selectedFederal,
        is_candidate: isCandidate,
        candidate_election: candidateElection,
        is_org_representative: isOrgRepresentative,
        organization_name: organizationName,
        is_journalist: isJournalist,
        published_article_url: publishedArticleUrl,
      });
      await refreshProfile();
      setJustSaved(true);
    } catch (error) {
      console.error("Failed to save user profile", error);
      setFormError(
        "Something went wrong while saving your profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || profileLoading || !user) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 shadow-md text-center text-sm text-slate-600">
        Loading your profile…
      </div>
    );
  }

  // Show completion summary when profile is completed
  if (profile?.profileComplete || justSaved) {
    const resolvedCity = boundaryResolution?.city ?? profile?.city;
    const resolvedProvince = boundaryResolution?.province ?? profile?.province;
    const formattedCode = postcode ? formatCanadianPostcode(postcode) : "M4K 1N2";

    return (
      <div className="space-y-10">
        {/* Waitlist Dashboard Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-md">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            className="w-full flex items-start justify-between gap-4 mb-5 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                  Waitlist Profile Complete
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  You’re on the Vote Social Early Access List!
                </h1>
              </div>
            </div>

            <div
              title={detailsOpen ? "Collapse profile details" : "Expand profile details"}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 group-hover:bg-slate-100 text-slate-600 transition shrink-0 mt-1"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  detailsOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {detailsOpen && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-sm mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="font-bold text-slate-900">
                  {firstName} {lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-mono text-xs text-slate-800">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Postal Code</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                  {formattedCode}
                  {resolvedCity
                    ? ` • ${resolvedCity}${resolvedProvince ? `, ${resolvedProvince}` : ""}`
                    : ""}
                </span>
              </div>

              {(selectedMunicipal || selectedProvincial || selectedFederal) && (
                <div className="pt-2.5 border-t border-slate-200 space-y-1.5">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Verified Political Boundaries
                  </span>
                  {selectedMunicipal && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Municipal / Local</span>
                      <span className="font-semibold text-slate-900">
                        {selectedMunicipal.name}{" "}
                        <span className="text-slate-500 font-normal">
                          ({selectedMunicipal.boundary_set_name})
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedProvincial && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Provincial Riding</span>
                      <span className="font-semibold text-slate-900">
                        {selectedProvincial.name}
                      </span>
                    </div>
                  )}
                  {selectedFederal && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Federal Riding</span>
                      <span className="font-semibold text-slate-900">
                        {selectedFederal.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isCandidate && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5" /> Candidate
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {candidateElection}
                  </span>
                </div>
              )}

              {isOrgRepresentative && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Local Organization Rep
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {organizationName}
                  </span>
                </div>
              )}

              {isJournalist && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" /> Journalist
                  </span>
                  <span className="text-xs font-mono text-slate-700 truncate max-w-[240px]">
                    {publishedArticleUrl}
                  </span>
                </div>
              )}
            </div>
          )}

          <WaitlistCarousel
            slide1Label="1 • Invite Neighbors"
            backToSlide1Label="Back to Invite Neighbors"
            highlightElectionSetIds={profile?.election_set_ids ?? []}
          >
            <WaitlistShareEmbed
              communityLabel={
                selectedMunicipal?.name ??
                boundaryResolution?.city ??
                profile?.city ??
                null
              }
              referralSlug={
                profile?.election_set_ids?.[0] ??
                (postcode ? normalizeCanadianPostcode(postcode) : null)
              }
            />
          </WaitlistCarousel>
        </div>

        {/* On-Page Interactive High-Fidelity Screen Showcase (Without Summarizing Hero Cards) */}
        <section className="pt-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Interactive Platform Preview
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Explore the 3 Live Screens
              </h2>
            </div>

            {/* Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 1
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Election Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(2)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 2
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Candidate Profiles
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShowcaseTab(3)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeShowcaseTab === 3
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Voter Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Browser Window Frame Wrapping Active Mock Screen */}
          <div className="rounded-3xl border border-slate-300 bg-white shadow-xl overflow-hidden">
            {/* Browser Chrome Header */}
            <div className="bg-slate-900 text-slate-300 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  votesocial.ca/
                  {activeShowcaseTab === 1
                    ? "toronto_2026/summary"
                    : activeShowcaseTab === 2
                    ? "toronto_2026/candidates"
                    : "ward-14/election-center"}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-emerald-400">
                  ● Verified Ward Session ({formattedCode})
                </span>
              </div>
            </div>

            {/* Active Screen Component */}
            <div>
              {activeShowcaseTab === 1 && <CommunityFeedScreen compact />}
              {activeShowcaseTab === 2 && <CandidateHubScreen compact />}
              {activeShowcaseTab === 3 && <ElectionCenterScreen compact />}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Step 2 of Form: Political District Verification & Ambiguous District Selection
  if (formStep === "districts" && boundaryResolution) {
    const municipalReady =
      boundaryResolution.municipalOptions.length <= 1 ||
      selectedMunicipal !== null;
    const provincialReady =
      boundaryResolution.provincialOptions.length <= 1 ||
      selectedProvincial !== null;
    const federalReady =
      boundaryResolution.federalOptions.length <= 1 || selectedFederal !== null;
    const allAmbiguousResolved =
      municipalReady && provincialReady && federalReady;

    const hasAmbiguous =
      boundaryResolution.municipalOptions.length > 1 ||
      boundaryResolution.provincialOptions.length > 1 ||
      boundaryResolution.federalOptions.length > 1;

    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
              Step 3 of 3 • Confirm Political Districts
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
              {boundaryResolution.formattedPostcode}
              {boundaryResolution.city
                ? ` • ${boundaryResolution.city}${
                    boundaryResolution.province
                      ? `, ${boundaryResolution.province}`
                      : ""
                  }`
                : ""}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5">
            Verify your electoral districts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {hasAmbiguous
              ? "Your postal code spans more than one boundary in the highlighted tiers below. Click your district card in each row to unlock confirmation."
              : "We matched your postal code to the electoral districts below. Confirm to finalize your profile."}
          </p>
        </div>

        {formError ? (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
          >
            {formError}
          </div>
        ) : null}

        <div className="space-y-4 mb-6">
          {/* Tier 1: Municipal / Ward */}
          <BoundaryTierSelector
            tierLabel="Municipal / Local Ward"
            options={boundaryResolution.municipalOptions}
            selected={selectedMunicipal}
            onSelect={setSelectedMunicipal}
            showBoundarySetSubtitle
          />

          {/* Tier 2: Provincial Electoral District */}
          <BoundaryTierSelector
            tierLabel="Provincial Electoral District"
            options={boundaryResolution.provincialOptions}
            selected={selectedProvincial}
            onSelect={setSelectedProvincial}
          />

          {/* Tier 3: Federal Electoral District */}
          <BoundaryTierSelector
            tierLabel="Federal Electoral District"
            options={boundaryResolution.federalOptions}
            selected={selectedFederal}
            onSelect={setSelectedFederal}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setFormStep("details");
              setFormError(null);
            }}
            className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            disabled={!allAmbiguousResolved || submitting}
            onClick={() => void handleConfirmProfile()}
            className="flex-1 py-3 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Finalizing Profile…</span>
              </>
            ) : (
              <>
                <BadgeCheck className="w-4 h-4" />
                <span>Confirm &amp; Finalize Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
          Step 3 of 3 • Profile Setup
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
          Complete your Vote Social profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Tell us your name and postal code so we can match you to your local ward, municipal, provincial, and federal elections.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleDetailsSubmit} noValidate className="space-y-5">
        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              First Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            {errors.first_name ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {errors.first_name}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Last Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            {errors.last_name ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {errors.last_name}
              </p>
            ) : null}
          </div>
        </div>

        {/* Postcode (Resolved on Submit) */}
        <div>
          <label
            htmlFor="postcode"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Canadian Postal Code *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="postcode"
              name="postcode"
              type="text"
              autoComplete="postal-code"
              value={postcode}
              onChange={(e) => {
                setPostcode(e.target.value);
                if (boundaryError) setBoundaryError(null);
              }}
              placeholder="A1A 1A1"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          {errors.postcode ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {errors.postcode}
            </p>
          ) : boundaryError ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {boundaryError}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              We’ll look up your Municipal Ward, Provincial Riding, and Federal Riding when you continue.
            </p>
          )}
        </div>

        {/* Optional Role Booleans + String Pairs */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Optional Civic Roles & Verification
            </span>
            <span className="text-[11px] text-slate-500">Select any that apply</span>
          </div>

          {/* 1. Candidate (+ election) */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              isCandidate
                ? "bg-blue-50/50 border-blue-300"
                : "bg-slate-50/70 border-slate-200"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCandidate}
                onChange={(e) => setIsCandidate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-700" />
                <span>Are you a candidate?</span>
              </span>
            </label>

            {isCandidate && (
              <div className="mt-3 pl-7">
                <label
                  htmlFor="candidate_election"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Which election / riding?
                </label>
                <input
                  id="candidate_election"
                  name="candidate_election"
                  type="text"
                  value={candidateElection}
                  onChange={(e) => setCandidateElection(e.target.value)}
                  placeholder="e.g. Toronto Ward 14 Councilor (2026 Municipal)"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
                {errors.candidate_election ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.candidate_election}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* 2. Representative of a local organization (+ organization name) */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              isOrgRepresentative
                ? "bg-emerald-50/50 border-emerald-300"
                : "bg-slate-50/70 border-slate-200"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOrgRepresentative}
                onChange={(e) => setIsOrgRepresentative(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Are you a representative of a local organization?</span>
              </span>
            </label>

            {isOrgRepresentative && (
              <div className="mt-3 pl-7">
                <label
                  htmlFor="organization_name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Organization name
                </label>
                <input
                  id="organization_name"
                  name="organization_name"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. More Neighbours Metro / Danforth BIA"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                {errors.organization_name ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.organization_name}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* 3. Journalist (+ link to published article) */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              isJournalist
                ? "bg-purple-50/50 border-purple-300"
                : "bg-slate-50/70 border-slate-200"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isJournalist}
                onChange={(e) => setIsJournalist(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-700 focus:ring-purple-600"
              />
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-purple-700" />
                <span>Are you a journalist?</span>
              </span>
            </label>

            {isJournalist && (
              <div className="mt-3 pl-7">
                <label
                  htmlFor="published_article_url"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Link to a published article
                </label>
                <input
                  id="published_article_url"
                  name="published_article_url"
                  type="url"
                  value={publishedArticleUrl}
                  onChange={(e) => setPublishedArticleUrl(e.target.value)}
                  placeholder="https://example.com/your-article"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-600"
                />
                {errors.published_article_url ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.published_article_url}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={boundaryLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          {boundaryLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resolving Political Districts…</span>
            </>
          ) : (
            <>
              <span>Find My Political Districts</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

interface BoundaryTierSelectorProps {
  tierLabel: string;
  options: PoliticalBoundaryOption[];
  selected: PoliticalBoundaryOption | null;
  onSelect: (option: PoliticalBoundaryOption) => void;
  showBoundarySetSubtitle?: boolean;
}

function BoundaryTierSelector({
  tierLabel,
  options,
  selected,
  onSelect,
  showBoundarySetSubtitle = false,
}: BoundaryTierSelectorProps) {
  if (options.length === 0) {
    return null;
  }

  // Single match: show clean auto-resolved card
  if (options.length === 1) {
    const only = options[0];
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            {tierLabel}
          </span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {only.name}
          </div>
          {showBoundarySetSubtitle && only.boundary_set_name ? (
            <div className="text-xs text-slate-500">{only.boundary_set_name}</div>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Matched</span>
        </span>
      </div>
    );
  }

  // Ambiguous (>1 match): present options on cards side-by-side and require user click
  return (
    <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/90 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-800">
          {tierLabel}
        </span>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Selected</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
            Select your district
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selected?.url === opt.url;
          return (
            <button
              key={opt.url}
              type="button"
              onClick={() => onSelect(opt)}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-600/20 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="font-bold text-xs sm:text-sm leading-snug">
                  {opt.name}
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>

              {opt.boundary_set_name ? (
                <div className="text-[11px] text-slate-500 font-normal">
                  {opt.boundary_set_name}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
