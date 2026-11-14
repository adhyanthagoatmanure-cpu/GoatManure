import assert from "node:assert/strict";
import test from "node:test";
import { calculateShippingFee } from "../src/lib/config";
import { addressSchema } from "../src/lib/validations/checkout";

test("charges Tamil Nadu delivery fee below the free-delivery threshold", () => {
  assert.equal(calculateShippingFee(498, { state: "Tamil Nadu", country: "India" }), 30);
});

test("waives Tamil Nadu delivery fee at exactly ₹499", () => {
  assert.equal(calculateShippingFee(499, { state: "tamil nadu", country: "india" }), 0);
});

test("charges ₹70 for other Indian states regardless of order value", () => {
  assert.equal(calculateShippingFee(100, { state: "Kerala", country: "India" }), 70);
  assert.equal(calculateShippingFee(1000, { state: "Kerala", country: "India" }), 70);
});

test("charges ₹400 for international delivery regardless of order value", () => {
  assert.equal(calculateShippingFee(100, { state: "California", country: "United States" }), 400);
  assert.equal(calculateShippingFee(1000, { state: "California", country: "United States" }), 400);
});

test("uses a non-Tamil Nadu Indian estimate before a destination is selected", () => {
  assert.equal(calculateShippingFee(499), 70);
});

test("does not charge shipping for an empty cart", () => {
  assert.equal(calculateShippingFee(0, { state: "Tamil Nadu", country: "India" }), 0);
});

test("accepts an international delivery address without a postal code", () => {
  const result = addressSchema.safeParse({
    fullName: "Alex Smith",
    phone: "+1 415 555 0134",
    line1: "123 Market Street",
    line2: "",
    city: "San Francisco",
    state: "California",
    pincode: "",
    country: "United States",
  });

  assert.equal(result.success, true);
});

test("keeps Indian delivery address PIN validation", () => {
  const result = addressSchema.safeParse({
    fullName: "Test Customer",
    phone: "9876543210",
    line1: "12 Sample Street",
    line2: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "12345",
    country: "India",
  });

  assert.equal(result.success, false);
});
