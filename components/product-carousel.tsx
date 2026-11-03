"use client";

import { ChevronDown, ChevronUp, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MediaItem = { mediaType: string; mediaUrl?: string | null; thumbnailUrl?: string | null };

export function ProductCarousel({ items, fallback, title }: { items?: MediaItem[] | null; fallback: MediaItem; title: string }) {
  const media = useMemo(() => {
    const valid = (items || []).filter((item) => item?.mediaUrl || item?.thumbnailUrl);
    return valid.length ? valid : [fallback];
  }, [items, fallback]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const thumbnailRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [media.length]);

  const go = useCallback((next: number) => {
    const normalized = (next + media.length) % media.length;
    if (normalized === index) return;
    setDirection(normalized > index || (index === media.length - 1 && normalized === 0) ? "down" : "up");
    setIndex(normalized);
  }, [index, media.length]);

  useEffect(() => {
    const active = thumbnailRailRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  function toggleMute() {
    const video = videoRefs.current[index];
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  const current = media[index];
  const isVideo = String(current.mediaType || "").toUpperCase() === "VIDEO";
  const thumbnailSrc = (item: MediaItem) => item.thumbnailUrl || item.mediaUrl || "";

  return (
    <div className="product-carousel">
      <div className="product-carousel-gallery">
        {media.length > 1 && (
          <div ref={thumbnailRailRef} className="product-carousel-thumbnails" aria-label="Choose product image">
            {media.map((item, i) => {
              const video = String(item.mediaType || "").toUpperCase() === "VIDEO";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={"View " + (video ? "video " : "image ") + (i + 1)}
                  aria-current={i === index}
                  className={"product-carousel-thumbnail" + (i === index ? " is-active" : "")}
                >
                  {item.thumbnailUrl || (!video && item.mediaUrl) ? <img src={item.thumbnailUrl || item.mediaUrl || ""} alt="" loading="lazy" decoding="async" /> : <span className="product-carousel-thumbnail-empty" />}
                  {video && <span className="product-carousel-thumbnail-play"><Play size={12} fill="currentColor" /></span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="product-carousel-stage-column">
          <div className="product-carousel-stage">
            <div key={index} className={"product-carousel-slide product-carousel-slide-" + direction}>
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
                <img src={current.mediaUrl || current.thumbnailUrl || ""} alt={title + " image " + (index + 1)} className="h-full w-full object-contain object-center" fetchPriority="high" decoding="async" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#999]">No media available</div>
              )}
            </div>

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
              <button type="button" onClick={() => window.dispatchEvent(new Event("sokolink-close-listing-modal"))} aria-label="Close details" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {media.length > 1 && (
          <div className="product-carousel-vertical-controls">
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous image" className="product-carousel-vertical-button" disabled={false}><ChevronUp size={21} /></button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next image" className="product-carousel-vertical-button" disabled={false}><ChevronDown size={21} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
