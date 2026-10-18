import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_EMAIL,
  isAdminIdentity,
  roleForIdentity,
} from "../src/lib/admin-identity";

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

test("assigns admin role only to the configured email after email verification", () => {
  assert.equal(roleForIdentity(ADMIN_EMAIL, new Date(), "ADMIN"), "ADMIN");
  assert.equal(roleForIdentity(ADMIN_EMAIL, null, "ADMIN"), "CUSTOMER");
  assert.equal(roleForIdentity(ADMIN_EMAIL, new Date(), "CUSTOMER"), "CUSTOMER");
  assert.equal(roleForIdentity("other@example.com", new Date(), "ADMIN"), "CUSTOMER");
});

test("matches the configured admin email case-insensitively", () => {
  assert.equal(roleForIdentity(ADMIN_EMAIL.toUpperCase(), new Date(), "ADMIN"), "ADMIN");
  assert.equal(isAdminIdentity(` ${ADMIN_EMAIL.toUpperCase()} `, "ADMIN"), true);
});
