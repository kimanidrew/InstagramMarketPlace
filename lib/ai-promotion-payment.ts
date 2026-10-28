import "server-only";
import { db } from "@/lib/prisma";
import { getPromotionVideoStatus, getPromotionVideoResult, submitPromotionVideo } from "@/lib/ai-promotion-provider";

type CallbackMetadata = { Item?: Array<{ Name?: string; Value?: string | number }> };
const itemValue = (items: CallbackMetadata["Item"], name: string) => items?.find((item) => item.Name === name)?.Value;

export async function processMpesaCallback(payload: any) {
  const callback = payload?.Body?.stkCallback;
  const checkoutRequestId = typeof callback?.CheckoutRequestID === "string" ? callback.CheckoutRequestID : "";
  if (!checkoutRequestId) return { accepted: false, reason: "Missing checkout request ID." };
  const p = db();
  const payment = await p.aiPromotionPayment.findUnique({ where: { checkoutRequestId } });
  if (!payment) return { accepted: false, reason: "Unknown checkout request ID." };
  if (payment.merchantRequestId && callback.MerchantRequestID && String(callback.MerchantRequestID) !== payment.merchantRequestId) return { accepted: false, reason: "Merchant request ID mismatch." };
  if (payment.status === "PAID" || payment.status === "REFUND_PENDING" || payment.status === "REFUNDED") return { accepted: true, duplicate: true };
  const resultCode = String(callback.ResultCode ?? "");
  const resultDescription = String(callback.ResultDesc || "M-Pesa payment did not complete.").slice(0, 350);
  if (resultCode !== "0") {
    await p.aiPromotionPayment.updateMany({ where: { id: payment.id, status: { in: ["INITIATED", "PENDING"] } }, data: { status: "FAILED", resultCode, resultDescription } });
    await p.aiPromotionProject.updateMany({ where: { id: payment.projectId, status: "PENDING_PAYMENT" }, data: { status: "FAILED", errorCode: "PAYMENT_FAILED", errorMessage: resultDescription } });
    return { accepted: true, paid: false };
  }

  const metadata = callback.CallbackMetadata as CallbackMetadata | undefined;
  const amount = Number(itemValue(metadata?.Item, "Amount"));
  const receipt = String(itemValue(metadata?.Item, "MpesaReceiptNumber") || "");
  const phone = String(itemValue(metadata?.Item, "PhoneNumber") || "");
  if (!Number.isFinite(amount) || amount !== payment.amountKes || phone !== payment.phoneNumber || !receipt) {
    console.error("Rejected M-Pesa callback: transaction metadata mismatch", { paymentId: payment.id, checkoutRequestId });
    return { accepted: false, reason: "Payment confirmation metadata did not match the expected transaction." };
  }

  const paid = await p.aiPromotionPayment.updateMany({
    where: { id: payment.id, checkoutRequestId, status: { in: ["INITIATED", "PENDING"] } },
    data: { status: "PAID", resultCode, resultDescription, receiptNumber: receipt, paidAt: new Date() },
  });
  if (!paid.count) return { accepted: true, duplicate: true };

  const project = await p.aiPromotionProject.findUnique({
    where: { id: payment.projectId },
    include: { connection: { select: { id: true, username: true, profileImageUrl: true } }, post: { select: { productTitle: true, mediaUrl: true, thumbnailUrl: true, mediaType: true } } },
  });
  if (!project) {
    await p.aiPromotionPayment.update({ where: { id: payment.id }, data: { status: "REFUND_PENDING", resultDescription: "Payment received but project was not found; refund review required." } });
    return { accepted: true, paid: true, generationStarted: false };
  }

  const claimed = await p.aiPromotionProject.updateMany({
    where: { id: project.id, status: "PENDING_PAYMENT", providerJobId: null },
    data: { status: "QUEUED", errorCode: null, errorMessage: null },
  });
  if (!claimed.count) return { accepted: true, paid: true, duplicate: true };

  try {
    let imageUrl = project.scope === "PRODUCT" ? project.post?.thumbnailUrl || (project.post?.mediaType === "IMAGE" ? project.post.mediaUrl : null) : project.connection.profileImageUrl;
    if (project.scope === "STORE" && !imageUrl) {
      const featured = await p.instagramPost.findFirst({ where: { connectionId: project.connectionId, isProduct: true, OR: [{ thumbnailUrl: { not: null } }, { mediaType: "IMAGE", mediaUrl: { not: null } }] }, orderBy: { timestamp: "desc" }, select: { thumbnailUrl: true, mediaUrl: true, mediaType: true } });
      imageUrl = featured?.thumbnailUrl || (featured?.mediaType === "IMAGE" ? featured.mediaUrl : null);
    }
    if (!imageUrl) throw new Error("No public HTTPS source image is available for this paid project.");
    const submitted = await submitPromotionVideo({
      imageUrl, prompt: project.prompt, durationSeconds: project.durationSeconds, title: project.title,
      shopUsername: project.connection.username, productTitle: project.post?.productTitle, generateAudio: project.generateAudio,
    });
    await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "PROCESSING", provider: submitted.provider, providerJobId: submitted.requestId } });
    await p.aiPromotionJob.create({ data: { projectId: project.id, status: "PROCESSING", attempts: 1, maxAttempts: 3, workerId: submitted.provider } });
    return { accepted: true, paid: true, generationStarted: true, projectId: project.id };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 350) : "Video generation could not be started.";
    await p.aiPromotionProject.update({ where: { id: project.id }, data: { status: "FAILED", errorCode: "SUBMIT_FAILED", errorMessage: message } });
    await p.aiPromotionJob.create({ data: { projectId: project.id, status: "FAILED", attempts: 1, maxAttempts: 3, lastError: message } });
    await p.aiPromotionPayment.update({ where: { id: payment.id }, data: { status: "REFUND_PENDING", resultDescription: ("Payment succeeded but generation could not start. " + message).slice(0, 350) } });
    return { accepted: true, paid: true, generationStarted: false, refundReviewRequired: true };
  }
}

export async function refreshPaidPromotion(projectId: string) {
  const p = db();
  const project = await p.aiPromotionProject.findUnique({ where: { id: projectId }, include: { assets: { where: { type: "VIDEO" }, take: 1 } } });
  if (!project || project.status !== "PROCESSING" || !project.providerJobId || project.assets.length) return;
  try {
    const status = await getPromotionVideoStatus(project.providerJobId);
    const state = String(status.status || "").toUpperCase();
    if (state === "COMPLETED" || state === "SUCCEEDED") {
      const result = await getPromotionVideoResult(project.providerJobId);
      const video = result.video as { url?: string; content_type?: string; file_size?: number; file_name?: string } | undefined;
      if (!video?.url || !video.url.startsWith("https://")) throw new Error("The video provider completed without a valid HTTPS video URL.");
      await p.aiPromotionAsset.create({ data: { projectId, type: "VIDEO", storageKey: video.url, contentType: video.content_type || "video/mp4", durationMs: project.durationSeconds * 1000, byteSize: Number.isInteger(video.file_size) ? BigInt(video.file_size!) : undefined, metadata: { provider: "fal.ai", fileName: video.file_name || null, urlExpires: "Provider-hosted URL; durable storage is not configured." } } });
      await p.aiPromotionProject.updateMany({ where: { id: projectId, status: "PROCESSING" }, data: { status: "READY", completedAt: new Date(), errorCode: null, errorMessage: null } });
      await p.aiPromotionJob.updateMany({ where: { projectId }, data: { status: "SUCCEEDED", lockedAt: null, workerId: null, lastError: null } });
    } else if (state === "FAILED" || state === "ERROR") {
      const message = "The AI video provider could not generate this paid video. Refund review is required.";
      await p.aiPromotionProject.updateMany({ where: { id: projectId, status: "PROCESSING" }, data: { status: "FAILED", errorCode: "PROVIDER_FAILED", errorMessage: message } });
      await p.aiPromotionJob.updateMany({ where: { projectId }, data: { status: "FAILED", lockedAt: null, workerId: null, lastError: message } });
      await p.aiPromotionPayment.updateMany({ where: { projectId, status: "PAID" }, data: { status: "REFUND_PENDING", resultDescription: message } });
    }
  } catch (error) {
    console.error("Paid promotion status check failed", projectId, error);
  }
}
