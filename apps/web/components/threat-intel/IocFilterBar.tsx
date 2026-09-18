"use client";

import React from "react";
import { Search, Filter, RefreshCw, Plus, Globe, Server, Hash, Mail, FileText, Link2 } from "lucide-react";
import type { IocType, IocSeverity, IocStatus } from "@vrsoc/types";

interface IocFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: IocType | "all";
  onTypeChange: (type: IocType | "all") => void;
  selectedSeverity: IocSeverity | "all";
  onSeverityChange: (sev: IocSeverity | "all") => void;
  selectedStatus: IocStatus | "all";
  onStatusChange: (status: IocStatus | "all") => void;
  selectedSource: string;
  onSourceChange: (source: string) => void;
  onResetFilters: () => void;
  onOpenCreateModal: () => void;
  canCreate: boolean;
}

const TYPE_OPTIONS: { id: IocType | "all"; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Types", icon: null },
  { id: "ip", label: "IP Address", icon: <Server className="w-3.5 h-3.5" /> },
  { id: "domain", label: "Domain", icon: <Globe className="w-3.5 h-3.5" /> },
  { id: "url", label: "URL", icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: "hash", label: "Hash", icon: <Hash className="w-3.5 h-3.5" /> },
  { id: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
  { id: "file", label: "File", icon: <FileText className="w-3.5 h-3.5" /> },
];

export const IocFilterBar: React.FC<IocFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedSeverity,
  onSeverityChange,
  selectedStatus,
  onStatusChange,
  selectedSource,
  onSourceChange,
  onResetFilters,
  onOpenCreateModal,
  canCreate,
}) => {
  const isFiltered =
    searchQuery ||
    selectedType !== "all" ||
    selectedSeverity !== "all" ||
    selectedStatus !== "all" ||
    selectedSource !== "all";

  return (
    <div className="space-y-3">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by indicator value, tag, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              data-testid="create-ioc-btn"
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500/50 shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Indicator</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Type Pills & Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
        {/* Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.id;
            return (
              <button
                key={opt.id}
                data-testid={`type-filter-${opt.id}`}
                onClick={() => onTypeChange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                    : "bg-[#141414] text-white/60 hover:text-white border border-white/5 hover:border-white/10"
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdowns for Severity, Status, Source */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-white/10">
            <Filter className="w-3 h-3 text-white/40" />
            <select
              value={selectedSeverity}
              onChange={(e) => onSeverityChange(e.target.value as IocSeverity | "all")}
              className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181818]">All Severities</option>
              <option value="critical" className="bg-[#181818]">Critical</option>
              <option value="high" className="bg-[#181818]">High</option>
              <option value="medium" className="bg-[#181818]">Medium</option>
              <option value="low" className="bg-[#181818]">Low</option>
              <option value="informational" className="bg-[#181818]">Informational</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-white/10">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as IocStatus | "all")}
              className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181818]">All Statuses</option>
              <option value="active" className="bg-[#181818]">Active</option>
              <option value="deprecated" className="bg-[#181818]">Deprecated</option>
              <option value="whitelisted" className="bg-[#181818]">Whitelisted</option>
              <option value="false_positive" className="bg-[#181818]">False Positive</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-white/10">
            <select
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181818]">All Sources</option>
              <option value="manual" className="bg-[#181818]">Analyst Manual</option>
              <option value="simulation" className="bg-[#181818]">Simulation / Lab</option>
              <option value="alienvault" className="bg-[#181818]">AlienVault OTX</option>
              <option value="virustotal" className="bg-[#181818]">VirusTotal</option>
              <option value="misp" className="bg-[#181818]">MISP</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
