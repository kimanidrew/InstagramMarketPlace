import "server-only";
import type { PromotionMode } from "./contracts";

export function cinematicProviderEnabled() {
  return process.env.AI_PROMOTION_CINEMATIC_ENABLED === "true" &&
    Boolean(process.env.RUNWAYML_API_SECRET);
}

export function motionOnlyFallback(mode: PromotionMode) {
  return mode === "MOTION" || !cinematicProviderEnabled();
}

export function maxActiveCampaigns() {
  const configured = Number(process.env.AI_PROMOTION_MAX_ACTIVE_PER_SELLER || 3);
  return Number.isFinite(configured) ? Math.max(1, Math.min(10, Math.floor(configured))) : 3;
}

export function maxCinematicCreditsPerCampaign() {
  const configured = Number(process.env.AI_PROMOTION_MAX_CREDITS_PER_CAMPAIGN || 2);
  return Number.isFinite(configured) ? Math.max(0, Math.min(20, Math.floor(configured))) : 2;
}
