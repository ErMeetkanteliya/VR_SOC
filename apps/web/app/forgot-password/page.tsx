"use client";

import React, { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Button } from "@vrsoc/ui";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await forgotPasswordAction({ email });
      if (!result.success) {
        setErrorMessage(result.error || "Unable to send reset instructions.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch {
      setErrorMessage("Unexpected error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#E53935]/30">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,10,10,0.35),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Monogram Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#5B0A0A]/40 mb-2 select-none">
            VS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
          <p className="text-xs text-white/50">
            Enter your email to receive self-service recovery instructions
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

          {isSubmitted ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Recovery Link Dispatched</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  If an account exists for <span className="text-white font-medium">{email}</span>, a secure recovery link has been sent. Please check your inbox and spam folders.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E53935] hover:text-[#EF5350] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  <span>Email address</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/60 focus:ring-1 focus:ring-[#E53935]/40 transition-all duration-150 disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 mt-2"
                isLoading={isLoading}
              >
                Send reset link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Defense Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
          <Shield className="w-3 h-3 text-[#E53935]" />
          <span>VRSOC Defensive Security Environment</span>
        </div>
      </div>
    </div>
  );
}
