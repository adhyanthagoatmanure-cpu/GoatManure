import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  canRetryPayUPayment,
  createPayUCheckout,
  createPayUCheckoutForIntent,
  getPayUCallbackAction,
  getPayUResponseOutcome,
  verifyPayUResponseHash,
  type PayUConfig,
} from "../src/server/payment/payu-provider";

const config: PayUConfig = {
  key: "merchant-key",
  salt: "server-side-test-salt",
  actionUrl: "https://test.payu.in/_payment",
  callbackUrl: "https://shop.example/api/payment/payu/callback",
};

function responseHash(response: Record<string, string>) {
  const hashInput = [
    ...(Object.hasOwn(response, "additionalCharges") ? [response.additionalCharges] : []),
    config.salt,
    response.status ?? "",
    "",
    "",
    "",
    "",
    "",
    response.udf5 ?? "",
    response.udf4 ?? "",
    response.udf3 ?? "",
    response.udf2 ?? "",
    response.udf1 ?? "",
    response.email ?? "",
    response.firstname ?? "",
    response.productinfo ?? "",
    response.amount ?? "",
    response.txnid ?? "",
    response.key ?? "",
  ].join("|");
  return createHash("sha512").update(hashInput).digest("hex");
}

test("PayU success and failure responses are accepted only with a valid reverse hash", () => {
  const validResponse = {
    key: config.key,
    txnid: "intent-attempt-1",
    amount: "1250.00",
    productinfo: "ADHYANTHA payment intent-1",
    firstname: "Customer",
    email: "customer@example.com",
    status: "success",
    mihpayid: "gateway-payment-1",
  };
  const signedSuccess = { ...validResponse, hash: responseHash(validResponse) };
  assert.equal(verifyPayUResponseHash(config, signedSuccess), true);

  const signedFailureData = { ...validResponse, status: "failure" };
  const signedFailure = { ...signedFailureData, hash: responseHash(signedFailureData) };
  assert.equal(verifyPayUResponseHash(config, signedFailure), true);
  assert.equal(verifyPayUResponseHash(config, { ...signedSuccess, amount: "1251.00" }), false);
  assert.equal(verifyPayUResponseHash(config, { ...signedSuccess, hash: "not-a-hash" }), false);
});

test("PayU success, failure, cancellation, pending, and unknown outcomes are classified safely", () => {
  assert.equal(getPayUResponseOutcome("SUCCESS"), "success");
  assert.equal(getPayUResponseOutcome("failure"), "failed");
  assert.equal(getPayUResponseOutcome("cancelled"), "failed");
  assert.equal(getPayUResponseOutcome("canceled"), "failed");
  assert.equal(getPayUResponseOutcome("pending"), "pending");
  assert.equal(getPayUResponseOutcome("unexpected"), "unknown");

  assert.equal(getPayUCallbackAction("PENDING", "success"), "confirm");
  assert.equal(getPayUCallbackAction("PENDING", "failed"), "fail");
  assert.equal(getPayUCallbackAction("PAID", "success"), "paid");
  assert.equal(getPayUCallbackAction("PROCESSING", "success"), "processing");
  assert.equal(getPayUCallbackAction("PENDING", "unknown"), "status");
});

test("retry reuses the payment intent identity but issues a fresh PayU transaction ID", () => {
  const intent = {
    id: "existing-intent",
    amount: 1250,
    guestName: "Customer",
    guestEmail: "customer@example.com",
    guestPhone: "9791486954",
  };
  const firstAttempt = createPayUCheckoutForIntent(config, intent, "attempt-1");
  const retry = createPayUCheckoutForIntent(config, intent, "attempt-2");

  assert.equal(firstAttempt.fields.txnid, "attempt-1");
  assert.equal(retry.fields.txnid, "attempt-2");
  assert.equal(firstAttempt.fields.productinfo, retry.fields.productinfo);
  assert.match(firstAttempt.fields.productinfo, /existing-intent/);
});

test("only unexpired failed payment intents are retryable", () => {
  const now = new Date("2026-10-11T10:00:00.000Z");
  assert.equal(canRetryPayUPayment("FAILED", new Date(now.getTime() + 1000), now), true);
  assert.equal(canRetryPayUPayment("FAILED", new Date(now.getTime() - 1000), now), false);
  assert.equal(canRetryPayUPayment("PENDING", new Date(now.getTime() + 1000), now), false);
  assert.equal(canRetryPayUPayment("PAID", new Date(now.getTime() + 1000), now), false);
});

test("checkout sends both PayU outcomes back to the application callback", () => {
  const checkout = createPayUCheckout(config, {
    transactionId: "attempt-1",
    amountInRupees: 1250,
    productInfo: "ADHYANTHA payment intent-1",
    firstName: "Customer",
    email: "customer@example.com",
    phone: "9791486954",
  });

  assert.equal(checkout.fields.surl, config.callbackUrl);
  assert.equal(checkout.fields.furl, config.callbackUrl);
  assert.equal(checkout.fields.hash.length, 128);
});
