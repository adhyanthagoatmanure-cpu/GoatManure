"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { indianMobileNumberSchema } from "@/lib/validations/phone";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const { data: session, status, update } = useSession();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [callbackUrl, router, status]);

  async function sendCode() {
    setError(null);
    const parsed = indianMobileNumberSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid mobile number.");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch("/api/auth/whatsapp-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "PROFILE", phone: parsed.data }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Unable to send the verification code.");
        return;
      }
      setChallengeId(data.challengeId);
    } finally {
      setIsSending(false);
    }
  }

  async function verifyCode() {
    if (!challengeId) return;
    setError(null);
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/whatsapp-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "PROFILE", challengeId, code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setError(data?.error ?? "The verification code is invalid or expired.");
        return;
      }
      await update({ phone, needsProfileCompletion: false });
      router.replace(callbackUrl);
      router.refresh();
    } finally {
      setIsVerifying(false);
    }
  }

  if (status !== "authenticated" || !session) return null;

  return (
    <AuthShell title="Verify Your Mobile Number" subtitle="Add and verify the mobile number for your account">
      {error && <p role="alert" className="mb-4 rounded-[var(--radius-sm)] border border-error/25 bg-error-bg px-3.5 py-2.5 text-sm font-medium text-error">{error}</p>}
      <div className="flex flex-col gap-4">
        <Input label="Phone Number" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={Boolean(challengeId)} />
        {!challengeId ? (
          <Button type="button" size="lg" isLoading={isSending} onClick={sendCode}>SEND OTP</Button>
        ) : (
          <>
            <Input label="6-digit verification code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            <Button type="button" size="lg" isLoading={isVerifying} disabled={code.length !== 6} onClick={verifyCode}>CONFIRM OTP</Button>
            <button type="button" className="text-sm font-semibold text-canopy" onClick={() => { setChallengeId(null); setCode(""); setError(null); }}>Change mobile number</button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function CompleteProfilePage() {
  return <Suspense><CompleteProfileForm /></Suspense>;
}
