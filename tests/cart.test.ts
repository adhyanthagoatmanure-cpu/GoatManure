import assert from "node:assert/strict";
import test from "node:test";
import { pruneUnavailableCartLines } from "../src/lib/cart";

test("removes unavailable variants while preserving purchasable cart lines", () => {
  const lines = [
    { variantId: "active", quantity: 2 },
    { variantId: "deleted", quantity: 1 },
  ];

  assert.deepEqual(pruneUnavailableCartLines(lines, ["deleted"]), [
    { variantId: "active", quantity: 2 },
  ]);
});

test("keeps cart lines when pricing reports no unavailable variants", () => {
  const lines = [{ variantId: "active", quantity: 1 }];

  assert.equal(pruneUnavailableCartLines(lines, []), lines);
});
