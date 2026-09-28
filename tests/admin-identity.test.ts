import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_EMAIL, isAdminIdentity } from "../src/lib/admin-identity";

test("allows the configured admin email with the ADMIN role", () => {
  assert.equal(isAdminIdentity(ADMIN_EMAIL, "ADMIN"), true);
});

test("denies other accounts even when their stored role is ADMIN", () => {
  assert.equal(isAdminIdentity("other@example.com", "ADMIN"), false);
});

test("denies the configured email unless its role is ADMIN", () => {
  assert.equal(isAdminIdentity(ADMIN_EMAIL, "CUSTOMER"), false);
});

test("denies unauthenticated users", () => {
  assert.equal(isAdminIdentity(null, null), false);
});
