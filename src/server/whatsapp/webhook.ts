import { createHmac, timingSafeEqual } from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type WhatsAppWebhookEvent =
  | {
      type: "message";
      deduplicationKey: string | null;
      messageId: string | null;
      messageType: string | null;
      timestamp: string | null;
      senderId: string | null;
      textBody: string | null;
    }
  | {
      type: "status";
      deduplicationKey: string | null;
      messageId: string | null;
      recipientId: string | null;
      status: string | null;
      timestamp: string | null;
      errors: { code: string | null; title: string | null }[];
    };

export interface WebhookResult {
  status: number;
  body: string;
}

export const MAX_WEBHOOK_BODY_BYTES = 1_000_000;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function constantTimeStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyWebhookChallenge(searchParams: URLSearchParams): WebhookResult {
  const configuredToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!configuredToken) return { status: 500, body: "Webhook verification is not configured" };

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode !== "subscribe" ||
    !token ||
    !challenge ||
    challenge.length > 1024 ||
    !constantTimeStringEquals(token, configuredToken)
  ) {
    return { status: 403, body: "Forbidden" };
  }

  return { status: 200, body: challenge };
}

export function hasValidWebhookSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !appSecret) return false;
  const match = /^sha256=([a-f\d]{64})$/i.exec(signature);
  if (!match) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const actual = Buffer.from(match[1], "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function extractWhatsAppEvents(payload: unknown): WhatsAppWebhookEvent[] | null {
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
    return null;
  }

  const events: WhatsAppWebhookEvent[] = [];
  for (const entry of payload.entry) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      if (!isRecord(change) || !isRecord(change.value)) continue;
      const value = change.value;

      if (Array.isArray(value.messages)) {
        for (const message of value.messages) {
          if (!isRecord(message)) continue;
          const text = isRecord(message.text) ? optionalString(message.text.body) : null;
          const messageId = optionalString(message.id);
          events.push({
            type: "message",
            deduplicationKey: messageId ? `message:${messageId}` : null,
            messageId,
            messageType: optionalString(message.type),
            timestamp: optionalString(message.timestamp),
            senderId: optionalId(message.from),
            textBody: text,
          });
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          if (!isRecord(status)) continue;
          const errors = Array.isArray(status.errors)
            ? status.errors
                .filter(isRecord)
                .map((error) => ({
                  code: optionalId(error.code),
                  title: optionalString(error.title),
                }))
            : [];
          const messageId = optionalString(status.id);
          const statusValue = optionalString(status.status);
          const timestamp = optionalString(status.timestamp);
          events.push({
            type: "status",
            deduplicationKey:
              messageId && statusValue && timestamp
                ? `status:${messageId}:${statusValue}:${timestamp}`
                : null,
            messageId,
            recipientId: optionalId(status.recipient_id),
            status: statusValue,
            timestamp,
            errors,
          });
        }
      }
    }
  }

  return events;
}

function logSafe(value: string | null, maxLength = 128): string {
  if (!value) return "unknown";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, maxLength) || "unknown";
}

function maskId(value: string | null): string {
  if (!value) return "unknown";
  const safeValue = logSafe(value);
  return safeValue === "unknown" ? safeValue : `***${safeValue.slice(-4)}`;
}

export function processWhatsAppWebhook(rawBody: string, signature: string | null): WebhookResult {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
    return { status: 413, body: "Webhook payload is too large" };
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return { status: 503, body: "Webhook signature verification is not configured" };
  if (!hasValidWebhookSignature(rawBody, signature, appSecret)) {
    console.warn("[WHATSAPP_WEBHOOK] rejected reason=invalid-signature");
    return { status: 401, body: "Invalid webhook signature" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: "Invalid JSON payload" };
  }

  const events = extractWhatsAppEvents(payload);
  if (!events) {
    return { status: 400, body: "Invalid WhatsApp webhook payload" };
  }

  const messageCount = events.filter((event) => event.type === "message").length;
  const statusCount = events.length - messageCount;
  console.info(
    `[WHATSAPP_WEBHOOK] accepted messages=${messageCount} statuses=${statusCount}`
  );

  for (const event of events) {
    if (event.type === "message") {
      console.info(
        `[WHATSAPP_WEBHOOK] message id=${logSafe(event.messageId)} type=${logSafe(event.messageType)} timestamp=${logSafe(event.timestamp)} sender=${maskId(event.senderId)}`
      );
    } else {
      const errorCodes = event.errors.map((error) => logSafe(error.code, 32)).join(",") || "none";
      console.info(
        `[WHATSAPP_WEBHOOK] status id=${logSafe(event.messageId)} status=${logSafe(event.status, 32)} timestamp=${logSafe(event.timestamp)} recipient=${maskId(event.recipientId)} errorCodes=${errorCodes}`
      );
    }
  }

  return { status: 200, body: "EVENT_RECEIVED" };
}
