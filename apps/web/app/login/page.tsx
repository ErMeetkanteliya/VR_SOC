"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@vrsoc/ui";
import { Mail, Lock, AlertCircle, Shield } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setErrorMessage(result.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      window.location.href = redirectPath;
    } catch {
      setErrorMessage("Authentication failed. Please check your network and try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Unable to initialize Google OAuth.");
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-xs text-white/50">Log in to your account</p>
      </div>

      {/* Auth Card */}
      <div className="p-6 sm:p-8 bg-[#161616]/90 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-md space-y-5">
        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            data-testid="auth-error-banner"
            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={isLoading}
          className="w-full h-10 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#161616] text-[10px] uppercase font-mono tracking-wider text-white/40">
            or continue with
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-white/40" />
                <span>Password</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-[#E53935] hover:text-[#EF5350] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Log in
          </Button>
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="text-center text-xs text-white/50">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-white hover:text-[#E53935] font-medium transition-colors ml-1"
        >
          Create one
        </Link>
      </div>

      {/* Security / Defense Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
        <Shield className="w-3 h-3 text-[#E53935]" />
        <span>VRSOC Defensive Security Environment</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#E53935]/30">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,10,10,0.35),rgba(255,255,255,0))] pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-white/40">Loading authentication session...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
