"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PREVIEW_DURATION_MS = 4500;
const visibleVideos = new Map<HTMLVideoElement, true>();
let activeVideo: HTMLVideoElement | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let nextVideoIndex = 0;

function clearPreviewTimer() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = null;
}

function playVideo(video: HTMLVideoElement, muted: boolean, rotatePreview = true) {
  clearPreviewTimer();
  if (activeVideo && activeVideo !== video) activeVideo.pause();

  activeVideo = video;
  video.muted = muted;
  video.volume = muted ? 0 : 1;
  video.play().then(() => {
    if (activeVideo !== video) {
      video.pause();
      return;
    }
    if (rotatePreview) {
      previewTimer = setTimeout(() => {
        video.pause();
        if (activeVideo === video) activeVideo = null;
        previewTimer = null;
        playNextVisibleVideo();
      }, PREVIEW_DURATION_MS);
    }
  }).catch(() => {
    if (activeVideo === video) activeVideo = null;
    clearPreviewTimer();
    playNextVisibleVideo();
  });
}

function playNextVisibleVideo() {
  if (activeVideo || visibleVideos.size === 0) return;
  const videos = Array.from(visibleVideos.keys());
  const index = nextVideoIndex % videos.length;
  const video = videos[index];
  nextVideoIndex = (index + 1) % videos.length;
  if (video && video.isConnected && visibleVideos.has(video)) {
    playVideo(video, true);
  }
}

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
    if (!video || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      const isVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.25);
      if (isVisible) {
        visibleVideos.set(video, true);
        playNextVisibleVideo();
        return;
      }

      visibleVideos.delete(video);
      if (activeVideo === video) {
        clearPreviewTimer();
        video.pause();
        activeVideo = null;
        playNextVisibleVideo();
      }
    }, { threshold: [0, 0.25, 0.5] });

    observer.observe(video);
    return () => {
      observer.disconnect();
      visibleVideos.delete(video);
      if (activeVideo === video) {
        clearPreviewTimer();
        video.pause();
        activeVideo = null;
        playNextVisibleVideo();
      }
      video.pause();
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      clearPreviewTimer();
      video.pause();
      if (activeVideo === video) activeVideo = null;
      playNextVisibleVideo();
      return;
    }

    // A deliberate tap keeps the existing sound-on playback behavior.
    playVideo(video, false);
  }

  return (
    <div className="group relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src || undefined}
        poster={poster || undefined}
        playsInline
        muted
        loop
        preload="metadata"
        aria-label={alt || "Product video"}
        onPlay={() => setPlaying(true)}
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
          (playing ? "opacity-0 group-hover:opacity-100" : "opacity-100")
        }
      >
        {playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  );
}
