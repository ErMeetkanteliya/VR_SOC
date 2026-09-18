"use client";

import React from "react";
import type { MitreTactic, MitreCoverageStats } from "@vrsoc/types";

interface MitreTacticsBarProps {
  tactics: MitreTactic[];
  stats: MitreCoverageStats;
  selectedTacticId: string;
  onSelectTactic: (tacticId: string) => void;
}

export const MitreTacticsBar: React.FC<MitreTacticsBarProps> = ({
  tactics,
  stats,
  selectedTacticId,
  onSelectTactic,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
      <div className="flex items-center gap-2 min-w-max">
        {/* ALL Tactics button */}
        <button
          onClick={() => onSelectTactic("ALL")}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
            selectedTacticId === "ALL"
              ? "bg-red-500/20 text-white border-red-500/40 shadow-lg shadow-red-500/10"
              : "bg-[#161616] text-white/60 border-white/5 hover:text-white hover:border-white/10"
          }`}
        >
          <span>All Tactics</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
            14
          </span>
        </button>

        {/* 14 Individual Tactic buttons */}
        {tactics.map((tac) => {
          const breakdown = stats.tactic_breakdown[tac.external_id];
          const isSelected = selectedTacticId === tac.external_id;
          const pct = breakdown?.coverage_percentage ?? 0;
          const isCovered = pct > 0;

          return (
            <button
              key={tac.id}
              onClick={() => onSelectTactic(tac.external_id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-start gap-1 border min-w-[130px] ${
                isSelected
                  ? "bg-red-500/20 text-white border-red-500/40 shadow-lg shadow-red-500/10"
                  : "bg-[#161616] text-white/60 border-white/5 hover:text-white hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="truncate max-w-[90px] text-left font-medium">{tac.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isCovered ? "text-emerald-400" : "text-white/30"
                  }`}
                >
                  {pct}%
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pct >= 70
                      ? "bg-emerald-400"
                      : pct > 0
                      ? "bg-amber-400"
                      : "bg-white/10"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
