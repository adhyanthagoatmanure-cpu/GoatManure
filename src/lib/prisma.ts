import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD !== undefined) {
    const databaseUrl = new URL("mysql://localhost");
    databaseUrl.hostname = DB_HOST;
    databaseUrl.port = DB_PORT || "3306";
    databaseUrl.username = encodeURIComponent(DB_USER);
    databaseUrl.password = encodeURIComponent(DB_PASSWORD);
    databaseUrl.pathname = `/${encodeURIComponent(DB_NAME)}`;
    process.env.DATABASE_URL = databaseUrl.toString();
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}