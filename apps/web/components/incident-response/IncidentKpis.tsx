"use client";

import React from "react";
import { Flame, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { IncidentOverviewStats } from "@vrsoc/types";

interface IncidentKpisProps {
  stats: IncidentOverviewStats;
}

export const IncidentKpis: React.FC<IncidentKpisProps> = ({ stats }) => {
  const cards = [
    {
      title: "Total Active Incidents",
      value: stats.active_incidents,
      total: stats.total_incidents,
      totalLabel: "total recorded",
      icon: Flame,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      description: "Under active investigation or containment",
    },
    {
      title: "Critical & P1 Priority",
      value: stats.critical_p1,
      total: `${Math.round((stats.critical_p1 / (stats.total_incidents || 1)) * 100)}%`,
      totalLabel: "of all incidents",
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      description: "Immediate triage & leadership escalation",
    },
    {
      title: "In Containment Phase",
      value: stats.in_containment,
      total: `${stats.avg_mttc_hours}h`,
      totalLabel: "avg MTTC window",
      icon: ShieldCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      description: "Host isolation & perimeter blocks in effect",
    },
    {
      title: "Resolved / Closed",
      value: stats.resolved_today,
      total: `${stats.avg_mttr_hours}h`,
      totalLabel: "avg MTTR",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      description: "Lessons learned & root cause documented",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="incident-kpis">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 relative overflow-hidden shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.bg} ${card.color} border ${card.border}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {card.value}
              </span>
              <span className="text-[11px] text-white/40">
                / {card.total} {card.totalLabel}
              </span>
            </div>

            <p className="text-[11px] text-white/40 leading-snug">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
};
