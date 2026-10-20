"use client";

import { ChevronLeft, ChevronRight, Image as ImageIcon, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type MediaItem = { mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null };

export function ProductCarousel({ items, fallback, title }: { items?: MediaItem[] | null; fallback: MediaItem; title: string }) {
  const media = useMemo(() => {
    const valid = (items || []).filter((item) => item?.mediaUrl || item?.thumbnailUrl);
    return valid.length ? valid : [fallback];
  }, [items, fallback]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => setIndex(0), [media.length]);

  function go(next: number) {
    setIndex((next + media.length) % media.length);
  }

  function toggleMute() {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  const current = media[index];
  const isVideo = String(current.mediaType || "").toUpperCase() === "VIDEO";

  return (
    <div className="product-carousel">
      <div className="product-carousel-stage">
        {isVideo && current.mediaUrl ? (
          <>
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              src={current.mediaUrl}
              poster={current.thumbnailUrl || undefined}
              playsInline
              controls
              muted={muted}
              preload="metadata"
              aria-label={title + " video " + (index + 1)}
              className="h-full w-full object-contain object-center"
            />
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"} className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/75">
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </>
        ) : current.mediaUrl || current.thumbnailUrl ? (
          <img src={current.mediaUrl || current.thumbnailUrl || ""} alt={title + " image " + (index + 1)} className="h-full w-full object-contain object-center" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#999]">No media available</div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4">
          <span className="rounded-full border border-black/[0.08] bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-black shadow-sm backdrop-blur-md">
            {isVideo ? "Video" : "Photo"} {media.length > 1 ? "· " + (index + 1) + "/" + media.length : ""}
          </span>
          {media.length > 1 && <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-black text-white shadow-sm backdrop-blur-md">Swipe to explore</span>}
        </div>

        {media.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous media" className="product-carousel-arrow product-carousel-arrow-left"><ChevronLeft size={21} /></button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next media" className="product-carousel-arrow product-carousel-arrow-right"><ChevronRight size={21} /></button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="product-carousel-controls">
          <div className="product-carousel-dots" aria-label="Product media">
            {media.map((item, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={"View media " + (i + 1)} aria-current={i === index} className={"product-carousel-dot" + (i === index ? " active" : "")}>
                <span>{String(item.mediaType || "").toUpperCase() === "VIDEO" ? <Play size={10} fill="currentColor" /> : <ImageIcon size={10} />}</span>
              </button>
            ))}
          </div>
          <span className="product-carousel-count">{index + 1} / {media.length}</span>
        </div>
      )}

    </div>
  );
}
