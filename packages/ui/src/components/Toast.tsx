import { cn } from "../utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  type?: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
  onDismiss?: (id: string) => void;
}

export function Toast({
  id,
  type = "info",
  title,
  message,
  onDismiss,
}: ToastProps) {
  const typeIcons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  const typeBorders = {
    success: "border-emerald-500/30 bg-[#161616]/95",
    warning: "border-amber-500/30 bg-[#161616]/95",
    error: "border-red-500/30 bg-[#161616]/95",
    info: "border-blue-500/30 bg-[#161616]/95",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border shadow-xl shadow-black/60 flex items-start gap-3 max-w-sm w-full animate-in slide-in-from-top-2 duration-150 backdrop-blur-md",
        typeBorders[type]
      )}
    >
      <div className="mt-0.5">{typeIcons[type]}</div>
      <div className="flex-1 space-y-0.5">
        <h5 className="text-xs font-semibold text-white">{title}</h5>
        {message && <p className="text-xs text-white/60 leading-relaxed">{message}</p>}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
