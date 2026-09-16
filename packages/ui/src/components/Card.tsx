import React from "react";
import { cn } from "../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "bordered" | "interactive";
}

export function Card({
  className,
  variant = "glass",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-[#161616] border border-white/10 rounded-xl",
    glass:
      "bg-[#161616]/85 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg shadow-black/40",
    bordered: "bg-[#0A0A0A] border border-white/15 rounded-xl",
    interactive:
      "bg-[#161616]/85 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg shadow-black/40 hover:bg-[#1C1C1C] hover:border-white/20 transition-all duration-200 cursor-pointer active:scale-[0.99]",
  };

  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pb-3 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight text-white", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-white/50 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0 flex items-center justify-between border-t border-white/5 mt-4", className)} {...props}>
      {children}
    </div>
  );
}
