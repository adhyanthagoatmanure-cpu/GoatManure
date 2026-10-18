"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordFormSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

type FormValues = z.infer<typeof passwordFormSchema>;

export default function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(passwordFormSchema) });

  useEffect(() => {
    let cancelled = false;

    async function loadPasswordStatus() {
      try {
        const res = await fetch("/api/account/change-password");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unable to load password settings");
        if (!cancelled) setHasPassword(Boolean(data.hasPassword));
      } catch (error) {
        if (!cancelled) {
          setServerError(error instanceof Error ? error.message : "Unable to load password settings");
        }
      }
    }

    void loadPasswordStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong");
        return;
      }
      show(hasPassword ? "Password updated successfully" : "Password set successfully");
      setHasPassword(true);
      reset();
    } catch {
      setServerError("Unable to save your password. Please try again.");
    }
  }

  return (
    <Card className="max-w-md p-6 sm:p-8">
      <h2 className="font-display text-xl font-medium">{hasPassword ? "Change Password" : "Set Password"}</h2>
      {hasPassword === false && (
        <p className="mt-2 text-sm text-[var(--color-stone)]">
          Your account currently signs in with Google, Facebook, or your mobile number. Set a password to also sign in with your email and password.
        </p>
      )}
      {serverError && (
        <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}
      {hasPassword === null ? (
        !serverError && <p className="mt-5 text-sm text-[var(--color-stone)]">Loading password settings…</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
          {hasPassword && (
            <Input label="Current Password" type="password" {...register("currentPassword")} error={errors.currentPassword?.message} />
          )}
          <Input label="New Password" type="password" {...register("newPassword")} error={errors.newPassword?.message} />
          <Input label="Confirm New Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
          <Button type="submit" isLoading={isSubmitting} className="mt-1 self-start">
            {hasPassword ? "Update Password" : "Set Password"}
          </Button>
        </form>
      )}
    </Card>
  );
}
