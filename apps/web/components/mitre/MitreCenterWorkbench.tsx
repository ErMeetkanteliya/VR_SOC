"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  LayoutGrid,
  List,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { MitreOverviewKpis } from "./MitreOverviewKpis";
import { MitreTacticsBar } from "./MitreTacticsBar";
import { MitreMatrixView } from "./MitreMatrixView";
import { MitreTechniqueDrawer } from "./MitreTechniqueDrawer";
import type {
  MitreTactic,
  MitreTechnique,
  MitreTechniqueDetail,
  MitreCoverageStats,
  DetectionRule,
} from "@vrsoc/types";

interface MitreCenterWorkbenchProps {
  initialTactics: MitreTactic[];
  initialTechniques: MitreTechnique[];
  initialStats: MitreCoverageStats;
  initialRules: DetectionRule[];
  organizationId?: string;
}

export const MitreCenterWorkbench: React.FC<MitreCenterWorkbenchProps> = ({
  initialTactics = [],
  initialTechniques = [],
  initialStats,
  initialRules = [],
}) => {
  const [tactics] = useState<MitreTactic[]>(initialTactics || []);
  const [techniques] = useState<MitreTechnique[]>(initialTechniques || []);
  const [stats] = useState<MitreCoverageStats>(initialStats);
  const [rules] = useState<DetectionRule[]>(initialRules || []);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTacticId, setSelectedTacticId] = useState<string>("ALL");
  const [selectedCoverageStatus, setSelectedCoverageStatus] = useState<"all" | "covered" | "uncovered">("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");

  // Selected Technique for Drawer
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechniqueDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Set of covered technique IDs (from active rules and child sub-techniques)
  const coveredTechniqueIds = useMemo(() => {
    const set = new Set<string>();
    for (const rule of rules || []) {
      if (rule.mitre_technique_id && rule.is_enabled) {
        set.add(rule.mitre_technique_id.trim().toUpperCase());
      }
    }
    for (const tech of techniques || []) {
      if (tech.is_subtechnique && set.has(tech.external_id.toUpperCase())) {
        if (tech.parent_technique_id) {
          set.add(tech.parent_technique_id.toUpperCase());
        }
      }
    }
    return set;
  }, [rules, techniques]);

  // Filtered Techniques
  const filteredTechniques = useMemo(() => {
    const list = techniques || [];
    const directMatches = new Set<string>();

    const matchesDirect = (tech: MitreTechnique) => {
      // 1. Tactic Filter
      if (selectedTacticId !== "ALL" && tech.tactic_external_id !== selectedTacticId) {
        return false;
      }

      // 2. Platform Filter
      if (selectedPlatform !== "ALL" && !(tech.platforms || []).includes(selectedPlatform)) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          tech.external_id.toLowerCase().includes(q) ||
          tech.name.toLowerCase().includes(q) ||
          tech.description.toLowerCase().includes(q) ||
          tech.tactic_name.toLowerCase().includes(q) ||
          (tech.data_sources || []).some((ds) => ds.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 4. Coverage Filter
      if (selectedCoverageStatus !== "all") {
        const isCovered = coveredTechniqueIds.has(tech.external_id.toUpperCase());
        if (selectedCoverageStatus === "covered" && !isCovered) return false;
        if (selectedCoverageStatus === "uncovered" && isCovered) return false;
      }

      return true;
    };

    // Find direct matches
    for (const tech of list) {
      if (matchesDirect(tech)) {
        directMatches.add(tech.external_id.toUpperCase());
      }
    }

    // Include parent techniques if any child matches
    return list.filter((tech) => {
      const extUpper = tech.external_id.toUpperCase();
      if (directMatches.has(extUpper)) return true;

      // If this is a parent technique, check if any of its sub-techniques directly matched
      if (!tech.is_subtechnique) {
        const hasMatchingChild = list.some(
          (sub) =>
            sub.is_subtechnique &&
            sub.parent_technique_id?.toUpperCase() === extUpper &&
            directMatches.has(sub.external_id.toUpperCase())
        );
        if (hasMatchingChild) return true;
      }

      return false;
    });
  }, [techniques, selectedTacticId, selectedPlatform, searchQuery, selectedCoverageStatus, coveredTechniqueIds]);

  // Handle clicking a technique to open drawer
  const handleSelectTechnique = (tech: MitreTechnique) => {
    if (!tech) return;
    const extIdUpper = (tech.external_id || "").toUpperCase();
    const subTechs = (techniques || []).filter(
      (s) => s.is_subtechnique && s.parent_technique_id?.toUpperCase() === extIdUpper
    );
    const mappedRules = (rules || []).filter(
      (r) =>
        r.mitre_technique_id?.trim().toUpperCase() === extIdUpper ||
        subTechs.some((sub) => sub.external_id.toUpperCase() === r.mitre_technique_id?.trim().toUpperCase())
    );

    const detail: MitreTechniqueDetail = {
      ...tech,
      platforms: tech.platforms || [],
      data_sources: tech.data_sources || [],
      examples: tech.examples || [],
      mitigations: tech.mitigations || [],
      sub_techniques: subTechs,
      mapped_detection_rules: mappedRules,
      coverage_status: mappedRules.length > 0 ? "covered" : "uncovered",
      mapped_rules_count: mappedRules.length,
    };

    setSelectedTechnique(detail);
    setIsDrawerOpen(true);
  };

  // Filtered tactics (if tactic filter selected, show only that tactic column in matrix view)
  const displayedTactics = useMemo(() => {
    if (selectedTacticId === "ALL") return tactics;
    return tactics.filter((t) => t.external_id === selectedTacticId);
  }, [tactics, selectedTacticId]);

  return (
    <div className="flex flex-col gap-6 max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MITRE ATT&CK® Enterprise Matrix
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              v14.1 Enterprise
            </span>
          </div>
          <p className="text-sm text-white/50 mt-1">
            Canonical threat intelligence entity catalog, detection rule coverage heatmaps, and forensic mitigations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-[#161616] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode("matrix")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "matrix"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Matrix Column View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
              title="Table Search View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search List</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview KPI Cards */}
      <MitreOverviewKpis stats={stats} />

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#141414] p-3.5 rounded-xl border border-white/5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID (e.g. T1059), Technique name, Tactic, or Data Source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181818] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Coverage Filter */}
          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedCoverageStatus}
              onChange={(e) => setSelectedCoverageStatus(e.target.value as "all" | "covered" | "uncovered")}
              className="bg-transparent text-xs text-white/90 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181818]">All Coverage</option>
              <option value="covered" className="bg-[#181818]">Covered Only</option>
              <option value="uncovered" className="bg-[#181818]">Gaps Only (Uncovered)</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-transparent text-xs text-white/90 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#181818]">All Platforms</option>
              <option value="Windows" className="bg-[#181818]">Windows</option>
              <option value="Linux" className="bg-[#181818]">Linux</option>
              <option value="macOS" className="bg-[#181818]">macOS</option>
              <option value="Cloud" className="bg-[#181818]">Cloud</option>
              <option value="Network" className="bg-[#181818]">Network</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(selectedTacticId !== "ALL" || selectedCoverageStatus !== "all" || selectedPlatform !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTacticId("ALL");
                setSelectedCoverageStatus("all");
                setSelectedPlatform("ALL");
                setSearchQuery("");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Horizontal Tactics Selector Bar */}
      <MitreTacticsBar
        tactics={tactics}
        stats={stats}
        selectedTacticId={selectedTacticId}
        onSelectTactic={(tId) => setSelectedTacticId(tId)}
      />

      {/* 5. Main Content Area (Matrix View vs List View) */}
      {viewMode === "matrix" ? (
        <MitreMatrixView
          tactics={displayedTactics}
          techniques={filteredTechniques}
          stats={stats}
          coveredTechniqueIds={coveredTechniqueIds}
          onSelectTechnique={handleSelectTechnique}
          selectedTechniqueId={selectedTechnique?.external_id}
        />
      ) : (
        /* Searchable Table View */
        <div className="rounded-xl bg-[#141414] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181818] text-white/50 uppercase tracking-wider font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">MITRE ID</th>
                  <th className="py-3.5 px-4">Technique Name</th>
                  <th className="py-3.5 px-4">Tactic</th>
                  <th className="py-3.5 px-4">Platforms</th>
                  <th className="py-3.5 px-4">Detection Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredTechniques.map((tech) => {
                  const isCovered = coveredTechniqueIds.has(tech.external_id.toUpperCase());

                  return (
                    <tr
                      key={tech.id}
                      onClick={() => handleSelectTechnique(tech)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-red-400 group-hover:text-red-300">
                        {tech.external_id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {tech.name}
                        {tech.is_subtechnique && (
                          <span className="ml-2 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Sub-technique
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        {tech.tactic_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {tech.platforms.map((p) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isCovered ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Active Rule</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 text-white/40">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80" />
                            <span>Uncovered Gap</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs text-red-400 group-hover:text-red-300 inline-flex items-center gap-1 font-medium">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredTechniques.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-white/40 italic">
                      No MITRE ATT&CK techniques match the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Technique Slide-Out Forensic Drawer */}
      <MitreTechniqueDrawer
        technique={selectedTechnique}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectSubTechnique={(sub) => handleSelectTechnique(sub)}
      />
    </div>
  );
};
