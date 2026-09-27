"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

type FormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
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
    show("Password updated successfully");
    reset();
  }

  return (
    <Card className="max-w-md p-6 sm:p-8">
      <h2 className="font-display text-xl font-medium">Change Password</h2>
      {serverError && (
        <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
        <Input label="Current Password" type="password" {...register("currentPassword")} error={errors.currentPassword?.message} />
        <Input label="New Password" type="password" {...register("newPassword")} error={errors.newPassword?.message} />
        <Input label="Confirm New Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        <Button type="submit" isLoading={isSubmitting} className="mt-1 self-start">
          Update Password
        </Button>
      </form>
    </Card>
  );
}
