"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ArrowLeft, Star, X } from "lucide-react";
import { ReviewSection } from "@/components/review-section";

export function StoreReviewsDrawer({
  username,
  storeId,
  reviews,
  currentUserId,
}: {
  username: string;
  storeId: string;
  reviews: any[];
  currentUserId?: string | null;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="store-reviews-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <a className="store-reviews-backdrop" href={"/store/" + username} aria-label="Close reviews" />
        <motion.aside
          className="store-reviews-drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 36 }}
          aria-label={"Reviews for @" + username}
        >
          <div className="store-reviews-header">
            <div>
              <span className="store-reviews-kicker"><Star size={12} fill="currentColor" /> Community feedback</span>
              <h2>Reviews</h2>
              <p>@{username}</p>
            </div>
            <a href={"/store/" + username} className="store-reviews-close" aria-label="Close reviews">
              <X size={19} />
            </a>
          </div>

          <div className="store-reviews-scroll">
            <ReviewSection
              type="store"
              targetId={storeId}
              reviews={reviews}
              currentUserId={currentUserId}
              title={"Reviews for @" + username}
            />
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
