"use client";

import React, { useEffect } from "react";
import { cn } from "../utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full bg-[#161616] border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col",
          sizeStyles[size]
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            {description && <p className="text-xs text-white/50 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto max-h-[75vh]">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 bg-white/[0.02] border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
