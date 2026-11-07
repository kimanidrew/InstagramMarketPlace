import test from "node:test";
import assert from "node:assert/strict";
import { parseCaptionPrice } from "../lib/price-parser";

test("parses supported KES price markers and shorthand", () => {
  assert.deepEqual(parseCaptionPrice("Dress Ksh 2,500"), { amount: 2500, currency: "KES" });
  assert.deepEqual(parseCaptionPrice("Price: 2.5k"), { amount: 2500, currency: "KES" });
  assert.deepEqual(parseCaptionPrice("Bei: 1,200/="), { amount: 1200, currency: "KES" });
  assert.deepEqual(parseCaptionPrice("Dress 1,200/="), { amount: 1200, currency: "KES" });
  assert.deepEqual(parseCaptionPrice("Only @ 950"), { amount: 950, currency: "KES" });
});

test("uses the lowest value in a marked price range", () => {
  assert.deepEqual(parseCaptionPrice("Ksh 1,200 - 1,500"), { amount: 1200, currency: "KES" });
});

test("recognizes dollar prices and ignores phone numbers and years", () => {
  assert.deepEqual(parseCaptionPrice("Sale $25"), { amount: 25, currency: "USD" });
  assert.equal(parseCaptionPrice("Call 0712345678, established 2024"), null);
  assert.equal(parseCaptionPrice("New collection 2025"), null);
  assert.equal(parseCaptionPrice("Size 42, item 3"), null);
});
