import React from "react";
import { cn } from "../utils";
import { VRSOC_DESIGN_TOKENS } from "../tokens";
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type SeverityType =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: SeverityType;
  showIcon?: boolean;
  score?: number;
}

export function SeverityBadge({
  severity,
  showIcon = false,
  score,
  className,
  ...props
}: SeverityBadgeProps) {
  const normalized = severity.toLowerCase() as keyof typeof VRSOC_DESIGN_TOKENS.severity;
  const token = VRSOC_DESIGN_TOKENS.severity[normalized] || VRSOC_DESIGN_TOKENS.severity.informational;

  const renderIcon = () => {
    switch (severity) {
      case "Critical":
        return <ShieldAlert className="w-3 h-3 text-red-400" />;
      case "High":
        return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      case "Medium":
        return <AlertCircle className="w-3 h-3 text-amber-400" />;
      default:
        return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider",
        token.badge,
        className
      )}
      {...props}
    >
      {showIcon && renderIcon()}
      <span>{severity}</span>
      {typeof score === "number" && (
        <span className="opacity-75 font-semibold">({score})</span>
      )}
    </span>
  );
}
