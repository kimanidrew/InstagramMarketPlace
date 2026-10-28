"use client";

import { useEffect, useRef } from "react";

const BACKGROUND_VIDEO =
  "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4";

export function ForYouBannerVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    let inView = false;
    const updatePlayback = () => {
      if (inView && !document.hidden) {
        const playback = video.play();
        if (playback) playback.catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.12;
        updatePlayback();
      },
      { threshold: [0, 0.12, 0.35] },
    );

    const onVisibilityChange = () => updatePlayback();
    observer.observe(section);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.pause();
    };
  }, []);

  return (
    <div ref={sectionRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-[1.08] object-cover opacity-55 blur-[5px] sm:blur-[7px]"
        src={BACKGROUND_VIDEO}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35 md:to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
    </div>
  );
}
