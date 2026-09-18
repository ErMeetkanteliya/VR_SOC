"use client";

import React from "react";
import { Activity, ShieldAlert, Globe, GitCommit } from "lucide-react";
import type { HuntQueryResult } from "@vrsoc/types";

interface HuntSummaryKpisProps {
  result: HuntQueryResult | null;
}

export const HuntSummaryKpis: React.FC<HuntSummaryKpisProps> = ({ result }) => {
  const totalSightings = result?.timeline.length ?? 0;
  const correlatedAlerts = result?.related_alerts.length ?? 0;
  const correlatedIocs = result?.related_iocs.length ?? 0;
  const attackSteps = result?.attack_path.length ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Sighting Matches */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Total Sightings
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {totalSightings}
        </div>
        <p className="text-[11px] text-white/40">
          Telemetry sightings & forensic records
        </p>
      </div>

      {/* 2. Correlated Alerts */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Detection Alerts
          </span>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-red-400">
          {correlatedAlerts}
        </div>
        <p className="text-[11px] text-white/40">
          Triggered Sigma & SIEM detections
        </p>
      </div>

      {/* 3. Threat Indicators */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Known IOC Matches
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400">
          {correlatedIocs}
        </div>
        <p className="text-[11px] text-white/40">
          Threat intelligence catalog hits
        </p>
      </div>

      {/* 4. Attack Kill-Chain Steps */}
      <div className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Kill-Chain Stages
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GitCommit className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400">
          {attackSteps}
        </div>
        <p className="text-[11px] text-white/40">
          Reconstructed ATT&CK attack phases
        </p>
      </div>
    </div>
  );
};
