"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Layers } from "lucide-react";
import type { MitreTactic, MitreTechnique, MitreCoverageStats } from "@vrsoc/types";

interface MitreMatrixViewProps {
  tactics: MitreTactic[];
  techniques: MitreTechnique[];
  stats: MitreCoverageStats;
  coveredTechniqueIds: Set<string>;
  onSelectTechnique: (technique: MitreTechnique) => void;
  selectedTechniqueId?: string | null;
}

export const MitreMatrixView: React.FC<MitreMatrixViewProps> = ({
  tactics,
  techniques,
  stats,
  coveredTechniqueIds,
  onSelectTechnique,
  selectedTechniqueId,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10">
      <div className="flex gap-3 min-w-max items-start">
        {tactics.map((tactic) => {
          const breakdown = stats.tactic_breakdown[tactic.external_id];
          const tacticTechniques = techniques.filter(
            (tech) => tech.tactic_external_id === tactic.external_id
          );
          const parentTechniques = tacticTechniques.filter((t) => !t.is_subtechnique);

          return (
            <div
              key={tactic.id}
              className="w-64 flex-shrink-0 flex flex-col gap-2 rounded-xl bg-[#121212] border border-white/5 p-3"
            >
              {/* Tactic Header */}
              <div className="pb-2 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                    {tactic.external_id}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      (breakdown?.coverage_percentage ?? 0) > 0
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {breakdown?.coverage_percentage ?? 0}%
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mt-1 truncate" title={tactic.name}>
                  {tactic.name}
                </h4>
                <div className="text-[11px] text-white/40 mt-0.5">
                  {breakdown?.covered_techniques ?? 0} of {breakdown?.total_techniques ?? parentTechniques.length} covered
                </div>
              </div>

              {/* Technique Cards in Tactic Column */}
              <div className="flex flex-col gap-2 mt-1">
                {parentTechniques.map((tech) => {
                  const extIdUpper = tech.external_id.toUpperCase();
                  const subTechs = techniques.filter(
                    (s) => s.is_subtechnique && s.parent_technique_id?.toUpperCase() === extIdUpper
                  );
                  const isParentCovered =
                    coveredTechniqueIds.has(extIdUpper) ||
                    subTechs.some((sub) => coveredTechniqueIds.has(sub.external_id.toUpperCase()));
                  const isSelected = selectedTechniqueId === tech.external_id || selectedTechniqueId === tech.id;

                  return (
                    <div key={tech.id} className="flex flex-col gap-1">
                      {/* Parent Technique Card */}
                      <button
                        data-testid={`technique-card-${tech.external_id}`}
                        onClick={() => onSelectTechnique(tech)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 group relative ${
                          isSelected
                            ? "bg-red-500/20 border-red-500/50 shadow-md shadow-red-500/10"
                            : isParentCovered
                            ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-900/30"
                            : "bg-[#181818] border-white/5 hover:border-white/15 hover:bg-[#202020]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-mono font-semibold text-white/70 group-hover:text-white">
                            {tech.external_id}
                          </span>
                          {isParentCovered ? (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Covered</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Gap</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-white leading-snug group-hover:text-white">
                          {tech.name}
                        </div>

                        {/* Subtechniques badge or data source chips */}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {subTechs.length > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              {subTechs.length} sub
                            </span>
                          )}
                          {tech.platforms.slice(0, 2).map((p) => (
                            <span key={p} className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-white/40">
                              {p}
                            </span>
                          ))}
                        </div>
                      </button>

                      {/* Subtechniques Indented List */}
                      {subTechs.map((sub) => {
                        const isSubCovered = coveredTechniqueIds.has(sub.external_id.toUpperCase());
                        const isSubSelected =
                          selectedTechniqueId === sub.external_id || selectedTechniqueId === sub.id;

                        return (
                          <button
                            key={sub.id}
                            data-testid={`subtechnique-card-${sub.external_id}`}
                            onClick={() => onSelectTechnique(sub)}
                            className={`ml-3 p-2 rounded-lg border text-left transition-all flex flex-col gap-1 group relative ${
                              isSubSelected
                                ? "bg-red-500/20 border-red-500/50 shadow-md shadow-red-500/10"
                                : isSubCovered
                                ? "bg-emerald-950/15 border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-900/20"
                                : "bg-[#151515] border-white/5 hover:border-white/10 hover:bg-[#1c1c1c]"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-mono font-medium text-white/60 group-hover:text-white">
                                {sub.external_id}
                              </span>
                              {isSubCovered ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                              )}
                            </div>
                            <div className="text-[11px] font-normal text-white/80 group-hover:text-white truncate">
                              {sub.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {parentTechniques.length === 0 && (
                  <div className="p-4 text-center text-xs text-white/30 italic">
                    No techniques match filters
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
