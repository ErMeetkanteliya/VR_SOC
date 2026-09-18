"use client";

import React, { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@vrsoc/ui";

import type { XdrCorrelationResult, XdrInvestigationPackage } from "@vrsoc/types";
import { XdrOverviewCards } from "./XdrOverviewCards";
import { XdrSourceMatrix } from "./XdrSourceMatrix";
import { XdrCorrelationList } from "./XdrCorrelationList";
import { XdrInvestigationDetail } from "./XdrInvestigationDetail";
import { SimulateXdrModal } from "./SimulateXdrModal";
import { getXdrCorrelationsAction, getXdrInvestigationPackageAction } from "@/lib/xdr/actions";

interface XdrInvestigationWorkbenchProps {
  initialCorrelations: XdrCorrelationResult[];
  initialPackage: XdrInvestigationPackage;
}

export function XdrInvestigationWorkbench({
  initialCorrelations,
  initialPackage,
}: XdrInvestigationWorkbenchProps) {
  const [correlations, setCorrelations] = useState<XdrCorrelationResult[]>(initialCorrelations);
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string>(
    initialPackage.correlation.id || initialCorrelations[0]?.id || ""
  );
  const [activePackage, setActivePackage] = useState<XdrInvestigationPackage>(initialPackage);
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("ALL");
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // When selection changes, fetch deep investigation package
  const handleSelectCorrelation = async (corrId: string) => {
    setSelectedCorrelationId(corrId);
    setIsLoading(true);
    try {
      const res = await getXdrInvestigationPackageAction({
        correlationId: corrId,
      });
      if (res.success && res.data) {
        setActivePackage(res.data);
      }
    } catch (err) {
      console.error("Failed to load investigation package:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const res = await getXdrCorrelationsAction();
      if (res.success && res.data) {
        setCorrelations(res.data);
        if (res.data.length > 0 && (!selectedCorrelationId || !res.data.some((c) => c.id === selectedCorrelationId))) {
          handleSelectCorrelation(res.data[0]!.id);
        }
      }
    } catch (err) {
      console.error("Failed to refresh correlations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              Phase 18 — Multi-Domain XDR
            </span>
            <span className="text-[11px] font-mono text-white/40">Canonical Telemetry Correlation</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            XDR Multi-Source Investigation
          </h1>
          <p className="text-xs text-white/60">
            Deterministic correlation across Endpoint, Identity, Email, DNS, Cloud, Network, Firewall, and Auth
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={refreshData}
            disabled={isLoading}
            className="text-xs text-white/70 hover:text-white border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsSimulateModalOpen(true)}
            className="text-xs bg-[#5B0A0A] hover:bg-[#720E0E] text-white border border-[#E53935]/40 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-red-300" />
            <span>Simulate Multi-Source Attack</span>
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <XdrOverviewCards correlations={correlations} activePackage={activePackage} />

      {/* Multi-Source Telemetry Matrix */}
      <XdrSourceMatrix activeCorrelation={activePackage.correlation} />

      {/* Main Workspace Layout (2-Column: Correlation List & Investigation Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Correlation List (4 Cols) */}
        <div className="lg:col-span-4">
          <XdrCorrelationList
            correlations={correlations}
            selectedCorrelationId={selectedCorrelationId}
            onSelectCorrelation={handleSelectCorrelation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            relationshipFilter={relationshipFilter}
            onRelationshipFilterChange={setRelationshipFilter}
          />
        </div>

        {/* Right Column: Deep Investigation Detail (8 Cols) */}
        <div className="lg:col-span-8">
          <XdrInvestigationDetail investigation={activePackage} />
        </div>
      </div>

      {/* Simulate Modal */}
      <SimulateXdrModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
