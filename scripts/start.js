/* eslint @typescript-eslint/no-require-imports: off */
const { spawn, spawnSync } = require("node:child_process");
const { configureDatabaseUrl } = require("./database-url");

require("@next/env").loadEnvConfig(process.cwd());

function deployMigrations() {
  const result = spawnSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
    {
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }

  return true;
}

function startNext() {
  const child = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "start"],
    {
      env: process.env,
      stdio: "inherit",
    },
  );

  child.on("error", (error) => {
    console.error(`Failed to start Next.js: ${error.message}`);
    process.exitCode = 1;
  });

  child.on("close", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

try {
  configureDatabaseUrl();

  if (deployMigrations()) {
    startNext();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
