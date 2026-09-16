"use client";

import { cn } from "../utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {(label || description) && (
        <div>
          {label && <span className="text-xs font-medium text-white/90">{label}</span>}
          {description && <p className="text-[11px] text-white/40">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "w-9 h-5 rounded-full transition-colors duration-200 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-[#E53935]/50 shrink-0",
          checked ? "bg-[#E53935]" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ease-in-out absolute top-0.75 left-0.75 shadow-sm",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}
