"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { resetPasswordSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!token) {
    return (
      <AuthShell title="Invalid Link">
        <p className="text-center text-sm text-[var(--color-stone)]">
          This password reset link is missing its token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-5 block text-center text-sm font-medium text-[var(--color-canopy)] hover:underline">
          Request New Link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password Reset">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--color-success)]" />
          <p className="mt-3 text-sm text-[var(--color-stone)]">Redirecting you to login…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a New Password">
      {serverError && (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <input type="hidden" {...register("token")} />
        <Input label="New Password" type="password" {...register("password")} error={errors.password?.message} />
        <Input label="Confirm New Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
