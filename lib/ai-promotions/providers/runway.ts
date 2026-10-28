
const RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

export class RunwayTaskError extends Error {
  constructor(message: string, readonly code: string, readonly retryable: boolean) {
    super(message);
    this.name = "RunwayTaskError";
  }
}

function apiKey() {
  const key = process.env.RUNWAYML_API_SECRET;
  if (!key) throw new RunwayTaskError("Runway provider is not configured.", "PROVIDER_NOT_CONFIGURED", false);
  return key;
}

async function runwayRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${RUNWAY_BASE_URL}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "X-Runway-Version": RUNWAY_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let payload: Record<string, unknown> = {};
  try { payload = text ? JSON.parse(text) as Record<string, unknown> : {}; } catch { /* provider error bodies may not be JSON */ }
  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new RunwayTaskError(
      typeof payload.error === "string" ? payload.error : `Runway request failed (${response.status}).`,
      response.status === 429 ? "PROVIDER_RATE_LIMITED" : response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED",
      retryable,
    );
  }
  return payload;
}

export async function submitRunwayImageToVideo(input: {
  imageUrl: string;
  prompt: string;
  durationSeconds: number;
  width: number;
  height: number;
  idempotencyKey: string;
}) {
  const model = process.env.RUNWAY_MODEL || "wan3";
  const ratio = input.width === input.height ? "1440:1440" :
    input.width > input.height ? "1920:1080" : "1080:1920";
  const task = await runwayRequest("/image_to_video", {
    method: "POST",
    headers: { "X-Runway-Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      model,
      promptImage: input.imageUrl,
      promptText: input.prompt.slice(0, 1800),
      ratio,
      duration: input.durationSeconds,
      audio: false,
    }),
  });
  if (typeof task.id !== "string") throw new RunwayTaskError("Runway did not return a task ID.", "PROVIDER_INVALID_RESPONSE", true);
  return { id: task.id, model };
}

export async function getRunwayTask(taskId: string) {
  return runwayRequest(`/tasks/${encodeURIComponent(taskId)}`, { method: "GET", headers: {} });
}

export async function waitForRunwayOutput(
  taskId: string,
  onPending: (taskId: string) => Promise<void>,
  maxWaitMs = 18 * 60 * 1000,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const task = await getRunwayTask(taskId);
    const status = typeof task.status === "string" ? task.status.toUpperCase() : "";
    if (status === "SUCCEEDED") {
      const output = task.output;
      const first = Array.isArray(output) ? output[0] : typeof output === "string" ? output : null;
      if (typeof first !== "string" || !first.startsWith("https://")) {
        throw new RunwayTaskError("Runway completed without a valid output URL.", "PROVIDER_INVALID_OUTPUT", false);
      }
      return { outputUrl: first, task };
    }
    if (status === "FAILED" || status === "CANCELLED" || status === "THROTTLED") {
      throw new RunwayTaskError("Runway could not complete this video generation.", "PROVIDER_GENERATION_FAILED", false);
    }
    await onPending(taskId);
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  throw new RunwayTaskError("Runway generation is still processing; the worker will resume polling.", "PROVIDER_PENDING", true);
}
