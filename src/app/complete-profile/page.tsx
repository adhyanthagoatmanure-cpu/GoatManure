"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const phoneSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

type PhoneInput = z.infer<typeof phoneSchema>;

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const { data: session, status, update } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [callbackUrl, router, status]);

  async function onSubmit(values: PhoneInput) {
    setServerError(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setServerError(data?.error ?? "Unable to save your phone number. Please try again.");
      return;
    }
    await update({ phone: values.phone, needsProfileCompletion: false });
    router.replace(callbackUrl);
    router.refresh();
  }

  if (status !== "authenticated" || !session) return null;

  return (
    <AuthShell
      title="Complete Your Profile"
      subtitle="Please add your phone number before continuing"
    >
      {serverError && (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] px-3.5 py-2.5 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Phone Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          SAVE AND CONTINUE
        </Button>
      </form>
    </AuthShell>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
