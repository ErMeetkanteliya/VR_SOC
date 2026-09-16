"use client";

import React, { useEffect } from "react";
import { Button } from "@vrsoc/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError] Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark bg-[#0A0A0A] text-white">
      <body className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A0A]">
        <div className="max-w-md w-full p-8 text-center bg-[#161616] border border-red-500/30 rounded-2xl shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Platform Runtime Error</h1>
          <p className="text-xs text-white/60 mb-6 leading-relaxed">
            {error.message || "A critical platform error occurred. Please refresh or contact your SOC administrator."}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => reset()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset State
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
