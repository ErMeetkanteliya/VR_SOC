"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpAction, resendOtpAction } from "@/lib/auth/actions";
import { Button } from "@vrsoc/ui";
import { Mail, AlertCircle, CheckCircle2, Shield, RefreshCw } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const token = otpDigits.join("");
    if (token.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the code.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtpAction({
        email,
        token,
        type: "signup",
      });

      if (!result.success) {
        setErrorMessage(result.error || "Verification failed. Invalid or expired code.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Email verified successfully! Redirecting...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage("Unable to verify code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading || !email) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await resendOtpAction(email, "signup");
      if (!result.success) {
        setErrorMessage(result.error || "Unable to resend verification code.");
      } else {
        setSuccessMessage("A fresh verification code has been dispatched.");
        setCanResend(false);
        setResendCountdown(60);
      }
    } catch {
      setErrorMessage("Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10 space-y-6">
      {/* Monogram Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#5B0A0A]/40 mb-2 select-none">
          VS
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Email Verification</h1>
        <p className="text-xs text-white/50">
          Confirm your identity with the 6-digit code sent to your inbox
        </p>
      </div>

      {/* Auth Card */}
      <div className="p-6 sm:p-8 bg-[#161616]/90 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-md space-y-5">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && !errorMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-white/40" />
              <span>Email address</span>
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/60 focus:ring-1 focus:ring-[#E53935]/40 transition-all duration-150 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-white/80">6-Digit Code</label>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 rounded-xl bg-white/[0.04] border border-white/15 text-center text-lg font-mono font-bold text-white focus:outline-none focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/40 transition-all"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 mt-2"
            isLoading={isLoading}
          >
            Confirm Email
          </Button>

          <div className="flex items-center justify-between text-xs pt-2">
            <Link
              href="/login"
              className="text-white/50 hover:text-white transition-colors"
            >
              Back to login
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="text-xs text-[#E53935] hover:text-[#EF5350] disabled:text-white/30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {canResend ? "Resend Code" : `Resend in ${resendCountdown}s`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Defense Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
        <Shield className="w-3 h-3 text-[#E53935]" />
        <span>VRSOC Defensive Security Environment</span>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#E53935]/30">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,10,10,0.35),rgba(255,255,255,0))] pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-white/40">Loading verification session...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
