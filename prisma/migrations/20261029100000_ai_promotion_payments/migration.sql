ALTER TYPE "AiPromotionStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TABLE "AiPromotionProject" ADD COLUMN "generateAudio" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "AiPromotionPaymentStatus" AS ENUM ('INITIATED','PENDING','PAID','FAILED','REFUND_PENDING','REFUNDED');

CREATE TABLE "AiPromotionPricingConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "usdKesRate" DOUBLE PRECISION NOT NULL DEFAULT 130,
  "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 35,
  "fixedFeeKes" INTEGER NOT NULL DEFAULT 20,
  "minPriceKes" INTEGER NOT NULL DEFAULT 250,
  "override10SilentKes" INTEGER,
  "override10AudioKes" INTEGER,
  "override15SilentKes" INTEGER,
  "override15AudioKes" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "AiPromotionPricingConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPromotionPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "providerCostUsd" DOUBLE PRECISION NOT NULL,
  "amountKes" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "phoneNumber" TEXT NOT NULL,
  "status" "AiPromotionPaymentStatus" NOT NULL DEFAULT 'INITIATED',
  "priceSnapshot" JSONB NOT NULL,
  "merchantRequestId" TEXT,
  "checkoutRequestId" TEXT,
  "receiptNumber" TEXT,
  "resultCode" TEXT,
  "resultDescription" TEXT,
  "refundReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  CONSTRAINT "AiPromotionPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiPromotionPayment_checkoutRequestId_key" ON "AiPromotionPayment"("checkoutRequestId");
CREATE UNIQUE INDEX "AiPromotionPayment_receiptNumber_key" ON "AiPromotionPayment"("receiptNumber");
CREATE UNIQUE INDEX "AiPromotionPayment_userId_idempotencyKey_key" ON "AiPromotionPayment"("userId","idempotencyKey");
CREATE INDEX "AiPromotionPayment_userId_createdAt_idx" ON "AiPromotionPayment"("userId","createdAt");
CREATE INDEX "AiPromotionPayment_projectId_status_idx" ON "AiPromotionPayment"("projectId","status");
CREATE INDEX "AiPromotionPayment_status_createdAt_idx" ON "AiPromotionPayment"("status","createdAt");

ALTER TABLE "AiPromotionPayment" ADD CONSTRAINT "AiPromotionPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiPromotionPayment" ADD CONSTRAINT "AiPromotionPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AiPromotionProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
