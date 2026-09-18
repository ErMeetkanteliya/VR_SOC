"use client";

import React from "react";
import { ArrowRight, GitCommit, Layers, ShieldCheck } from "lucide-react";
import type { HuntAttackStep } from "@vrsoc/types";

interface HuntAttackPathViewProps {
  attackPath: HuntAttackStep[];
}

export const HuntAttackPathView: React.FC<HuntAttackPathViewProps> = ({ attackPath }) => {
  if (!attackPath || attackPath.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121212] border border-white/10 text-white/40 text-xs italic">
        No reconstructed attack path steps identified for this query.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="hunt-attack-path-view">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Reconstructed Kill-Chain Attack Path ({attackPath.length} Steps)
          </h3>
        </div>
        <span className="text-[11px] text-white/40">Deterministic causality graph</span>
      </div>

      <div className="space-y-3">
        {attackPath.map((step) => (
          <div
            key={step.step_number}
            data-testid={`attack-step-${step.step_number}`}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-3 relative overflow-hidden"
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center font-mono font-bold text-xs">
                  {step.step_number}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {step.phase}
                  </span>
                  {step.technique_id && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 text-red-300 border border-red-500/20 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{step.technique_id}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{step.confidence}% Confidence</span>
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {new Date(step.occurred_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Entity Flow Transition Box */}
            <div className="p-3 rounded-lg bg-[#181818] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Source Entity */}
              <div className="w-full md:w-5/12 bg-black/40 p-2 rounded border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-white/40">Source Entity</span>
                <div className="font-mono text-xs font-bold text-white truncate" title={step.source_entity}>
                  {step.source_entity}
                </div>
              </div>

              {/* Action Activity Arrow */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                  <span>{step.activity}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Destination Entity */}
              <div className="w-full md:w-5/12 bg-black/40 p-2 rounded border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-white/40">Destination Target</span>
                <div className="font-mono text-xs font-bold text-red-300 truncate" title={step.destination_entity}>
                  {step.destination_entity}
                </div>
              </div>
            </div>

            {/* Analyst Reason Narrative */}
            <div className="text-xs text-white/70 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <span className="font-semibold text-white/90">Forensic Causal Link: </span>
              <span>{step.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
