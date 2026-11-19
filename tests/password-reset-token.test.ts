import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "../src/server/auth/password-reset-token";

test("password reset tokens are random and only stored as one-way hashes", () => {
  const token = generatePasswordResetToken();
  const hash = hashPasswordResetToken(token);

  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashPasswordResetToken(token), hash);
  assert.notEqual(generatePasswordResetToken(), token);
});
