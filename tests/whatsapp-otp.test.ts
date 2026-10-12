import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateWhatsAppOtp,
  hashWhatsAppOtp,
  hashWhatsAppOtpTicket,
  isWhatsAppOtpAttemptAllowed,
  isWhatsAppOtpExpired,
  isWhatsAppOtpHashMatch,
  WHATSAPP_OTP_MAX_ATTEMPTS,
  WHATSAPP_OTP_TTL_MS,
} from "../src/server/auth/whatsapp-otp-core";
import {
  sendWhatsAppOtp,
  WhatsAppOtpDeliveryError,
} from "../src/server/whatsapp/otp-delivery";

test("generates fixed-width cryptographic OTPs and purpose-bound hashes", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generateWhatsAppOtp(), /^\d{6}$/);
  }

  const registrationHash = hashWhatsAppOtp("secret", "id", "REGISTER", "+919791486954", "123456");
  const loginHash = hashWhatsAppOtp("secret", "id", "LOGIN", "+919791486954", "123456");
  assert.equal(isWhatsAppOtpHashMatch(registrationHash, registrationHash), true);
  assert.equal(isWhatsAppOtpHashMatch(registrationHash, loginHash), false);
  assert.notEqual(
    registrationHash,
    hashWhatsAppOtp("secret", "other-id", "REGISTER", "+919791486954", "123456")
  );
  assert.notEqual(
    registrationHash,
    hashWhatsAppOtp("secret", "id", "REGISTER", "+919791486955", "123456")
  );
});

test("expires OTPs after five minutes and enforces the attempt ceiling", () => {
  const issuedAt = new Date("2026-10-11T10:00:00.000Z");
  const expiry = new Date(issuedAt.getTime() + WHATSAPP_OTP_TTL_MS);
  assert.equal(isWhatsAppOtpExpired(expiry, new Date(expiry.getTime() - 1)), false);
  assert.equal(isWhatsAppOtpExpired(expiry, expiry), true);
  assert.equal(isWhatsAppOtpAttemptAllowed(0), true);
  assert.equal(isWhatsAppOtpAttemptAllowed(WHATSAPP_OTP_MAX_ATTEMPTS - 1), true);
  assert.equal(isWhatsAppOtpAttemptAllowed(WHATSAPP_OTP_MAX_ATTEMPTS), false);
  assert.equal(isWhatsAppOtpAttemptAllowed(-1), false);
});

test("hashes one-time authentication tickets without storing their plaintext value", () => {
  const ticketHash = hashWhatsAppOtpTicket("secret", "opaque-ticket");
  assert.match(ticketHash, /^[a-f0-9]{64}$/);
  assert.notEqual(ticketHash, "opaque-ticket");
  assert.notEqual(ticketHash, hashWhatsAppOtpTicket("different-secret", "opaque-ticket"));
});

test("development delivery uses a no-op mock and never calls the network", async () => {
  let calls = 0;
  const result = await sendWhatsAppOtp("+919791486954", "123456", {
    production: false,
    fetcher: async () => {
      calls += 1;
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(result, "mocked");
  assert.equal(calls, 0);
});

test("production delivery requires the approved server-side authentication template", async () => {
  const names = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_OTP_TEMPLATE_LANGUAGE",
    "WHATSAPP_API_VERSION",
  ] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];

  try {
    await assert.rejects(
      sendWhatsAppOtp("+919791486954", "123456", {
        production: true,
        fetcher: async () => new Response(null, { status: 200 }),
      }),
      (error: unknown) =>
        error instanceof WhatsAppOtpDeliveryError &&
        error.category === "not-configured"
    );
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("production delivery sends only the configured authentication template", async () => {
  const values = {
    WHATSAPP_ACCESS_TOKEN: "test-token-not-for-production",
    WHATSAPP_PHONE_NUMBER_ID: "1234567890",
    WHATSAPP_OTP_TEMPLATE_NAME: "approved_auth_code",
    WHATSAPP_OTP_TEMPLATE_LANGUAGE: "en_US",
    WHATSAPP_API_VERSION: "v22.0",
  };
  const previous = new Map(Object.keys(values).map((name) => [name, process.env[name]]));
  Object.assign(process.env, values);

  try {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const result = await sendWhatsAppOtp("+919791486954", "012345", {
      production: true,
      fetcher: async (input, init) => {
        requestUrl = String(input);
        requestInit = init;
        return new Response(JSON.stringify({ messages: [{ id: "mock-message-id" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });
    assert.equal(result, "sent");
    assert.equal(requestUrl, "https://graph.facebook.com/v22.0/1234567890/messages");
    const body = JSON.parse(String(requestInit?.body)) as {
      to: string;
      template: {
        name: string;
        language: { code: string };
        components: { type: string; parameters?: { text: string }[] }[];
      };
    };
    assert.equal(body.to, "919791486954");
    assert.equal(body.template.name, values.WHATSAPP_OTP_TEMPLATE_NAME);
    assert.equal(body.template.language.code, values.WHATSAPP_OTP_TEMPLATE_LANGUAGE);
    assert.deepEqual(
      body.template.components.flatMap((component) => component.parameters ?? []).map(({ text }) => text),
      ["012345", "012345"]
    );
  } finally {
    for (const name of Object.keys(values)) {
      const previousValue = previous.get(name);
      if (previousValue === undefined) delete process.env[name];
      else process.env[name] = previousValue;
    }
  }
});

test("provider failures do not expose provider response content", async () => {
  const names = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_OTP_TEMPLATE_LANGUAGE",
  ] as const;
  const values = {
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "1234567890",
    WHATSAPP_OTP_TEMPLATE_NAME: "approved_auth_code",
    WHATSAPP_OTP_TEMPLATE_LANGUAGE: "en",
  };
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, values);

  try {
    await assert.rejects(
      sendWhatsAppOtp("+919791486954", "123456", {
        production: true,
        fetcher: async () => new Response("sensitive provider response", { status: 500 }),
      }),
      (error: unknown) =>
        error instanceof WhatsAppOtpDeliveryError &&
        error.category === "provider-failure" &&
        !error.message.includes("sensitive")
    );
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
