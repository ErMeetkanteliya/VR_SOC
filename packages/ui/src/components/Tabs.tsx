import type { ReactNode } from "react";
import { cn } from "../utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div role="tablist" aria-orientation="horizontal" className={cn("flex border-b border-white/10 gap-6", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-all duration-150 flex items-center gap-2 border-b-2 -mb-px focus:outline-none",
                isActive
                  ? "border-[#E53935] text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold",
                    isActive ? "bg-[#E53935]/20 text-[#E53935]" : "bg-white/5 text-white/40"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" aria-orientation="horizontal" className={cn("inline-flex p-1 bg-white/5 border border-white/10 rounded-lg gap-1", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 focus:outline-none",
              isActive
                ? "bg-[#5B0A0A] text-white border border-[#E53935]/30 shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold",
                  isActive ? "bg-[#E53935] text-white" : "bg-white/10 text-white/50"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
