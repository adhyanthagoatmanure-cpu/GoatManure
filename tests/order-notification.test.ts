import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getOrderWhatsAppNotificationClaim,
  isOrderReadyForPurchaseNotification,
} from "../src/server/services/order-notification-core";
import { sendCustomerOrderWhatsApp } from "../src/server/whatsapp/whatsapp-service";

test("purchase WhatsApp notifications require a confirmed COD or paid online order", () => {
  assert.equal(isOrderReadyForPurchaseNotification({
    paymentMethod: "COD",
    paymentStatus: "COD_PENDING",
    orderStatus: "CONFIRMED",
  }), true);
  assert.equal(isOrderReadyForPurchaseNotification({
    paymentMethod: "COD",
    paymentStatus: "COD_COLLECTED",
    orderStatus: "CONFIRMED",
  }), true);
  assert.equal(isOrderReadyForPurchaseNotification({
    paymentMethod: "ONLINE",
    paymentStatus: "PAID",
    orderStatus: "CONFIRMED",
  }), true);
  assert.equal(isOrderReadyForPurchaseNotification({
    paymentMethod: "ONLINE",
    paymentStatus: "PENDING",
    orderStatus: "NEW",
  }), false);
  assert.equal(isOrderReadyForPurchaseNotification({
    paymentMethod: "ONLINE",
    paymentStatus: "PAID",
    orderStatus: "NEW",
  }), false);
});

test("each order recipient gets an atomic single-attempt notification claim", () => {
  const now = new Date("2026-10-24T10:00:00.000Z");
  const customerClaim = getOrderWhatsAppNotificationClaim("customer", "ONLINE", now);
  const adminClaim = getOrderWhatsAppNotificationClaim("admin", "ONLINE", now);
  assert.equal(customerClaim.where.orderStatus, "CONFIRMED");
  assert.equal(customerClaim.where.paymentMethod, "ONLINE");
  assert.equal(customerClaim.where.paymentStatus, "PAID");
  assert.equal(customerClaim.where.customerWhatsAppNotificationAttemptedAt, null);
  assert.deepEqual(customerClaim.data, { customerWhatsAppNotificationAttemptedAt: now });
  assert.equal(adminClaim.where.adminWhatsAppNotificationAttemptedAt, null);
  assert.deepEqual(adminClaim.data, { adminWhatsAppNotificationAttemptedAt: now });

  const codClaim = getOrderWhatsAppNotificationClaim("customer", "COD", now);
  assert.deepEqual(codClaim.where.paymentStatus, { in: ["COD_PENDING", "COD_COLLECTED"] });
});

test("customer order WhatsApp uses a mocked Meta API and accurate order details", async () => {
  const envNames = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_API_VERSION"] as const;
  const previous = new Map(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  process.env.WHATSAPP_ACCESS_TOKEN = "unit-test-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "1234567890";
  process.env.WHATSAPP_API_VERSION = "v22.0";

  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(JSON.stringify({ messages: [{ id: "mock-order-message-id" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await sendCustomerOrderWhatsApp({
      customerPhone: "+919791486954",
      customerName: "Test Customer",
      orderNumber: "ADY-123",
      totalAmount: 1299,
      items: [{ productName: "Organic Goat Manure", weightLabel: "5 kg", quantity: 2 }],
    });

    assert.equal(result.messageId, "mock-order-message-id");
    assert.equal(requestUrl, "https://graph.facebook.com/v22.0/1234567890/messages");
    const body = JSON.parse(String(requestInit?.body)) as {
      messaging_product: string;
      to: string;
      template: {
        name: string;
        language: { code: string };
        components: { parameters: { text: string }[] }[];
      };
    };
    assert.equal(body.messaging_product, "whatsapp");
    assert.equal(body.to, "919791486954");
    assert.equal(body.template.name, "order_confirmation");
    assert.equal(body.template.language.code, "en");
    assert.deepEqual(
      body.template.components[0].parameters.map(({ text }) => text),
      ["Test Customer", "ADY-123", "Organic Goat Manure (5 kg) x2", "2 total units", "1,299"]
    );
    assert.equal(JSON.stringify(body).includes("unit-test-token"), false);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
