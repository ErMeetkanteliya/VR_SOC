import React from "react";
import { cn } from "../utils";

export interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  status?: "success" | "warning" | "error" | "info";
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const statusDotStyles = {
    success: "bg-emerald-500 ring-emerald-500/30",
    warning: "bg-amber-500 ring-amber-500/30",
    error: "bg-red-500 ring-red-500/30",
    info: "bg-blue-500 ring-blue-500/30",
  };

  return (
    <div className={cn("relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10", className)}>
      {items.map((item) => {
        const dotStyle = item.status ? statusDotStyles[item.status] : statusDotStyles.info;

        return (
          <div key={item.id} className="relative group">
            <span
              className={cn(
                "absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-[#0A0A0A] ring-4 shrink-0 transition-transform group-hover:scale-110",
                dotStyle
              )}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                <span className="text-[10px] font-mono text-white/40">{item.timestamp}</span>
              </div>
              {item.description && (
                <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
