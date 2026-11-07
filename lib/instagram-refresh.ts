export const TOKEN_REFRESH_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;
export const TOKEN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export function shouldRefreshInstagramToken(
  tokenExpiresAt: Date | null | undefined,
  tokenCreatedAt: Date,
  now: Date = new Date(),
): boolean {
  if (!tokenExpiresAt) return false;
  const expiresSoon = tokenExpiresAt.getTime() <= now.getTime() + TOKEN_REFRESH_WINDOW_MS;
  const tokenIsOldEnough = now.getTime() - tokenCreatedAt.getTime() >= TOKEN_MIN_AGE_MS;
  return expiresSoon && tokenIsOldEnough;
}
