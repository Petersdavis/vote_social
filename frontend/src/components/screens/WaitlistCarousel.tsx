"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";

const WaitlistMessageBoard = dynamic(
  () => import("@/components/screens/WaitlistMessageBoard"),
);

export interface CarouselSlideItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface WaitlistCarouselProps {
  /** Multi-slide configuration (e.g., Waitlist | Feedback | Blog | Our Why | Demo Pages) */
  slides?: CarouselSlideItem[];
  /** Optional controlled slide index */
  activeSlideIndex?: number;
  /** Optional callback when active slide changes */
  onSlideChange?: (index: number) => void;
  /** Legacy 2-slide props for backwards compatibility */
  slide1Label?: string;
  slide2Label?: string;
  backToSlide1Label?: string;
  children?: React.ReactNode;
}

export default function WaitlistCarousel({
  slides,
  activeSlideIndex,
  onSlideChange,
  slide1Label = "Waitlist",
  slide2Label = "Feedback",
  backToSlide1Label = "Back to Waitlist",
  children,
}: WaitlistCarouselProps) {
  const [internalSlide, setInternalSlide] = useState<number>(0);
  const activeSlide =
    activeSlideIndex !== undefined ? activeSlideIndex : internalSlide;

  const [visitedSlides, setVisitedSlides] = useState<Record<number, boolean>>({
    0: true,
  });
  const [carouselHeight, setCarouselHeight] = useState<number | undefined>(
    undefined,
  );
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const selectSlide = (index: number) => {
    setVisitedSlides((prev) => ({ ...prev, [index]: true }));
    if (activeSlideIndex === undefined) {
      setInternalSlide(index);
    }
    onSlideChange?.(index);
  };

  const resolvedSlides: CarouselSlideItem[] = slides ?? [
    {
      id: "slide-0",
      label: slide1Label,
      content: children,
    },
    {
      id: "slide-1",
      label: slide2Label,
      content: (
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => selectSlide(0)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-blue-700" />
              <span>{backToSlide1Label}</span>
            </button>

            <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
              {slide2Label}
            </span>
          </div>

          {(visitedSlides[1] || activeSlide === 1) && <WaitlistMessageBoard />}
        </div>
      ),
    },
  ];

  useEffect(() => {
    const activeSlideEl = slideRefs.current[activeSlide];
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
  }, [activeSlide, resolvedSlides.length]);

  return (
    <div>
      {/* Carousel Top Controls / Pill Switcher */}
      <div
        role="group"
        aria-label="Landing Page Section Switcher"
        className="flex items-center justify-center gap-2 mb-6"
      >
        <div className="inline-flex flex-wrap items-center justify-center rounded-2xl sm:rounded-full bg-slate-200/80 p-1 border border-slate-300/60 gap-1">
          {resolvedSlides.map((slide, idx) => {
            const isActive = activeSlide === idx;
            return (
              <button
                key={slide.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectSlide(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {slide.label}
              </button>
            );
          })}
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
          {resolvedSlides.map((slide, idx) => {
            const isActive = activeSlide === idx;
            return (
              <div
                key={slide.id}
                ref={(el) => {
                  slideRefs.current[idx] = el;
                }}
                aria-hidden={!isActive}
                inert={!isActive ? true : undefined}
                className="w-full shrink-0 px-1 py-1"
              >
                {slide.content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {resolvedSlides.map((slide, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.label}`}
              aria-pressed={isActive}
              onClick={() => selectSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                isActive
                  ? "w-7 bg-blue-700"
                  : "w-2.5 bg-slate-400 hover:bg-slate-500"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
