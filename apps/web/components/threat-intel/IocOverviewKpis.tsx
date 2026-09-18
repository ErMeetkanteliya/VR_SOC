"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Eye, Layers } from "lucide-react";
import type { IocOverviewStats } from "@vrsoc/types";

interface IocOverviewKpisProps {
  stats: IocOverviewStats;
}

export const IocOverviewKpis: React.FC<IocOverviewKpisProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Active IOCs */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="space-y-1">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Total Active IOCs
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.active_iocs ?? 0}
            </span>
            <span className="text-xs text-white/40">
              / {stats?.total_iocs ?? 0} total
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <span>Canonical & Tenant Repository</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Critical & High Threats */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="space-y-1">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Critical & High Threats
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {stats?.critical_high_count ?? 0}
            </span>
            <span className="text-xs text-red-400/60">
              Priority Action
            </span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {stats?.by_severity?.critical ?? 0} Critical • {stats?.by_severity?.high ?? 0} High
          </div>
        </div>
        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-105 transition-transform">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Observed Sighting Matches */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="space-y-1">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Sighting Matches
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats?.total_sightings ?? 0}
            </span>
            <span className="text-xs text-amber-400/60">
              Linked Entities
            </span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            Events, Alerts & Asset Sightings
          </div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
          <Eye className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Type Distribution */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="space-y-1">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Indicator Types
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              6
            </span>
            <span className="text-xs text-white/40">
              Normalized Categories
            </span>
          </div>
          <div className="text-[11px] text-white/40 truncate max-w-[180px] mt-0.5">
            {stats?.by_type?.ip ?? 0} IP • {stats?.by_type?.domain ?? 0} DOM • {stats?.by_type?.hash ?? 0} HASH
          </div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
          <Layers className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
