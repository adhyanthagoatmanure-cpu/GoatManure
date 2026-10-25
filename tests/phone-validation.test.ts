import assert from "node:assert/strict";
import { test } from "node:test";
import { indianMobileNumberSchema, normalizeIndianMobileNumber } from "../src/lib/validations/phone";
import { signupSchema } from "../src/lib/validations/auth";
import { addressSchema, checkoutSchema } from "../src/lib/validations/checkout";

test("normalizes an 11-digit Indian mobile number with one leading zero", () => {
  assert.equal(indianMobileNumberSchema.parse("09791486954"), "9791486954");
  assert.equal(normalizeIndianMobileNumber(" 09791486954 "), "9791486954");
});

test("accepts a valid 10-digit mobile number without modification", () => {
  assert.equal(indianMobileNumberSchema.parse("9791486954"), "9791486954");
  assert.equal(indianMobileNumberSchema.parse("9000000000"), "9000000000");
});

test("normalizes Indian country codes and common phone formatting consistently", () => {
  for (const value of [
    "+919791486954",
    "919791486954",
    "+91 97914 86954",
    "+91-97914-86954",
    "(+91) 97914 86954",
    "09791486954",
  ]) {
    assert.equal(indianMobileNumberSchema.parse(value), "9791486954", value);
  }
  assert.equal(indianMobileNumberSchema.safeParse("+14155552671").success, false);
});

test("rejects invalid lengths, non-numeric input, and multiple leading zeroes", () => {
  for (const value of ["979148695", "97914869540", "abcdefghij", "009791486954", "0009791486954"]) {
    assert.equal(indianMobileNumberSchema.safeParse(value).success, false, value);
  }
});

test("normalizes phone values through registration, profile-address, and checkout schemas", () => {
  const signup = signupSchema.parse({
    name: "Test Customer",
    email: "test@example.com",
    phone: "09791486954",
    password: "Password1",
    confirmPassword: "Password1",
    agreeToTerms: true,
  });
  assert.equal(signup.phone, "9791486954");

  const address = addressSchema.parse({
    fullName: "Test Customer",
    phone: " 09791486954 ",
    line1: "123 Garden Road",
    line2: "",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
    country: "India",
  });
  assert.equal(address.phone, "9791486954");

  const checkout = checkoutSchema.parse({
    guestName: "Test Customer",
    guestEmail: "test@example.com",
    guestPhone: "09791486954",
    paymentMethod: "COD",
    items: [{ variantId: "variant-1", quantity: 1 }],
    newAddress: address,
  });
  assert.equal(checkout.guestPhone, "9791486954");
  assert.equal(checkout.newAddress?.phone, "9791486954");
});
