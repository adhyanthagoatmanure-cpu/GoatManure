import { loadEnvConfig } from "@next/env";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--delete" && arg !== "--dry-run")) {
    throw new Error("Usage: npm run storage:cleanup [-- --dry-run|--delete]");
  }
  if (args.includes("--delete") && args.includes("--dry-run")) {
    throw new Error("Choose either --dry-run or --delete");
  }

  const dryRun = !args.includes("--delete");
  loadEnvConfig(process.cwd());
  const { cleanupManagedImages } = await import("../src/server/storage/image-references");
  const result = await cleanupManagedImages(dryRun);

  console.info(`[image-cleanup] mode=${dryRun ? "dry-run" : "delete"}`);
  console.info(`[image-cleanup] scanned=${result.scanned} orphanCandidates=${result.candidates.length} skipped=${result.skipped}`);
  for (const key of result.candidates) {
    console.info(`[image-cleanup] ${dryRun ? "candidate" : "deleted"} ${key}`);
  }
  if (result.failed.length > 0) {
    console.error(`[image-cleanup] failed=${result.failed.length}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected cleanup failure";
  console.error(`[image-cleanup] ${message}`);
  process.exitCode = 1;
});
