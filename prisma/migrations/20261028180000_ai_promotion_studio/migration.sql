-- AI Promotion Studio tables; existing marketplace promotion/payment tables are untouched.
CREATE TYPE "AiPromotionScope" AS ENUM ('PRODUCT', 'STORE');
CREATE TYPE "AiPromotionMode" AS ENUM ('MOTION', 'HYBRID', 'CINEMATIC');
CREATE TYPE "AiPromotionStatus" AS ENUM ('DRAFT', 'QUEUED', 'PLANNING', 'GENERATING', 'RENDERING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "AiPromotionJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'RETRY_WAIT', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "AiPromotionSceneStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED', 'SKIPPED');
CREATE TYPE "AiPromotionAssetType" AS ENUM ('SOURCE_IMAGE', 'GENERATED_CLIP', 'RENDERED_VIDEO', 'THUMBNAIL', 'AUDIO', 'INTERMEDIATE');
CREATE TYPE "AiPromotionCreditEntryType" AS ENUM ('GRANT', 'RESERVE', 'CHARGE', 'RELEASE', 'REFUND', 'ADJUSTMENT');

CREATE TABLE "AiPromotionCampaign" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "postId" TEXT,
  "scope" "AiPromotionScope" NOT NULL,
  "mode" "AiPromotionMode" NOT NULL DEFAULT 'HYBRID',
  "status" "AiPromotionStatus" NOT NULL DEFAULT 'DRAFT',
  "durationSeconds" INTEGER NOT NULL DEFAULT 15,
  "width" INTEGER NOT NULL DEFAULT 1080,
  "height" INTEGER NOT NULL DEFAULT 1920,
  "frameRate" INTEGER NOT NULL DEFAULT 30,
  "prompt" TEXT NOT NULL,
  "sourceSnapshot" JSONB,
  "storyboard" JSONB,
  "outputKey" TEXT,
  "thumbnailKey" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiPromotionCampaign_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionCampaign_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "InstagramConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionCampaign_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AiPromotionCampaign_userId_createdAt_idx" ON "AiPromotionCampaign"("userId", "createdAt");
CREATE INDEX "AiPromotionCampaign_connectionId_status_createdAt_idx" ON "AiPromotionCampaign"("connectionId", "status", "createdAt");
CREATE INDEX "AiPromotionCampaign_status_updatedAt_idx" ON "AiPromotionCampaign"("status", "updatedAt");

CREATE TABLE "AiPromotionJob" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "status" "AiPromotionJobStatus" NOT NULL DEFAULT 'QUEUED',
  "stage" TEXT NOT NULL DEFAULT 'planning',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 4,
  "idempotencyKey" TEXT NOT NULL,
  "leaseExpiresAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "provider" TEXT,
  "providerTaskId" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPromotionJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiPromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionJob_idempotencyKey_key" ON "AiPromotionJob"("idempotencyKey");
CREATE INDEX "AiPromotionJob_status_nextAttemptAt_idx" ON "AiPromotionJob"("status", "nextAttemptAt");
CREATE INDEX "AiPromotionJob_leaseExpiresAt_idx" ON "AiPromotionJob"("leaseExpiresAt");
CREATE INDEX "AiPromotionJob_campaignId_createdAt_idx" ON "AiPromotionJob"("campaignId", "createdAt");
CREATE INDEX "AiPromotionJob_provider_providerTaskId_idx" ON "AiPromotionJob"("provider", "providerTaskId");

CREATE TABLE "AiPromotionScene" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "jobId" TEXT,
  "position" INTEGER NOT NULL,
  "startSeconds" INTEGER NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "strategy" "AiPromotionMode" NOT NULL DEFAULT 'MOTION',
  "status" "AiPromotionSceneStatus" NOT NULL DEFAULT 'PENDING',
  "sourceAssetKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "outputAssetKey" TEXT,
  "provider" TEXT,
  "providerTaskId" TEXT,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPromotionScene_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionScene_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiPromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionScene_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AiPromotionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionScene_campaignId_position_key" ON "AiPromotionScene"("campaignId", "position");
CREATE INDEX "AiPromotionScene_campaignId_status_position_idx" ON "AiPromotionScene"("campaignId", "status", "position");
CREATE INDEX "AiPromotionScene_provider_providerTaskId_idx" ON "AiPromotionScene"("provider", "providerTaskId");

CREATE TABLE "AiPromotionAsset" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "sceneId" TEXT,
  "type" "AiPromotionAssetType" NOT NULL,
  "objectKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT,
  "width" INTEGER,
  "height" INTEGER,
  "durationSeconds" DOUBLE PRECISION,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiPromotionAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiPromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionAsset_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "AiPromotionScene"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionAsset_campaignId_objectKey_key" ON "AiPromotionAsset"("campaignId", "objectKey");
CREATE INDEX "AiPromotionAsset_campaignId_type_createdAt_idx" ON "AiPromotionAsset"("campaignId", "type", "createdAt");

CREATE TABLE "AiPromotionCreditWallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "availableCredits" INTEGER NOT NULL DEFAULT 0,
  "reservedCredits" INTEGER NOT NULL DEFAULT 0,
  "lifetimeGranted" INTEGER NOT NULL DEFAULT 0,
  "lifetimeConsumed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPromotionCreditWallet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionCreditWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionCreditWallet_userId_key" ON "AiPromotionCreditWallet"("userId");

CREATE TABLE "AiPromotionCreditLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "campaignId" TEXT,
  "entryType" "AiPromotionCreditEntryType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiPromotionCreditLedger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionCreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionCreditLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AiPromotionCreditWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionCreditLedger_idempotencyKey_key" ON "AiPromotionCreditLedger"("idempotencyKey");
CREATE INDEX "AiPromotionCreditLedger_userId_createdAt_idx" ON "AiPromotionCreditLedger"("userId", "createdAt");
CREATE INDEX "AiPromotionCreditLedger_walletId_createdAt_idx" ON "AiPromotionCreditLedger"("walletId", "createdAt");
CREATE INDEX "AiPromotionCreditLedger_campaignId_createdAt_idx" ON "AiPromotionCreditLedger"("campaignId", "createdAt");

CREATE TABLE "AiPromotionProviderUsage" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "jobId" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT,
  "operationKey" TEXT NOT NULL,
  "inputSeconds" INTEGER NOT NULL DEFAULT 0,
  "outputSeconds" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostUsd" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "actualCostUsd" DECIMAL(12,6),
  "status" TEXT NOT NULL DEFAULT 'ESTIMATED',
  "providerRequestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiPromotionProviderUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiPromotionProviderUsage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiPromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiPromotionProviderUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AiPromotionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AiPromotionProviderUsage_operationKey_key" ON "AiPromotionProviderUsage"("operationKey");
CREATE INDEX "AiPromotionProviderUsage_campaignId_createdAt_idx" ON "AiPromotionProviderUsage"("campaignId", "createdAt");
CREATE INDEX "AiPromotionProviderUsage_provider_status_createdAt_idx" ON "AiPromotionProviderUsage"("provider", "status", "createdAt");
