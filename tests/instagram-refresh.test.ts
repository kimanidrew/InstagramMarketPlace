import test from "node:test";
import assert from "node:assert/strict";
import { shouldRefreshInstagramToken, TOKEN_MIN_AGE_MS, TOKEN_REFRESH_WINDOW_MS } from "../lib/instagram-refresh";

const now = new Date("2026-11-08T00:00:00.000Z");

test("refreshes tokens expiring within ten days once they are at least 24 hours old", () => {
  assert.equal(shouldRefreshInstagramToken(new Date(now.getTime() + TOKEN_REFRESH_WINDOW_MS), new Date(now.getTime() - TOKEN_MIN_AGE_MS), now), true);
});

test("still attempts refresh for an expired token once it is old enough", () => {
  assert.equal(shouldRefreshInstagramToken(new Date(now.getTime() - 1000), new Date(now.getTime() - 2 * TOKEN_MIN_AGE_MS), now), true);
});

test("does not refresh tokens younger than 24 hours or expiring later", () => {
  assert.equal(shouldRefreshInstagramToken(new Date(now.getTime() + 2 * 86400000), new Date(now.getTime() - TOKEN_MIN_AGE_MS + 1), now), false);
  assert.equal(shouldRefreshInstagramToken(new Date(now.getTime() + TOKEN_REFRESH_WINDOW_MS + 1), new Date(now.getTime() - 2 * TOKEN_MIN_AGE_MS), now), false);
  assert.equal(shouldRefreshInstagramToken(null, new Date(now.getTime() - 2 * TOKEN_MIN_AGE_MS), now), false);
});
