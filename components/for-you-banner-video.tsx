"use client";

import { useCallback, useEffect, useRef } from "react";

const BACKGROUND_VIDEO =
  "https://videos.pexels.com/video-files/8306451/8306451-hd_1920_1080_25fps.mp4";

export function ForYouBannerVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inViewRef = useRef(false);

  const updatePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inViewRef.current && !document.hidden) {
      // Re-assert muted playback for browsers that block autoplay until the
      // media element has completed its initial load.
      video.muted = true;
      const playback = video.play();
      if (playback) playback.catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        updatePlayback();
      },
      { threshold: 0.01, rootMargin: "80px 0px" },
    );

    const onVisibilityChange = () => updatePlayback();
    observer.observe(section);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Some browsers ignore the initial autoplay attribute until play() is
    // called after the element is attached and its source has started loading.
    video.load();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.pause();
    };
  }, [updatePlayback]);

  return (
    <div
      ref={sectionRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[rgba(0,0,0,0.4)]"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-[1.06] object-cover opacity-75 blur-[4px] sm:blur-[6px]"
        src={BACKGROUND_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        preload="auto"
        onLoadedData={updatePlayback}
        onCanPlay={updatePlayback}
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20 md:to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
    </div>
  );
}
