/* eslint @typescript-eslint/no-require-imports: off */
const { loadEnvConfig } = require("@next/env");
const { defineConfig } = require("prisma/config");
const { configureDatabaseUrl } = require("./scripts/database-url");

loadEnvConfig(process.cwd());
configureDatabaseUrl();

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npm run db:seed",
  },
});
