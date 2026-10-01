import {
  MAX_WEBHOOK_BODY_BYTES,
  processWhatsAppWebhook,
  verifyWebhookChallenge,
} from "@/server/whatsapp/webhook";

const RESPONSE_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
};

export const runtime = "nodejs";

async function readWebhookBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_WEBHOOK_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

export function GET(request: Request) {
  const result = verifyWebhookChallenge(new URL(request.url).searchParams);
  return new Response(result.body, { status: result.status, headers: RESPONSE_HEADERS });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
    return new Response("Webhook payload is too large", { status: 413, headers: RESPONSE_HEADERS });
  }

  let rawBody: string;
  try {
    const body = await readWebhookBody(request);
    if (body === null) {
      return new Response("Webhook payload is too large", { status: 413, headers: RESPONSE_HEADERS });
    }
    rawBody = body;
  } catch {
    return new Response("Could not read webhook payload", { status: 400, headers: RESPONSE_HEADERS });
  }

  const result = processWhatsAppWebhook(rawBody, request.headers.get("x-hub-signature-256"));
  return new Response(result.body, { status: result.status, headers: RESPONSE_HEADERS });
}
