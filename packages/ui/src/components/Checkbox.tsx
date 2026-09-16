import React from "react";
import { cn } from "../utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label htmlFor={checkboxId} className="flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              "w-4 h-4 rounded bg-white/5 border border-white/20 transition-all duration-150 flex items-center justify-center",
              "peer-checked:bg-[#E53935] peer-checked:border-[#E53935]",
              "peer-focus:ring-2 peer-focus:ring-[#E53935]/50",
              className
            )}
          >
            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" />
          </div>
        </div>
        {(label || description) && (
          <div>
            {label && <span className="text-xs font-medium text-white/90">{label}</span>}
            {description && <p className="text-[11px] text-white/40">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
