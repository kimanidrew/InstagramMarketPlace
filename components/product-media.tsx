"use client";

import { Play, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProductMedia({
  src,
  poster,
  alt,
  href,
}: {
  src?: string | null;
  poster?: string | null;
  alt?: string;
  href?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!playing) return;

    const handleOtherVideoPlay = (event: Event) => {
      const otherVideo = event.target;
      if (otherVideo instanceof HTMLVideoElement && otherVideo !== videoRef.current) {
        videoRef.current?.pause();
      }
    };

    window.addEventListener("product-video-play", handleOtherVideoPlay);
    window.dispatchEvent(new Event("product-video-play"));

    return () => {
      window.removeEventListener("product-video-play", handleOtherVideoPlay);
    };
  }, [playing]);

  function openProduct() {
    if (href) router.push(href);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          setPlaying(true);
          window.dispatchEvent(new Event("product-video-play"));
        })
        .catch(() => undefined);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div className="group relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster || undefined}
        playsInline
        muted={muted}
        loop
        preload="metadata"
        aria-label={alt || "Product video"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={openProduct}
        className="h-full w-full cursor-pointer object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); togglePlay(); }}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition duration-200 hover:scale-105"
      >
        <Play size={21} fill="currentColor" className="ml-0.5" />
      </button>

      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); toggleMute(); }}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/70"
      >
        {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
    </div>
  );
}