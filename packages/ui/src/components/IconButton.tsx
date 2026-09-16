import React from "react";
import { cn } from "../utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label: string; // Accessible aria-label
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", label, children, ...props }, ref) => {
    const sizeStyles = {
      sm: "w-8 h-8 p-1.5",
      md: "w-9 h-9 p-2",
      lg: "w-11 h-11 p-2.5",
    };

    const variantStyles = {
      primary: "bg-[#E53935] hover:bg-[#D32F2F] text-white",
      secondary: "bg-[#5B0A0A] hover:bg-[#720D0D] text-white border border-[#E53935]/30",
      outline: "bg-transparent hover:bg-white/5 text-white/80 hover:text-white border border-white/10",
      ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white",
    };

    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E53935]/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
