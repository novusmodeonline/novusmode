"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HeroCarouselImages } from "@/config/staticImages";

const AUTO_SLIDE_INTERVAL = 4500;

export default function HeroCarousel({ slides = HeroCarouselImages }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const restartAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL);
  };

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const goTo = (i) => {
    setActive(i);
    restartAutoplay();
  };
  const prev = () => {
    setActive((p) => (p - 1 + slides.length) % slides.length);
    restartAutoplay();
  };
  const next = () => {
    setActive((p) => (p + 1) % slides.length);
    restartAutoplay();
  };

  return (
    <div
      className="
        relative w-full overflow-hidden group
        bg-[var(--color-inverted-bg)] text-[var(--color-text)]
        h-[260px] sm:h-[320px] md:h-[420px] lg:h-[480px] xl:h-[800px]
      "
      aria-roledescription="carousel"
    >
      {slides.map((slide, idx) => {
        const desktopSrc = slide.image;
        const mobileSrc = slide.imageMobile || desktopSrc; // fallback

        const isActive = idx === active;
        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            aria-hidden={!isActive}
          >
            {/* Desktop image (no zoom/crop): object-contain */}
            <div className="hidden md:block absolute inset-0">
              <Image
                src={desktopSrc}
                alt={slide.headline}
                fill
                className="object-cover"
                style={{ objectPosition: "center 25%" }}
                sizes="100vw"
                priority={idx === 0}
                decoding="async"
                // placeholder="blur" blurDataURL="/placeholder-tiny.jpg"
              />
              {/* background behind letterboxing */}
              <div className="absolute inset-0 bg-[var(--color-inverted-bg)] -z-10" />
            </div>

            {/* Mobile image (immersive): object-cover */}
            <div className="md:hidden absolute inset-0">
              <Image
                src={mobileSrc}
                alt={slide.headline}
                fill
                className="object-cover"
                sizes="100vw"
                priority={idx === 0}
                decoding="async"
              />
            </div>

            {/* Overlay & text */}
            <div className="absolute inset-0 bg-transparent flex flex-col justify-center items-start px-6 sm:px-14 xl:px-28">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-3 drop-shadow">
                {slide.headline}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text)] mb-6 max-w-md">
                {slide.description}
              </p>
              {slide?.cta && (
                <a
                  href={slide.cta.link}
                  className="
                  inline-block px-6 py-2 rounded-xl font-semibold shadow transition
                  bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]
                  hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]
                "
                >
                  {slide.cta.label}
                </a>
              )}
            </div>
          </div>
        );
      })}

      {/* Left arrow */}
      <button
        className="
          absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition
          bg-[var(--color-bg)] text-[var(--color-text)]
          opacity-80 hover:opacity-100
        "
        onClick={prev}
        aria-label="Previous Slide"
      >
        <FaChevronLeft size={22} />
      </button>

      {/* Right arrow */}
      <button
        className="
          absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition
          bg-[var(--color-bg)] text-[var(--color-text)]
          opacity-80 hover:opacity-100
        "
        onClick={next}
        aria-label="Next Slide"
      >
        <FaChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-7 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`
              w-3 h-3 rounded-full border transition
              border-[var(--color-text)]
              ${
                idx === active
                  ? "bg-[var(--color-text)] shadow-lg scale-125"
                  : "bg-transparent hover:bg-[var(--color-text)]/70"
              }
            `}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === active}
            onClick={() => goTo(idx)}
          />
        ))}
      </div>
    </div>
  );
}
