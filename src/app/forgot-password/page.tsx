"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: FormValues) {
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check Your Email">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg ring-8 ring-success-bg/60">
            <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
          </span>
          <p role="status" className="mt-4 text-sm leading-6 text-stone">
            If an account exists with that email, we&apos;ve sent a link to reset your password. It expires in 1 hour.
          </p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-canopy underline-offset-4 hover:underline">
            Back to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link href="/login" className="font-semibold text-canopy underline-offset-4 hover:underline">
          Back to Login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Send Reset Link
        </Button>
      </form>
    </AuthShell>
  );
}
