"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ActiveElectionSetsBoard from "@/components/screens/ActiveElectionSetsBoard";
import WaitlistMessageBoard from "@/components/screens/WaitlistMessageBoard";

interface WaitlistCarouselProps {
  /** Pill label for Slide 1, e.g. "1 • Join the Waitlist" or "1 • Invite Neighbors" */
  slide1Label: string;
  /** Pill label for Slide 2, defaults to "2 • Leaderboard & Conversation" */
  slide2Label?: string;
  /** Label on the Back button inside Slide 2 */
  backToSlide1Label: string;
  /** Optional election set IDs to highlight in the Leaderboard */
  highlightElectionSetIds?: string[];
  /** Slide 1 primary CTA content */
  children: React.ReactNode;
}

export default function WaitlistCarousel({
  slide1Label,
  slide2Label = "2 • Leaderboard & Feedback",
  backToSlide1Label,
  highlightElectionSetIds = [],
  children,
}: WaitlistCarouselProps) {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [carouselHeight, setCarouselHeight] = useState<number | undefined>(
    undefined,
  );
  const slide0Ref = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeSlideEl =
      activeSlide === 0 ? slide0Ref.current : slide1Ref.current;
    if (!activeSlideEl) {
      return;
    }

    const updateHeight = () => {
      setCarouselHeight(activeSlideEl.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(activeSlideEl);

    return () => {
      observer.disconnect();
    };
  }, [activeSlide]);

  return (
    <div>
      {/* Carousel Top Controls / Pill Switcher */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="inline-flex items-center rounded-full bg-slate-200/80 p-1 border border-slate-300/60">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeSlide === 0
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {slide1Label}
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeSlide === 1
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {slide2Label}
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Viewport */}
      <div
        className="overflow-hidden transition-[height] duration-500 ease-in-out"
        style={
          carouselHeight !== undefined
            ? { height: `${carouselHeight}px` }
            : undefined
        }
      >
        <div
          className="flex items-start transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {/* ==================== SLIDE 1: PRIMARY CTA ==================== */}
          <div
            ref={slide0Ref}
            className="w-full shrink-0 px-1 py-1 text-center"
          >
            {children}
          </div>

          {/* ==================== SLIDE 2: LEADERBOARD & CONVERSATION ==================== */}
          <div ref={slide1Ref} className="w-full shrink-0 px-1 py-1 text-left">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSlide(0)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-blue-700" />
                  <span>{backToSlide1Label}</span>
                </button>

                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Slide 2 of 2 • Live Community Activity
                </span>
              </div>

              <ActiveElectionSetsBoard
                highlightIds={highlightElectionSetIds}
                compact
              />
              <WaitlistMessageBoard />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label={slide1Label}
          onClick={() => setActiveSlide(0)}
          className={`h-2 rounded-full transition-all cursor-pointer ${
            activeSlide === 0
              ? "w-7 bg-blue-700"
              : "w-2 bg-slate-300 hover:bg-slate-400"
          }`}
        />
        <button
          type="button"
          aria-label={slide2Label}
          onClick={() => setActiveSlide(1)}
          className={`h-2 rounded-full transition-all cursor-pointer ${
            activeSlide === 1
              ? "w-7 bg-blue-700"
              : "w-2 bg-slate-300 hover:bg-slate-400"
          }`}
        />
      </div>
    </div>
  );
}
