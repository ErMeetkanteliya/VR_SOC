"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Layers, Target, Activity } from "lucide-react";
import type { MitreCoverageStats } from "@vrsoc/types";

interface MitreOverviewKpisProps {
  stats: MitreCoverageStats;
}

export const MitreOverviewKpis: React.FC<MitreOverviewKpisProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Detection Coverage */}
      <div className="p-4 rounded-xl bg-[#161616] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Overall Coverage
          </span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {stats.coverage_percentage}%
          </span>
          <span className="text-xs text-emerald-400/90 font-medium">
            {stats.covered_techniques} / {stats.total_techniques} Techniques
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.coverage_percentage}%` }}
          />
        </div>
      </div>

      {/* 2. Mapped Detection Rules */}
      <div className="p-4 rounded-xl bg-[#161616] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Mapped Detection Rules
          </span>
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {stats.total_rules_mapped}
          </span>
          <span className="text-xs text-white/50 font-medium">
            Active Sigma & Baselines
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
          <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Continuous correlation active</span>
        </div>
      </div>

      {/* 3. Sub-Technique Precision */}
      <div className="p-4 rounded-xl bg-[#161616] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Sub-Technique Coverage
          </span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {stats.subtechnique_coverage.percentage}%
          </span>
          <span className="text-xs text-blue-400/90 font-medium">
            {stats.subtechnique_coverage.covered} / {stats.subtechnique_coverage.total} Sub-techniques
          </span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.subtechnique_coverage.percentage}%` }}
          />
        </div>
      </div>

      {/* 4. Matrix Detection Gaps */}
      <div className="p-4 rounded-xl bg-[#161616] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Detection Visibility Gaps
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {stats.uncovered_techniques}
          </span>
          <span className="text-xs text-white/50 font-medium">
            Techniques need rules
          </span>
        </div>
        <div className="mt-3 text-xs text-amber-400/80 font-medium flex items-center justify-between">
          <span>Simulation Gap Rate</span>
          <span>{100 - stats.coverage_percentage}%</span>
        </div>
      </div>
    </div>
  );
};
