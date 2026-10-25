import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateWhatsAppOtp,
  findEligibleWhatsAppOtpLoginUser,
  hashWhatsAppOtp,
  hashWhatsAppOtpTicket,
  isWhatsAppOtpAttemptAllowed,
  isWhatsAppOtpChallengeReusable,
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

test("reuses a live, unconsumed OTP challenge even when a resend is rate-limited", () => {
  const now = new Date("2026-10-24T12:00:00.000Z");
  const challenge = {
    codeHash: "a".repeat(64),
    attempts: 0,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    resendAfter: new Date(now.getTime() - 60 * 1000),
    verifiedAt: null,
    consumedAt: null,
  };

  assert.equal(isWhatsAppOtpChallengeReusable(challenge, now), true);
  assert.equal(
    isWhatsAppOtpChallengeReusable({ ...challenge, codeHash: null }, now),
    false
  );
  assert.equal(
    isWhatsAppOtpChallengeReusable({
      ...challenge,
      expiresAt: new Date(now.getTime()),
    }, now),
    false
  );
  assert.equal(
    isWhatsAppOtpChallengeReusable({ ...challenge, attempts: WHATSAPP_OTP_MAX_ATTEMPTS }, now),
    false
  );
  assert.equal(
    isWhatsAppOtpChallengeReusable({
      ...challenge,
      verifiedAt: new Date(now.getTime()),
    }, now),
    false
  );
});

test("hashes one-time authentication tickets without storing their plaintext value", () => {
  const ticketHash = hashWhatsAppOtpTicket("secret", "opaque-ticket");
  assert.match(ticketHash, /^[a-f0-9]{64}$/);
  assert.notEqual(ticketHash, "opaque-ticket");
  assert.notEqual(ticketHash, hashWhatsAppOtpTicket("different-secret", "opaque-ticket"));
});

test("recognizes a registered account by normalized verified phone or legacy phone", async () => {
  const expectedUser = { id: "customer-1", status: "ACTIVE", role: "CUSTOMER" };
  const verifiedQueries: string[] = [];
  const lookup = {
    async findVerifiedPhone(phone: string) {
      verifiedQueries.push(phone);
      return phone === "+919791486954" ? expectedUser : null;
    },
    async findLegacyUsers() {
      return [];
    },
  };

  assert.deepEqual(
    await findEligibleWhatsAppOtpLoginUser("+91 97914-86954", lookup),
    expectedUser
  );
  assert.deepEqual(verifiedQueries, ["+919791486954"]);

  const legacyCandidates: string[][] = [];
  const legacyLookup = {
    async findVerifiedPhone() {
      return null;
    },
    async findLegacyUsers(candidates: string[]) {
      legacyCandidates.push(candidates);
      return candidates.includes("9791486954")
        ? [{ id: "legacy-customer", status: "ACTIVE", role: "CUSTOMER" }]
        : [];
    },
  };
  assert.equal(
    (await findEligibleWhatsAppOtpLoginUser("919791486954", legacyLookup))?.id,
    "legacy-customer"
  );
  assert.deepEqual(legacyCandidates, [[
    "9791486954",
    "09791486954",
    "+919791486954",
    "919791486954",
  ]]);
});

test("does not match an unregistered, ambiguous, inactive, or non-customer phone", async () => {
  const noMatches = {
    async findVerifiedPhone() {
      return null;
    },
    async findLegacyUsers() {
      return [];
    },
  };
  assert.equal(await findEligibleWhatsAppOtpLoginUser("9791486954", noMatches), null);

  const legacyLookup = (users: { id: string; status: string; role: string }[]) => ({
    async findVerifiedPhone() {
      return null;
    },
    async findLegacyUsers() {
      return users;
    },
  });
  assert.equal(
    await findEligibleWhatsAppOtpLoginUser(
      "9791486954",
      legacyLookup([{ id: "inactive", status: "SUSPENDED", role: "CUSTOMER" }])
    ),
    null
  );
  assert.equal(
    await findEligibleWhatsAppOtpLoginUser(
      "9791486954",
      legacyLookup([{ id: "admin", status: "ACTIVE", role: "ADMIN" }])
    ),
    null
  );
  assert.equal(
    await findEligibleWhatsAppOtpLoginUser(
      "9791486954",
      legacyLookup([
        { id: "customer-1", status: "ACTIVE", role: "CUSTOMER" },
        { id: "customer-2", status: "ACTIVE", role: "CUSTOMER" },
      ])
    ),
    null
  );
});

test("development delivery uses a no-op mock and never calls the network", async () => {
  const names = ["NODE_ENV", "WHATSAPP_OTP_REAL_DELIVERY"] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  Reflect.set(process.env, "NODE_ENV", "development");
  delete process.env.WHATSAPP_OTP_REAL_DELIVERY;
  try {
    let calls = 0;
    const result = await sendWhatsAppOtp("+919791486954", "123456", {
      fetcher: async () => {
        calls += 1;
        return new Response(null, { status: 200 });
      },
    });
    assert.equal(result, "mocked");
    assert.equal(calls, 0);
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else Reflect.set(process.env, name, value);
    }
  }
});

test("local real delivery requires an explicit opt-in and uses the configured provider", async () => {
  const names = [
    "NODE_ENV",
    "WHATSAPP_OTP_REAL_DELIVERY",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_OTP_TEMPLATE_NAME",
    "WHATSAPP_OTP_TEMPLATE_LANGUAGE",
  ] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const values: Record<string, string> = {
    NODE_ENV: "development",
    WHATSAPP_OTP_REAL_DELIVERY: "true",
    WHATSAPP_ACCESS_TOKEN: "test-token",
    WHATSAPP_PHONE_NUMBER_ID: "1234567890",
    WHATSAPP_OTP_TEMPLATE_NAME: "approved_auth_code",
    WHATSAPP_OTP_TEMPLATE_LANGUAGE: "en_US",
  };
  for (const [name, value] of Object.entries(values)) Reflect.set(process.env, name, value);

  try {
    let calls = 0;
    const result = await sendWhatsAppOtp("+919791486954", "012345", {
      fetcher: async () => {
        calls += 1;
        return new Response(JSON.stringify({ messages: [{ id: "mock-message-id" }] }), {
          status: 200,
        });
      },
    });
    assert.equal(result, "sent");
    assert.equal(calls, 1);
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else Reflect.set(process.env, name, value);
    }
  }
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
      else Reflect.set(process.env, name, value);
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
        fetcher: async () => new Response(JSON.stringify({
          error: { message: "sensitive provider response", code: 190 },
        }), { status: 500 }),
      }),
      (error: unknown) =>
        error instanceof WhatsAppOtpDeliveryError &&
        error.category === "provider-failure" &&
        !error.message.includes("sensitive") &&
        error.httpStatus === 500 &&
        error.providerCode === 190
    );
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
