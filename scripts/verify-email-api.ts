import { loadEnvConfig } from "@next/env";
import { verifyEmailConnection } from "@/server/email/email-service";

loadEnvConfig(process.cwd());

async function main() {
  try {
    await verifyEmailConnection();
    console.log("Brevo API verification succeeded.");
  } catch (error) {
    console.error(
      error instanceof Error && error.message === "Brevo API is not configured"
        ? "Brevo API is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in the server environment."
        : "Brevo API verification failed. See the sanitized provider diagnostic above."
    );
    process.exitCode = 1;
  }
}

void main();
