const { spawn, spawnSync } = require("node:child_process");

function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const requiredVariables = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missingVariables = requiredVariables.filter(
    (name) => process.env[name] === undefined || process.env[name] === "",
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Cannot start application: missing environment variable(s): ${missingVariables.join(", ")}. Set DATABASE_URL or all required DB_* variables.`,
    );
  }

  const databaseUrl = new URL("mysql://localhost");
  databaseUrl.hostname = process.env.DB_HOST;
  databaseUrl.port = process.env.DB_PORT || "3306";
  databaseUrl.username = process.env.DB_USER;
  databaseUrl.password = process.env.DB_PASSWORD;
  databaseUrl.pathname = `/${process.env.DB_NAME}`;
  process.env.DATABASE_URL = databaseUrl.toString();
}

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
