import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_DURATIONS,
  DEFAULT_PROMOTION_PROMPT,
  FORMAT_DIMENSIONS,
  isPromotionFormat,
  isPromotionMode,
  isPromotionScope,
  validatePrompt,
} from "../../lib/ai-promotions/contracts";

test("studio defaults to the requested creative direction", () => {
  assert.equal(DEFAULT_PROMOTION_PROMPT, "Create a stylish, premium promotion that highlights the product clearly and ends with a strong call to action.");
  assert.deepEqual(FORMAT_DIMENSIONS.VERTICAL, { width: 1080, height: 1920 });
  assert.deepEqual(ALLOWED_DURATIONS, [10, 15, 30]);
});

test("output dimensions cover all supported aspect ratios", () => {
  assert.deepEqual(FORMAT_DIMENSIONS.SQUARE, { width: 1080, height: 1080 });
  assert.deepEqual(FORMAT_DIMENSIONS.LANDSCAPE, { width: 1920, height: 1080 });
});

test("scope, mode and format validators reject unknown values", () => {
  assert.equal(isPromotionScope("PRODUCT"), true);
  assert.equal(isPromotionScope("STORE"), true);
  assert.equal(isPromotionScope("ACCOUNT"), false);
  assert.equal(isPromotionMode("HYBRID"), true);
  assert.equal(isPromotionMode("CINEMATIC"), true);
  assert.equal(isPromotionMode("UNLIMITED"), false);
  assert.equal(isPromotionFormat("VERTICAL"), true);
  assert.equal(isPromotionFormat("4K"), false);
});

test("prompt validation trims whitespace and rejects empty or oversized prompts", () => {
  assert.equal(validatePrompt("  premium product ad  "), "premium product ad");
  assert.equal(validatePrompt("   "), null);
  assert.equal(validatePrompt("x".repeat(1601)), null);
  assert.equal(validatePrompt(null), null);
});
