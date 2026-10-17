import assert from "node:assert/strict";
import { test } from "node:test";
import {
  configureDatabaseUrl,
  hasDatabaseConfiguration,
} from "../scripts/database-url";

test("allows Next.js to build when database environment variables are absent", () => {
  assert.equal(hasDatabaseConfiguration({}), false);
  assert.equal(hasDatabaseConfiguration({ DATABASE_URL: "" }), false);
});

test("detects database configuration from either supported environment format", () => {
  assert.equal(hasDatabaseConfiguration({ DATABASE_URL: "mysql://localhost/db" }), true);
  assert.equal(
    hasDatabaseConfiguration({
      DB_HOST: "localhost",
      DB_NAME: "db",
      DB_USER: "user",
      DB_PASSWORD: "secret",
    }),
    true,
  );
  assert.equal(
    hasDatabaseConfiguration({
      DB_HOST: "localhost",
      DB_NAME: "db",
      DB_USER: "user",
    }),
    false,
  );
});

test("constructs a MySQL URL and safely encodes reserved credential characters", () => {
  const environment = {
    DB_HOST: "mysql.example.com",
    DB_PORT: "3307",
    DB_NAME: "adhyantha store",
    DB_USER: "user@example.com",
    DB_PASSWORD: "secret:/?# value",
  };

  const connectionUrl = new URL(configureDatabaseUrl(environment));

  assert.equal(connectionUrl.protocol, "mysql:");
  assert.equal(connectionUrl.hostname, "mysql.example.com");
  assert.equal(connectionUrl.port, "3307");
  assert.equal(decodeURIComponent(connectionUrl.username), "user@example.com");
  assert.equal(decodeURIComponent(connectionUrl.password), "secret:/?# value");
  assert.equal(decodeURIComponent(connectionUrl.pathname.slice(1)), "adhyantha store");
});

test("uses a valid DATABASE_URL override without logging credentials", () => {
  const environment = {
    DATABASE_URL: "mysql://db-user:db-password@localhost:3306/adhyantha",
  };

  assert.equal(
    configureDatabaseUrl(environment),
    "mysql://db-user:db-password@localhost:3306/adhyantha",
  );
});

test("rejects incomplete DB_* configuration without exposing values", () => {
  assert.throws(
    () =>
      configureDatabaseUrl({
        DB_HOST: "mysql.example.com",
        DB_USER: "sensitive-user",
      }),
    {
      message:
        "Missing database environment variable(s): DB_NAME, DB_PASSWORD. Set DATABASE_URL or all required DB_* variables.",
    },
  );
});

test("rejects non-MySQL connection URLs", () => {
  assert.throws(
    () => configureDatabaseUrl({ DATABASE_URL: "postgresql://user:secret@localhost/database" }),
    { message: "DATABASE_URL must use the mysql protocol." },
  );
});
