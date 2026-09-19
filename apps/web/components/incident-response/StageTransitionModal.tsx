"use client";

import React, { useState } from "react";
import { Modal } from "@vrsoc/ui";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { STAGE_LIFECYCLE_ORDER, isValidStageTransition } from "@/lib/incident-response/catalog";
import type { Incident, IncidentStage } from "@vrsoc/types";

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident;
  targetStage?: IncidentStage;
  onTransition: (newStage: IncidentStage, rationale: string) => Promise<boolean>;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  incident,
  targetStage,
  onTransition,
}) => {
  const currentStageIndex = STAGE_LIFECYCLE_ORDER.indexOf(incident.stage);
  const defaultNext = targetStage || STAGE_LIFECYCLE_ORDER[currentStageIndex + 1] || "Closed";

  const [selectedStage, setSelectedStage] = useState<IncidentStage>(defaultNext);
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (targetStage) {
      setSelectedStage(targetStage);
    } else {
      setSelectedStage(STAGE_LIFECYCLE_ORDER[currentStageIndex + 1] || "Closed");
    }
    setError(null);
  }, [targetStage, incident.stage, isOpen, currentStageIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidStageTransition(incident.stage, selectedStage)) {
      setError(`Cannot jump directly from ${incident.stage} to ${selectedStage}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const ok = await onTransition(selectedStage, rationale.trim());
    setIsSubmitting(false);

    if (ok) {
      setRationale("");
      onClose();
    } else {
      setError("Failed to advance stage. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advance Incident Lifecycle Stage">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="stage-transition-modal">
        {/* Current to Target Stage Display */}
        <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-white/40">Current Stage</span>
            <div className="text-xs font-bold text-white">{incident.stage}</div>
          </div>

          <ArrowRight className="w-5 h-5 text-purple-400" />

          <div className="space-y-0.5 text-right">
            <span className="text-[10px] uppercase font-bold text-purple-400">Target Stage</span>
            <div className="text-xs font-bold text-purple-300">{selectedStage}</div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-white/80 block mb-1">
            Select Next Lifecycle Stage
          </label>
          <select
            data-testid="target-stage-select"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as IncidentStage)}
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/50"
          >
            {STAGE_LIFECYCLE_ORDER.filter((s) => s !== incident.stage).map((s) => {
              const isAllowed = isValidStageTransition(incident.stage, s);
              return (
                <option key={s} value={s}>
                  {s} {isAllowed ? "(Allowed)" : "(Restricted Transition)"}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/80 block mb-1">
            Transition Rationale / Justification <span className="text-red-400">*</span>
          </label>
          <textarea
            data-testid="transition-rationale-input"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="e.g. Host isolation confirmed active and outbound C2 IP firewall rules deployed..."
            rows={3}
            required
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="confirm-transition-btn"
            disabled={isSubmitting || !rationale.trim()}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? "Transitioning..." : "Confirm Transition"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
