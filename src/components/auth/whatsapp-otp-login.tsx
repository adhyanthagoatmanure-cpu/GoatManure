"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { MessageCircle, RotateCw } from "lucide-react";
import { indianMobileNumberSchema } from "@/lib/validations/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WhatsAppOtpLogin({ callbackUrl }: { callbackUrl: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!resendAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setResendAt(null);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  async function sendCode() {
    setError(null);
    setMessage(null);
    const parsedPhone = indianMobileNumberSchema.safeParse(phone);
    if (!parsedPhone.success) {
      setError(parsedPhone.error.issues[0]?.message ?? "Enter a valid Indian mobile number.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/auth/whatsapp-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "LOGIN", phone: parsedPhone.data }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Unable to request a code. Please try again.");
        return;
      }
      setChallengeId(data.challengeId);
      setResendAt(Date.now() + 60_000);
      setMessage(data.message ?? "If eligible, a verification code may be sent. If you do not receive one, wait for the resend timer and try again.");
    } catch {
      setError("Unable to request a code. Please check your connection and try again.");
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
        body: JSON.stringify({ purpose: "LOGIN", challengeId, code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.authenticationTicket !== "string") {
        setError(data?.error ?? "The code is invalid or expired. Request a new code.");
        return;
      }

      const result = await signIn("phone-otp", {
        ticket: data.authenticationTicket,
        redirect: false,
        redirectTo: callbackUrl,
      });
      if (!result?.ok || result.error) {
        setError("Unable to sign in with that code. Request a new code and try again.");
        return;
      }
      window.location.assign(result.url ?? callbackUrl);
    } catch {
      setError("Unable to verify the code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section aria-label="WhatsApp login" className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-canopy-dark">Log in with WhatsApp</p>
      <Input
        label="Mobile Number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        disabled={Boolean(challengeId)}
        hint="We will send a one-time code if this number is registered."
      />
      {!challengeId ? (
        <Button type="button" variant="outline" onClick={sendCode} isLoading={isSending}>
          <MessageCircle className="h-4 w-4" /> Send WhatsApp Code
        </Button>
      ) : (
        <>
          <Input
            label="6-digit verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            error={error ?? undefined}
          />
          {message && <p role="status" className="text-sm text-[var(--color-stone)]">{message}</p>}
          <Button type="button" onClick={verifyCode} isLoading={isVerifying} disabled={code.length !== 6}>
            Verify and Log In
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={sendCode}
            isLoading={isSending}
            disabled={secondsLeft > 0}
          >
            <RotateCw className="h-4 w-4" />
            {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
          </Button>
          <button
            type="button"
            className="text-sm text-[var(--color-canopy)] hover:underline"
            onClick={() => {
              setChallengeId(null);
              setCode("");
              setMessage(null);
              setError(null);
            }}
          >
            Change mobile number
          </button>
        </>
      )}
      {!challengeId && error && <p role="alert" className="text-sm text-[var(--color-error)]">{error}</p>}
      {!challengeId && message && <p role="status" className="text-sm text-[var(--color-stone)]">{message}</p>}
    </section>
  );
}
