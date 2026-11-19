import assert from "node:assert/strict";
import { test } from "node:test";
import { getProductSlugLookupCandidates } from "../src/lib/product-slug";

test("product slug lookups support encoded existing slugs", () => {
  assert.deepEqual(
    getProductSlugLookupCandidates("Goat%20Manure%201Kg"),
    ["Goat%20Manure%201Kg", "Goat Manure 1Kg"]
  );
  assert.deepEqual(getProductSlugLookupCandidates("goat-manure-1kg"), ["goat-manure-1kg"]);
  assert.deepEqual(getProductSlugLookupCandidates("%E0%A4%A"), ["%E0%A4%A"]);
});
