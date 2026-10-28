import "server-only";
import { db } from "@/lib/prisma";

const numberEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export async function getAiPromotionPricingConfig() {
  return db().aiPromotionPricingConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function quoteAiPromotionPrice(durationSeconds: number, generateAudio: boolean) {
  if (![10, 15].includes(durationSeconds)) throw new Error("Choose a supported video duration.");
  const config = await getAiPromotionPricingConfig();
  if (!config.enabled) throw new Error("AI video generation payments are temporarily unavailable.");
  const perSecond = numberEnv(generateAudio ? "FAL_KLING_V3_PRO_AUDIO_USD_PER_SECOND" : "FAL_KLING_V3_PRO_SILENT_USD_PER_SECOND", generateAudio ? 0.168 : 0.112);
  const providerCostUsd = Number((perSecond * durationSeconds).toFixed(4));
  const override = durationSeconds === 10
    ? (generateAudio ? config.override10AudioKes : config.override10SilentKes)
    : (generateAudio ? config.override15AudioKes : config.override15SilentKes);
  const calculatedKes = Math.ceil((providerCostUsd * config.usdKesRate * (1 + config.marginPercent / 100) + config.fixedFeeKes) / 10) * 10;
  const amountKes = override && override > 0 ? override : Math.max(config.minPriceKes, calculatedKes);
  return {
    currency: "KES",
    amountKes,
    providerCostUsd,
    providerCostKes: Math.ceil(providerCostUsd * config.usdKesRate),
    marginPercent: config.marginPercent,
    usdKesRate: config.usdKesRate,
    fixedFeeKes: config.fixedFeeKes,
    overridden: Boolean(override && override > 0),
    durationSeconds,
    generateAudio,
    perSecondUsd: perSecond,
    configEnabled: config.enabled,
  };
}
