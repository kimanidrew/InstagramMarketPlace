CREATE TABLE "AiPromotionCampaign" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "postId" TEXT,
  "title" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'PRODUCT',
  "mode" TEXT NOT NULL DEFAULT 'HYBRID',
  "prompt" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL DEFAULT 15,
  "format" TEXT NOT NULL DEFAULT 'VERTICAL',
  "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "provider" TEXT NOT NULL DEFAULT 'REPLICATE',
  "providerOutputUrl" TEXT,
  "finalVideoUrl" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiPromotionCampaign_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiPromotionJob" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "providerPredictionId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPromotionJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiPromotionCampaign_userId_createdAt_idx" ON "AiPromotionCampaign"("userId", "createdAt");
CREATE INDEX "AiPromotionCampaign_connectionId_status_idx" ON "AiPromotionCampaign"("connectionId", "status");
CREATE INDEX "AiPromotionCampaign_status_createdAt_idx" ON "AiPromotionCampaign"("status", "createdAt");
CREATE UNIQUE INDEX "AiPromotionJob_campaignId_key" ON "AiPromotionJob"("campaignId");
CREATE UNIQUE INDEX "AiPromotionJob_providerPredictionId_key" ON "AiPromotionJob"("providerPredictionId");
CREATE INDEX "AiPromotionJob_status_nextRunAt_idx" ON "AiPromotionJob"("status", "nextRunAt");
ALTER TABLE "AiPromotionCampaign" ADD CONSTRAINT "AiPromotionCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiPromotionCampaign" ADD CONSTRAINT "AiPromotionCampaign_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "InstagramConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiPromotionCampaign" ADD CONSTRAINT "AiPromotionCampaign_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiPromotionJob" ADD CONSTRAINT "AiPromotionJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiPromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
