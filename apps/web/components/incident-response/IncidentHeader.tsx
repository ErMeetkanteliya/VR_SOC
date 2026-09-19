"use client";

import React from "react";
import { Flame, Plus, ShieldAlert, BookOpen, Clock } from "lucide-react";
import type { IncidentOverviewStats } from "@vrsoc/types";

interface IncidentHeaderProps {
  stats: IncidentOverviewStats;
  onOpenDeclareModal: () => void;
  selectedIncidentCode?: string;
  onBackToQueue?: () => void;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  stats,
  onOpenDeclareModal,
  selectedIncidentCode,
  onBackToQueue,
}) => {
  return (
    <div className="space-y-4 border-b border-white/10 pb-5" data-testid="incident-header">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Incident Response & Dossier
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 text-white/60 border border-white/10">
              NIST SP 800-61 Aligned
            </span>
          </div>
          <p className="text-xs text-white/50">
            Adversary containment, deterministic state transitions, playbook checklist execution, and forensic dossier curation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIncidentCode && onBackToQueue && (
            <button
              type="button"
              onClick={onBackToQueue}
              className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white border border-white/10 transition-colors"
            >
              ← Back to Queue
            </button>
          )}

          <button
            type="button"
            data-testid="declare-incident-btn"
            onClick={onOpenDeclareModal}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white/60">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414] border border-white/5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Active Critical (P1): <strong className="text-white font-mono">{stats.critical_p1}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414] border border-white/5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>In Containment: <strong className="text-white font-mono">{stats.in_containment}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414] border border-white/5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Standard Playbooks: <strong className="text-white font-mono">3 Active</strong></span>
        </div>
      </div>
    </div>
  );
};
