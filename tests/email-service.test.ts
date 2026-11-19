import assert from "node:assert/strict";
import { test } from "node:test";
import { getEmailService, verifyEmailConnection } from "../src/server/email/email-service";

test("Brevo email service submits email through its API and verifies API key", async () => {
  const names = ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME"] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  process.env.BREVO_API_KEY = "unit-test-api-key";
  process.env.BREVO_SENDER_EMAIL = "sender@example.test";
  process.env.BREVO_SENDER_NAME = "Test Sender";

  const requests: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/smtp/email")) {
      return new Response(JSON.stringify({ messageId: "test-message-id" }), { status: 201 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };

  try {
    const result = await getEmailService().send({
      to: "customer@example.test",
      subject: "Reset password",
      html: "<p>Reset link</p>",
      text: "Reset link",
    });
    await verifyEmailConnection();

    assert.deepEqual(result, {
      sent: true,
      messageId: "test-message-id",
      accepted: ["customer@example.test"],
      rejected: [],
    });
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(requests[1].url, "https://api.brevo.com/v3/account");
    assert.equal(new Headers(requests[0].init?.headers).get("api-key"), "unit-test-api-key");
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), {
      sender: { email: "sender@example.test", name: "Test Sender" },
      to: [{ email: "customer@example.test" }],
      subject: "Reset password",
      htmlContent: "<p>Reset link</p>",
      textContent: "Reset link",
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
