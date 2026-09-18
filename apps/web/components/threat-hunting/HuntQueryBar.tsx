"use client";

import React from "react";
import { Search, Play, Clock, Filter, Server, Globe, Hash, User, Cpu, Database, Link2 } from "lucide-react";
import type { HuntType } from "@vrsoc/types";

interface HuntQueryBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  huntType: HuntType;
  onHuntTypeChange: (type: HuntType) => void;
  timeRange: string;
  onTimeRangeChange: (tr: string) => void;
  onExecuteHunt: () => void;
  isLoading: boolean;
}

const HUNT_TYPES: { id: HuntType; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Entities", icon: <Filter className="w-3.5 h-3.5" /> },
  { id: "ioc", label: "IOC", icon: <Globe className="w-3.5 h-3.5 text-red-400" /> },
  { id: "ip", label: "IP", icon: <Server className="w-3.5 h-3.5 text-blue-400" /> },
  { id: "hash", label: "Hash", icon: <Hash className="w-3.5 h-3.5 text-purple-400" /> },
  { id: "user", label: "User", icon: <User className="w-3.5 h-3.5 text-amber-400" /> },
  { id: "host", label: "Host", icon: <Server className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: "process", label: "Process", icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: "registry", label: "Registry", icon: <Database className="w-3.5 h-3.5 text-pink-400" /> },
  { id: "dns", label: "DNS", icon: <Link2 className="w-3.5 h-3.5 text-teal-400" /> },
];

export const HuntQueryBar: React.FC<HuntQueryBarProps> = ({
  query,
  onQueryChange,
  huntType,
  onHuntTypeChange,
  timeRange,
  onTimeRangeChange,
  onExecuteHunt,
  isLoading,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onExecuteHunt();
    }
  };

  return (
    <div className="space-y-3 bg-[#121212] p-4 rounded-2xl border border-white/10 shadow-xl">
      {/* Type Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/5">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider mr-1">
          Hunt Pivot:
        </span>
        {HUNT_TYPES.map((t) => {
          const isSelected = huntType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`hunt-type-${t.id}`}
              onClick={() => onHuntTypeChange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold shadow-sm"
                  : "bg-[#181818] text-white/60 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Search Input & Time / Action Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="hunt-search-input"
            placeholder={
              huntType === "ioc"
                ? "Search IOC: e.g. 185.220.101.5 or c2-update-services.ru..."
                : huntType === "process"
                ? "Search Process: e.g. powershell.exe, lsass.exe, cmd.exe..."
                : huntType === "user"
                ? "Search User: e.g. jsmith, admin_svc, Administrator..."
                : huntType === "host"
                ? "Search Host: e.g. WKSTN-FIN-004, DC-CORP-001..."
                : huntType === "hash"
                ? "Search Hash: e.g. 44d88612fea8a8f36de82e1278abb02f..."
                : huntType === "registry"
                ? "Search Registry: e.g. CurrentVersion\\Run..."
                : "Enter indicator, IP, host, hash, process name, or query term..."
            }
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161616] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 font-mono transition-colors"
          />
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1.5 bg-[#161616] px-3 py-2.5 rounded-xl border border-white/10 w-full sm:w-auto">
          <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
          <select
            value={timeRange}
            data-testid="hunt-time-range"
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="1h" className="bg-[#181818]">Last 1 Hour</option>
            <option value="24h" className="bg-[#181818]">Last 24 Hours</option>
            <option value="7d" className="bg-[#181818]">Last 7 Days</option>
            <option value="30d" className="bg-[#181818]">Last 30 Days</option>
            <option value="all" className="bg-[#181818]">All History</option>
          </select>
        </div>

        {/* Execute Hunt Button */}
        <button
          type="button"
          data-testid="execute-hunt-btn"
          onClick={onExecuteHunt}
          disabled={isLoading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/50 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isLoading ? "Hunting..." : "Execute Hunt"}</span>
        </button>
      </div>
    </div>
  );
};
