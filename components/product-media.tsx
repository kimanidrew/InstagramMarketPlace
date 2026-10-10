"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ProductMedia({
  src,
  poster,
  alt,
}: {
  src?: string | null;
  poster?: string | null;
  alt?: string;
  href?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const pauseWhenAnotherVideoStarts = (event: Event) => {
      const activeVideo = (event as CustomEvent<HTMLVideoElement>).detail;
      if (activeVideo && activeVideo !== video) {
        video.pause();
      }
    };

    window.addEventListener("product-video-play", pauseWhenAnotherVideoStarts);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
          video.pause();
        }
      },
      { threshold: [0, 0.15, 0.5] }
    );
    observer.observe(video);

    return () => {
      window.removeEventListener("product-video-play", pauseWhenAnotherVideoStarts);
      observer.disconnect();
      video.pause();
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      return;
    }

    // Playback is initiated by the user's click and starts with sound enabled.
    video.muted = false;
    video.volume = 1;
    video.play()
      .then(() => {
        setPlaying(true);
        window.dispatchEvent(new CustomEvent("product-video-play", { detail: video }));
      })
      .catch(() => setPlaying(false));
  }

  return (
    <div className="group relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster || undefined}
        playsInline
        muted={false}
        loop
        preload="metadata"
        aria-label={alt || "Product video"}
        onPlay={() => {
          setPlaying(true);
          const video = videoRef.current;
          if (video) window.dispatchEvent(new CustomEvent("product-video-play", { detail: video }));
        }}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
        className="h-full w-full cursor-pointer object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          togglePlay();
        }}
        aria-label={playing ? "Pause video" : "Play video"}
        className={
          "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition-all duration-500 hover:scale-105 " +
          (playing ? "pointer-events-none opacity-0 group-hover:opacity-100" : "opacity-100")
        }
      >
        {playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  );
}
