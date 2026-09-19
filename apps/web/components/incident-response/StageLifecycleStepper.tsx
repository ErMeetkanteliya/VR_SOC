"use client";

import React from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { STAGE_LIFECYCLE_ORDER, isValidStageTransition } from "@/lib/incident-response/catalog";
import type { Incident, IncidentStage } from "@vrsoc/types";

interface StageLifecycleStepperProps {
  incident: Incident;
  onOpenTransitionModal: (targetStage?: IncidentStage) => void;
  disabled?: boolean;
}

export const StageLifecycleStepper: React.FC<StageLifecycleStepperProps> = ({
  incident,
  onOpenTransitionModal,
  disabled = false,
}) => {
  const currentStageIndex = STAGE_LIFECYCLE_ORDER.indexOf(incident.stage);

  return (
    <div className="p-5 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-4" data-testid="stage-lifecycle-stepper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Incident Lifecycle Stage:
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            {incident.stage}
          </span>
          <span className="text-xs text-white/40">({incident.status})</span>
        </div>

        {!disabled && incident.stage !== "Closed" && (
          <button
            type="button"
            data-testid="advance-stage-btn"
            onClick={() => onOpenTransitionModal()}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Advance Stage</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Visual Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGE_LIFECYCLE_ORDER.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex || incident.stage === "Closed";
          const isCurrent = stage === incident.stage;
          const isAllowedTransition = isValidStageTransition(incident.stage, stage);
          const timestamp = incident.stage_timestamps[stage];

          return (
            <button
              key={stage}
              type="button"
              data-testid={`stage-step-${stage}`}
              disabled={disabled || (!isAllowedTransition && !isCurrent)}
              onClick={() => {
                if (isAllowedTransition && !isCurrent) {
                  onOpenTransitionModal(stage);
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[76px] ${
                isCurrent
                  ? "bg-red-950/40 border-red-500/50 shadow-md shadow-red-900/20"
                  : isCompleted
                  ? "bg-[#181818] border-white/10 hover:border-white/20"
                  : isAllowedTransition
                  ? "bg-[#121212] border-white/5 hover:border-red-500/30 cursor-pointer"
                  : "bg-[#0f0f0f] border-white/5 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-white/40">
                  0{idx + 1}
                </span>
                {isCompleted && !isCurrent ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                ) : null}
              </div>

              <div className="space-y-0.5 mt-1">
                <span
                  className={`text-[11px] font-bold block truncate ${
                    isCurrent
                      ? "text-red-300 font-extrabold"
                      : isCompleted
                      ? "text-white/80"
                      : "text-white/50"
                  }`}
                >
                  {stage}
                </span>

                {timestamp ? (
                  <span className="text-[9px] font-mono text-white/40 block truncate">
                    {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : (
                  <span className="text-[9px] text-white/20 block">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
