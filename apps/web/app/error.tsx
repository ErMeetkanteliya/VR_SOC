"use client";

import React, { useEffect } from "react";
import { Button, Card } from "@vrsoc/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary] Caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card variant="glass" className="max-w-md w-full p-8 text-center border-red-500/20 bg-red-950/10">
        <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Module Exception Caught</h2>
        <p className="text-xs text-white/60 mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred while rendering this module. Please retry."}
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
