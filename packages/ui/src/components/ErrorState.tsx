import React from "react";
import { cn } from "../utils";
import { AlertOctagon, RotateCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">{title}</h4>
          <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          className="shrink-0 border-red-500/30 text-red-300 hover:bg-red-500/20"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
