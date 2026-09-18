"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ExternalLink,
  Terminal,
  Activity,
  ArrowRight,
  Sparkles,
  Cpu,
} from "lucide-react";
import type { MitreTechniqueDetail, MitreTechnique } from "@vrsoc/types";

interface MitreTechniqueDrawerProps {
  technique: MitreTechniqueDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSubTechnique?: (subTech: MitreTechnique) => void;
}

export const MitreTechniqueDrawer: React.FC<MitreTechniqueDrawerProps> = ({
  technique,
  isOpen,
  onClose,
  onSelectSubTechnique,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "mitigations" | "examples">("overview");

  if (!isOpen || !technique) return null;

  const isCovered = technique.coverage_status === "covered" || technique.mapped_detection_rules.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div
        data-testid="technique-drawer"
        className="relative w-full max-w-2xl bg-[#111111] border-l border-white/10 h-full overflow-y-auto z-10 flex flex-col shadow-2xl"
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 bg-[#141414]/95 backdrop-blur border-b border-white/10 p-5 z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  {technique.external_id}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/60">
                  {technique.tactic_name} ({technique.tactic_external_id})
                </span>
                {technique.is_subtechnique && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Sub-technique of {technique.parent_technique_id}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {technique.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Coverage Status Banner */}
          <div className="mt-4 p-3 rounded-lg flex items-center justify-between border bg-[#161616]">
            <div className="flex items-center gap-2.5">
              {isCovered ? (
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-white">
                  {isCovered ? "Detection Active in VRSOC" : "Visibility Gap — Uncovered"}
                </div>
                <div className="text-[11px] text-white/50">
                  {isCovered
                    ? `${technique.mapped_rules_count} active detection rule${technique.mapped_rules_count === 1 ? "" : "s"} protecting against this technique`
                    : "No active Sigma or baseline detection rule mapped"}
                </div>
              </div>
            </div>

            {isCovered ? (
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                100% Covered
              </span>
            ) : (
              <Link
                href={`/detections?mitre=${technique.external_id}`}
                className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 transition-all hover:bg-red-500/20"
              >
                <span>Create Rule</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-white/5 pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Overview & Guidance
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "rules"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span>Mapped Rules</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {technique.mapped_rules_count}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("mitigations")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "mitigations"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span>Mitigations</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {technique.mitigations?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("examples")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "examples"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span>Threat Examples</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10">
                {technique.examples?.length ?? 0}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & GUIDANCE */}
          {activeTab === "overview" && (
            <>
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Technique Description
                </h3>
                <p className="text-sm text-white/80 leading-relaxed bg-[#161616] p-4 rounded-xl border border-white/5">
                  {technique.description}
                </p>
              </div>

              {/* Platforms & Data Sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>Target Platforms</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {technique.platforms.map((plat) => (
                      <span
                        key={plat}
                        className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      >
                        {plat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Required Data Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {technique.data_sources.map((ds) => (
                      <span
                        key={ds}
                        className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {ds}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detection Guidance */}
              {technique.detection_guidance && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    <span>VRSOC Detection Engineering Guidance</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-[#161616] border border-white/5 text-sm text-white/90 leading-relaxed font-mono">
                    {technique.detection_guidance}
                  </div>
                </div>
              )}

              {/* Sub-techniques list if available */}
              {technique.sub_techniques && technique.sub_techniques.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Child Sub-Techniques ({technique.sub_techniques.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {technique.sub_techniques.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSelectSubTechnique?.(sub)}
                        className="p-3 rounded-lg bg-[#161616] border border-white/5 hover:border-white/20 hover:bg-[#1f1f1f] text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-mono font-bold text-red-400">
                            {sub.external_id}
                          </div>
                          <div className="text-sm font-medium text-white group-hover:text-white">
                            {sub.name}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: MAPPED DETECTION RULES */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Active Detection Rules ({technique.mapped_detection_rules.length})
                </span>
                <Link
                  href="/detections"
                  className="text-xs text-red-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Rule Engine</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {technique.mapped_detection_rules.length > 0 ? (
                <div className="space-y-3">
                  {technique.mapped_detection_rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-3 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                rule.severity === "Critical"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : rule.severity === "High"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {rule.severity}
                            </span>
                            <span className="text-xs text-white/50">{rule.category}</span>
                            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              {rule.rule_type}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5">{rule.name}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed">
                        {rule.description}
                      </p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/40">
                          Window: {rule.evaluation_window_minutes}m • Threshold: {rule.threshold_count}
                        </span>
                        <Link
                          href={`/detections?rule=${rule.id}`}
                          className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          <span>Inspect Rule</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-[#161616] border border-white/5 space-y-3">
                  <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">No Detection Rules Mapped</div>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    This MITRE ATT&CK technique currently has no active Sigma or baseline detection rules in your tenant environment.
                  </p>
                  <Link
                    href={`/detections?create=true&mitre=${technique.external_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-lg shadow-red-600/20"
                  >
                    <span>Build Detection Rule for {technique.external_id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MITIGATIONS */}
          {activeTab === "mitigations" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Defensive Mitigations & Hardening ({technique.mitigations?.length ?? 0})
              </span>

              {technique.mitigations && technique.mitigations.length > 0 ? (
                technique.mitigations.map((mit) => (
                  <div
                    key={mit.external_id}
                    className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {mit.external_id}
                      </span>
                      <h4 className="text-sm font-bold text-white">{mit.name}</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {mit.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-white/40 italic bg-[#161616] rounded-xl border border-white/5">
                  Standard baseline endpoint and network isolation mitigations apply.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THREAT EXAMPLES */}
          {activeTab === "examples" && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Observed In-the-Wild Threat Procedures ({technique.examples?.length ?? 0})
              </span>

              {technique.examples && technique.examples.length > 0 ? (
                technique.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#161616] border border-white/5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {ex.source_or_actor}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {ex.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-white/40 italic bg-[#161616] rounded-xl border border-white/5">
                  No specific threat actor procedures recorded in baseline.
                </div>
              )}
            </div>
          )}

          {/* SOC Investigation Quick Pivots */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Cross-Platform SOC Quick Pivots
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href={`/logs?query=${technique.external_id}`}
                className="p-2.5 rounded-lg bg-[#161616] border border-white/5 hover:border-white/20 hover:bg-[#202020] text-center transition-all group"
              >
                <Terminal className="w-4 h-4 text-blue-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-white/80 block">SIEM Logs</span>
              </Link>
              <Link
                href="/edr"
                className="p-2.5 rounded-lg bg-[#161616] border border-white/5 hover:border-white/20 hover:bg-[#202020] text-center transition-all group"
              >
                <Cpu className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-white/80 block">EDR Endpoint</span>
              </Link>
              <Link
                href="/alerts"
                className="p-2.5 rounded-lg bg-[#161616] border border-white/5 hover:border-white/20 hover:bg-[#202020] text-center transition-all group"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-white/80 block">Alert Center</span>
              </Link>
              <Link
                href="/xdr"
                className="p-2.5 rounded-lg bg-[#161616] border border-white/5 hover:border-white/20 hover:bg-[#202020] text-center transition-all group"
              >
                <Activity className="w-4 h-4 text-purple-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-white/80 block">XDR Fabric</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
