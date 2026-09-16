import React from "react";
import { cn } from "../utils";
import { Card } from "./Card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
}

export function MetricCard({
  label,
  value,
  change,
  isPositive,
  icon,
  subtitle,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card variant="glass" className={cn("p-5 flex flex-col justify-between", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-white/50">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#E53935]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>

        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
              isPositive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/15 text-red-400 border-red-500/30"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
    </Card>
  );
}
