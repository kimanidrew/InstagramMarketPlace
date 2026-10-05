"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ProductMedia({
  src,
  poster,
  alt,
}: {
  src?: string | null;
  poster?: string | null;
  alt?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    video.addEventListener("timeupdate", update);
    return () => video.removeEventListener("timeupdate", update);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => undefined);
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

  function seek(value: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.currentTime = (value / 100) * video.duration;
    setProgress(value);
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
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition duration-200 hover:scale-105"
      >
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2 py-2 backdrop-blur-md">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pause video" : "Play video"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10">
            {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          </button>
          <input
            aria-label="Video progress"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 min-w-0 flex-1 accent-white"
          />
          <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10">
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}