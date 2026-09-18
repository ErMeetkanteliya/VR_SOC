"use client";

import React from "react";
import { Crosshair, Sparkles } from "lucide-react";
import { CANONICAL_HUNT_TEMPLATES, type HuntHypothesisTemplate } from "@/lib/threat-hunting/catalog";

interface HuntHeaderProps {
  onSelectTemplate: (template: HuntHypothesisTemplate) => void;
}

export const HuntHeader: React.FC<HuntHeaderProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-4 border-b border-white/10 pb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Crosshair className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Threat Hunting & Investigation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 text-white/60 border border-white/10">
              Hypothesis Driven
            </span>
          </div>
          <p className="text-xs text-white/50">
            Adversary TTP hypothesis testing, cross-source telemetry correlation, and deterministic kill-chain reconstruction.
          </p>
        </div>
      </div>

      {/* Pre-configured Hypothesis Quick Chips */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/60 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Hypothesis Scenarios</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CANONICAL_HUNT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              data-testid={`hunt-template-${tmpl.id}`}
              onClick={() => onSelectTemplate(tmpl)}
              className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-xs text-white/80 hover:text-white transition-all text-left group flex items-center gap-2"
            >
              <span className="font-mono text-[11px] font-bold text-red-400">{tmpl.id}</span>
              <span className="font-medium truncate max-w-[200px]">{tmpl.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
