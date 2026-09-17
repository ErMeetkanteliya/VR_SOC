import React from "react";
import type { AlertStatus } from "@vrsoc/types";

export interface AlertStatusBadgeProps {
  status: AlertStatus | string;
  className?: string;
}

export function AlertStatusBadge({ status, className = "" }: AlertStatusBadgeProps) {
  const norm = (status || "open").toLowerCase().replace(/\s+/g, "_");

  switch (norm) {
    case "open":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-red-950/40 text-red-300 border border-red-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Open
        </span>
      );

    case "acknowledged":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-950/40 text-amber-300 border border-amber-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Acknowledged
        </span>
      );

    case "in_progress":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-blue-950/40 text-blue-300 border border-blue-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          In Progress
        </span>
      );

    case "escalated":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-purple-950/40 text-purple-300 border border-purple-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Escalated
        </span>
      );

    case "closed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Closed
        </span>
      );

    case "false_positive":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-neutral-900/60 text-neutral-400 border border-white/10 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          False Positive
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-neutral-900/60 text-neutral-300 border border-white/10 ${className}`}
        >
          {status}
        </span>
      );
  }
}
