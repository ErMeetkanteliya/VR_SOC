import React from "react";
import { cn } from "../utils";
import { VRSOC_DESIGN_TOKENS } from "../tokens";

export type StatusType = "Online" | "Warning" | "Critical" | "Offline" | "Updating" | "Pending";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  pulse = true,
  className,
  ...props
}: StatusBadgeProps) {
  const normalized = status.toLowerCase() as keyof typeof VRSOC_DESIGN_TOKENS.status;
  const token = VRSOC_DESIGN_TOKENS.status[normalized] || VRSOC_DESIGN_TOKENS.status.offline;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide",
        token.badge,
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          token.dot,
          pulse && status === "Online" && "animate-pulse"
        )}
      />
      <span>{status}</span>
    </span>
  );
}
