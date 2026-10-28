"use client";

import { useEffect, useRef } from "react";

const BACKGROUND_VIDEO =
  "https://videos.pexels.com/video-files/8306451/8306451-hd_1920_1080_25fps.mp4";

export function ForYouBannerVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

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
        inView = entry.isIntersecting;
        updatePlayback();
      },
      { threshold: 0, rootMargin: "80px 0px" },
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
        className="absolute inset-0 h-full w-full scale-[1.06] object-cover opacity-75 blur-[4px] sm:blur-[6px]"
        src={BACKGROUND_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        preload="auto"
        onError={() => { videoRef.current?.classList.add("hidden"); }}
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20 md:to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
    </div>
  );
}
