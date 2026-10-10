import { createHash, timingSafeEqual } from "node:crypto";

const PAYU_TEST_URL = "https://test.payu.in/_payment";
const PAYU_LIVE_URL = "https://secure.payu.in/_payment";

export type PayUConfig = {
  key: string;
  salt: string;
  actionUrl: string;
  callbackUrl: string;
};

export type PayUCheckoutInput = {
  transactionId: string;
  amountInRupees: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
};

export function getPayUConfig(): PayUConfig | null {
  const key = process.env.PAYU_MERCHANT_KEY?.trim();
  const salt = process.env.PAYU_MERCHANT_SALT?.trim();
  const siteUrl = process.env.NEXTAUTH_URL?.trim();
  const rawEnvironment = process.env.PAYU_ENV?.trim().toLowerCase();
  const environment =
    rawEnvironment === "test" || rawEnvironment === "production" || rawEnvironment === "live"
      ? rawEnvironment
      : rawEnvironment
        ? "invalid"
        : "unset";
  const isProduction = environment === "production" || environment === "live";
  const missingVariables = [
    !key && "PAYU_MERCHANT_KEY",
    !salt && "PAYU_MERCHANT_SALT",
    !siteUrl && "NEXTAUTH_URL",
    environment === "unset" && "PAYU_ENV",
  ].filter((name): name is string => Boolean(name));

  if (!key || !salt || !siteUrl || environment === "unset") {
    console.warn("[PAYU_CONFIG] Not configured", {
      keyPresent: Boolean(key),
      saltPresent: Boolean(salt),
      siteUrlPresent: Boolean(siteUrl),
      selectedEnvironment: environment,
      missingVariables,
      failureReason: "missing_required_variables",
    });
    return null;
  }

  if (environment === "invalid") {
    console.warn("[PAYU_CONFIG] Not configured", {
      keyPresent: true,
      saltPresent: true,
      siteUrlPresent: true,
      selectedEnvironment: environment,
      missingVariables,
      failureReason: "unsupported_PAYU_ENV",
    });
    return null;
  }

  let callbackUrl: string;
  try {
    const baseUrl = new URL(siteUrl);
    const hostname = baseUrl.hostname.toLowerCase();
    const isLoopback =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "::1" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname);
    if (
      isProduction
        ? baseUrl.protocol !== "https:" || isLoopback
        : baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost"
    ) {
      console.warn("[PAYU_CONFIG] Not configured", {
        keyPresent: Boolean(key),
        saltPresent: Boolean(salt),
        siteUrlPresent: true,
        selectedEnvironment: environment,
        missingVariables,
        failureReason: isProduction
          ? "production_callback_must_use_public_https"
          : "callback_url_must_use_https_or_localhost",
      });
      return null;
    }
    callbackUrl = new URL("/api/payment/payu/callback", baseUrl).toString();
  } catch {
    console.warn("[PAYU_CONFIG] Not configured", {
      keyPresent: Boolean(key),
      saltPresent: Boolean(salt),
      siteUrlPresent: true,
      selectedEnvironment: environment,
      missingVariables,
      failureReason: "invalid_NEXTAUTH_URL",
    });
    return null;
  }

  console.info("[PAYU_CONFIG] Ready", {
    keyPresent: true,
    saltPresent: true,
    siteUrlPresent: true,
    selectedEnvironment: environment,
    actionUrl: isProduction ? PAYU_LIVE_URL : PAYU_TEST_URL,
  });

  return {
    key,
    salt,
    actionUrl: isProduction ? PAYU_LIVE_URL : PAYU_TEST_URL,
    callbackUrl,
  };
}

export function createPayUCheckout(config: PayUConfig, input: PayUCheckoutInput) {
  const amount = input.amountInRupees.toFixed(2);
  const values = {
    key: config.key,
    txnid: input.transactionId,
    amount,
    productinfo: input.productInfo,
    firstname: input.firstName,
    email: input.email,
    phone: input.phone,
    surl: config.callbackUrl,
    furl: config.callbackUrl,
  };
  const hashInput = [
    values.key,
    values.txnid,
    values.amount,
    values.productinfo,
    values.firstname,
    values.email,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    config.salt,
  ].join("|");

  return {
    actionUrl: config.actionUrl,
    fields: { ...values, hash: sha512(hashInput) },
  };
}

export function verifyPayUResponseHash(
  config: PayUConfig,
  response: Record<string, string>
): boolean {
  const receivedHash = response.hash?.toLowerCase();
  if (!receivedHash || !/^[a-f0-9]{128}$/.test(receivedHash)) return false;

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

  const expectedHash = sha512(hashInput);
  return timingSafeEqual(Buffer.from(receivedHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function sha512(value: string): string {
  return createHash("sha512").update(value, "utf8").digest("hex");
}
