import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changePasswordSchema,
  passwordFormSchema,
  setPasswordSchema,
} from "../src/lib/validations/auth";

const newPasswordFields = {
  newPassword: "Password1",
  confirmPassword: "Password1",
};

test("first-time password setup does not require a current password", () => {
  assert.equal(setPasswordSchema.safeParse(newPasswordFields).success, true);
  assert.equal(passwordFormSchema.safeParse(newPasswordFields).success, true);
});

test("changing an existing password requires the current password", () => {
  assert.equal(changePasswordSchema.safeParse(newPasswordFields).success, false);
  assert.equal(
    changePasswordSchema.safeParse({ ...newPasswordFields, currentPassword: "Current1" }).success,
    true
  );
  assert.equal(passwordFormSchema.safeParse({ ...newPasswordFields, currentPassword: "" }).success, false);
});

test("password setup and change reject mismatched confirmation", () => {
  const mismatched = { ...newPasswordFields, confirmPassword: "Different1" };
  assert.equal(setPasswordSchema.safeParse(mismatched).success, false);
  assert.equal(changePasswordSchema.safeParse({ ...mismatched, currentPassword: "Current1" }).success, false);
});
