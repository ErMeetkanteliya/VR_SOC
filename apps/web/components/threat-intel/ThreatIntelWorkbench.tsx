"use client";

import React, { useState, useMemo } from "react";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { IocOverviewKpis } from "./IocOverviewKpis";
import { IocFilterBar } from "./IocFilterBar";
import { IocTable } from "./IocTable";
import { IocDetailDrawer } from "./IocDetailDrawer";
import { CreateIocModal } from "./CreateIocModal";
import { createThreatIndicatorAction, fetchThreatIndicatorDetailAction } from "@/lib/threat-intel/actions";
import type {
  ThreatIndicator,
  ThreatIndicatorDetail,
  IocOverviewStats,
  IocType,
  IocSeverity,
  IocStatus,
  CreateIocInput,
} from "@vrsoc/types";

import { CANONICAL_IOC_RELATIONSHIPS } from "@/lib/threat-intel/catalog";
import { normalizeIoc } from "@/lib/threat-intel/normalization";

interface ThreatIntelWorkbenchProps {
  initialIndicators: ThreatIndicator[];
  initialTotal?: number;
  initialStats: IocOverviewStats;
  organizationId?: string;
}

export const ThreatIntelWorkbench: React.FC<ThreatIntelWorkbenchProps> = ({
  initialIndicators = [],
  initialStats,
}) => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>(initialIndicators);
  const [stats, setStats] = useState<IocOverviewStats>(initialStats);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Selected IOC for Forensic Drawer
  const [selectedDetail, setSelectedDetail] = useState<ThreatIndicatorDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<IocType | "all">("all");
  const [selectedSeverity, setSelectedSeverity] = useState<IocSeverity | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IocStatus | "all">("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // RBAC permissions check (default true for analyst UI, verified server-side)
  const canCreate = true;

  // Client-side filtering across the loaded dataset
  const filteredIndicators = useMemo(() => {
    return (indicators || []).filter((ioc) => {
      // 1. Type Filter
      if (selectedType !== "all" && ioc.ioc_type !== selectedType) {
        return false;
      }

      // 2. Severity Filter
      if (selectedSeverity !== "all" && ioc.severity !== selectedSeverity) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== "all" && ioc.status !== selectedStatus) {
        return false;
      }

      // 4. Source Filter
      if (selectedSource !== "all" && ioc.source !== selectedSource) {
        return false;
      }

      // 5. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          ioc.normalized_value.toLowerCase().includes(q) ||
          ioc.raw_value.toLowerCase().includes(q) ||
          ioc.description.toLowerCase().includes(q) ||
          (ioc.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (ioc.threat_types || []).some((tt) => tt.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [indicators, selectedType, selectedSeverity, selectedStatus, selectedSource, searchQuery]);

  // Paginated View
  const paginatedIndicators = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredIndicators.slice(from, from + pageSize);
  }, [filteredIndicators, page, pageSize]);

  const totalPages = Math.ceil(filteredIndicators.length / pageSize) || 1;

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedSeverity("all");
    setSelectedStatus("all");
    setSelectedSource("all");
    setPage(1);
  };

  // Select Indicator to inspect in slide-out drawer
  const handleSelectIndicator = async (ioc: ThreatIndicator) => {
    try {
      const res = await fetchThreatIndicatorDetailAction(ioc.id);
      if (res.success && res.data) {
        setSelectedDetail(res.data);
      } else {
        const rels = CANONICAL_IOC_RELATIONSHIPS.filter((r) => r.ioc_id === ioc.id);
        setSelectedDetail({
          ...ioc,
          relationships: rels,
          relationships_count: {
            events: rels.filter((r) => r.target_type === "event").length,
            alerts: rels.filter((r) => r.target_type === "alert" || r.target_type === "incident").length,
            incidents: rels.filter((r) => r.target_type === "incident").length,
            cases: rels.filter((r) => r.target_type === "case").length,
            assets: rels.filter((r) => r.target_type === "asset").length,
            malware: rels.filter((r) => r.target_type === "malware").length,
          },
        });
      }
    } catch {
      const rels = CANONICAL_IOC_RELATIONSHIPS.filter((r) => r.ioc_id === ioc.id);
      setSelectedDetail({
        ...ioc,
        relationships: rels,
        relationships_count: {
          events: rels.filter((r) => r.target_type === "event").length,
          alerts: rels.filter((r) => r.target_type === "alert" || r.target_type === "incident").length,
          incidents: rels.filter((r) => r.target_type === "incident").length,
          cases: rels.filter((r) => r.target_type === "case").length,
          assets: rels.filter((r) => r.target_type === "asset").length,
          malware: rels.filter((r) => r.target_type === "malware").length,
        },
      });
    } finally {
      setIsDrawerOpen(true);
    }
  };

  // Handle Creating New Indicator
  const handleCreateIndicator = async (input: CreateIocInput): Promise<boolean> => {
    try {
      const res = await createThreatIndicatorAction(input);
      if (res.success && res.data) {
        const newIoc = res.data;
        setIndicators((prev) => [newIoc, ...prev]);
        setStats((prev) => ({
          ...prev,
          total_iocs: (prev?.total_iocs ?? 0) + 1,
          active_iocs: (prev?.active_iocs ?? 0) + 1,
          critical_high_count:
            newIoc.severity === "critical" || newIoc.severity === "high"
              ? (prev?.critical_high_count ?? 0) + 1
              : (prev?.critical_high_count ?? 0),
          by_type: {
            ...prev?.by_type,
            [newIoc.ioc_type]: ((prev?.by_type as Record<string, number>)?.[newIoc.ioc_type] ?? 0) + 1,
          },
          by_severity: {
            ...prev?.by_severity,
            [newIoc.severity]: ((prev?.by_severity as Record<string, number>)?.[newIoc.severity] ?? 0) + 1,
          },
          by_status: {
            ...prev?.by_status,
            [newIoc.status]: ((prev?.by_status as Record<string, number>)?.[newIoc.status] ?? 0) + 1,
          },
        }));
        return true;
      }
    } catch {
      // Local fallback
    }

    const norm = normalizeIoc(input.ioc_type, input.value);
    const newIoc: ThreatIndicator = {
      id: `ioc-custom-${Date.now()}`,
      organization_id: "00000000-0000-0000-0000-000000000001",
      ioc_type: input.ioc_type,
      normalized_value: norm.isValid ? norm.normalizedValue : input.value,
      raw_value: input.value,
      confidence: input.confidence ?? 80,
      severity: input.severity ?? "high",
      threat_types: input.threat_types ?? [],
      source: "manual",
      tags: input.tags ?? [],
      description: input.description ?? "",
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      status: input.status ?? "active",
      is_global: false,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIndicators((prev) => [newIoc, ...prev]);
    return true;
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Threat Intelligence & IOC Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/5 text-white/60 border border-white/10">
              STIX/TAXII Aligned
            </span>
          </div>
          <p className="text-xs text-white/50">
            Canonical threat observables, normalized indicator repository, and telemetry correlation graph.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <IocOverviewKpis stats={stats} />

      {/* 3. Filter & Action Controls */}
      <IocFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        selectedType={selectedType}
        onTypeChange={(t) => {
          setSelectedType(t);
          setPage(1);
        }}
        selectedSeverity={selectedSeverity}
        onSeverityChange={(s) => {
          setSelectedSeverity(s);
          setPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(st) => {
          setSelectedStatus(st);
          setPage(1);
        }}
        selectedSource={selectedSource}
        onSourceChange={(src) => {
          setSelectedSource(src);
          setPage(1);
        }}
        onResetFilters={handleResetFilters}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        canCreate={canCreate}
      />

      {/* 4. Threat Indicator Data Table */}
      <IocTable
        indicators={paginatedIndicators}
        onSelectIndicator={handleSelectIndicator}
        selectedId={selectedDetail?.id}
      />

      {/* 5. Pagination Controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-white/40">
          Showing {(page - 1) * pageSize + (paginatedIndicators.length > 0 ? 1 : 0)}–
          {(page - 1) * pageSize + paginatedIndicators.length} of {filteredIndicators.length} indicators
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-[#141414] border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/70 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg bg-[#141414] border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6. Slide-Out Detail Drawer */}
      <IocDetailDrawer
        indicator={selectedDetail}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* 7. Create Indicator Modal */}
      <CreateIocModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateIndicator}
      />
    </div>
  );
};
