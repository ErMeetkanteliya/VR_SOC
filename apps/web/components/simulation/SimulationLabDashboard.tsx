"use client";

import React, { useState } from "react";
import {
  MetricCard,
  Button,
  Breadcrumbs,
  SeverityBadge,
  Input,
  Select,
} from "@vrsoc/ui";
import {
  Play,
  Terminal,
  Clock,
  Layers,
  Database,
  Search,
  Activity,
} from "lucide-react";
import type {
  SimulationScenario,
  SimulationRun,
  TelemetryEvent,
  Asset,
  TelemetryStats,
} from "@vrsoc/types";
import { LaunchScenarioModal } from "./LaunchScenarioModal";
import { SimulationRunProgress } from "./SimulationRunProgress";
import { TelemetryEventsTable } from "./TelemetryEventsTable";
import { getTelemetryEvents, getTelemetryStats } from "@/lib/telemetry/actions";

interface SimulationLabDashboardProps {
  initialScenarios: SimulationScenario[];
  initialRuns: SimulationRun[];
  initialEvents: TelemetryEvent[];
  initialStats: TelemetryStats;
  assets: Asset[];
}

export function SimulationLabDashboard({
  initialScenarios,
  initialRuns: _initialRuns,
  initialEvents,
  initialStats,
  assets,
}: SimulationLabDashboardProps) {
  const [scenarios] = useState<SimulationScenario[]>(initialScenarios);
  const [events, setEvents] = useState<TelemetryEvent[]>(initialEvents);
  const [stats, setStats] = useState<TelemetryStats>(initialStats);
  const [activeRun, setActiveRun] = useState<{ scenario: SimulationScenario; runId: string } | null>(null);

  const [selectedScenarioForModal, setSelectedScenarioForModal] = useState<SimulationScenario | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"catalog" | "events" | "history">("catalog");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filteredScenarios = scenarios.filter((s) => {
    if (categoryFilter !== "ALL" && s.category !== categoryFilter) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.mitre_techniques.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRefreshData = async () => {
    setIsLoadingEvents(true);
    try {
      const [evRes, statsRes] = await Promise.all([
        getTelemetryEvents({ pageSize: 50 }),
        getTelemetryStats(),
      ]);

      if (evRes.success && evRes.data) {
        setEvents(evRes.data.events);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleLaunchSuccess = (runId: string) => {
    if (selectedScenarioForModal) {
      setActiveRun({
        scenario: selectedScenarioForModal,
        runId,
      });
    }
    handleRefreshData();
  };

  return (
    <div className="space-y-6 pb-12" data-hydrated={isHydrated ? "true" : "false"}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "SOAR Orchestration", href: "/soar" },
              { label: "Simulation Lab", href: "/soar/simulation" },
            ]}
          />
          <h1 className="text-2xl font-bold text-white tracking-wide mt-2">
            Cyber Threat Simulation & Telemetry Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Deterministic synthetic attack simulation, multi-stage SOC scenario generation, and canonical telemetry ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            isLoading={isLoadingEvents}
            leftIcon={<Activity className="w-4 h-4 text-emerald-400" />}
          >
            Sync Pipeline
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Available Scenarios"
          value={scenarios.length}
          subtitle="6 canonical attack templates"
          icon={<Layers className="w-5 h-5 text-crimson-400" />}
        />

        <MetricCard
          label="Pipeline Events Ingested"
          value={stats.totalEvents}
          subtitle={`${stats.eventsLastHour} events in past hour`}
          icon={<Database className="w-5 h-5 text-blue-400" />}
        />

        <MetricCard
          label="Raw Syslog Stream"
          value={stats.totalLogs}
          subtitle="Normalized event correlations"
          icon={<Terminal className="w-5 h-5 text-purple-400" />}
        />

        <MetricCard
          label="Active Simulations"
          value={activeRun ? 1 : stats.activeSimulations}
          subtitle={activeRun ? "Simulating active telemetry" : "Ready for scenario execution"}
          icon={<Play className={`w-5 h-5 ${activeRun ? "text-amber-400 animate-pulse" : "text-emerald-400"}`} />}
        />
      </div>

      {/* Active Simulation Progress Card */}
      {activeRun && (
        <SimulationRunProgress
          scenario={activeRun.scenario}
          runId={activeRun.runId}
          onFinished={handleRefreshData}
          onRerun={() => {
            setSelectedScenarioForModal(activeRun.scenario);
          }}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "catalog"
              ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" /> Scenario Catalog ({scenarios.length})
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "events"
              ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Database className="w-4 h-4" /> Telemetry Stream ({events.length})
        </button>
      </div>

      {/* TAB 1: Scenario Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Catalog Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search scenarios by name, MITRE technique, description..."
                className="pl-9 w-full text-xs"
              />
            </div>

            <div className="w-full sm:w-52 shrink-0">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs"
                options={[
                  { value: "ALL", label: "All Categories" },
                  { value: "Authentication Attacks", label: "Authentication Attacks" },
                  { value: "Endpoint Execution", label: "Endpoint Execution" },
                  { value: "Persistence Mechanism", label: "Persistence Mechanism" },
                  { value: "Ransomware & Destruction", label: "Ransomware & Destruction" },
                  { value: "Network Anomalies", label: "Network Anomalies" },
                  { value: "Hardware Additions", label: "Hardware Additions" },
                ]}
              />
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scen) => (
              <div
                key={scen.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-crimson-400 bg-crimson-950/40 px-2 py-0.5 rounded border border-crimson-800/30">
                      {scen.category}
                    </span>
                    <SeverityBadge severity={scen.severity} />
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-crimson-300 transition-colors">
                    {scen.name}
                  </h3>

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                    {scen.description}
                  </p>

                  {/* MITRE Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {scen.mitre_techniques.slice(0, 2).map((tech) => (
                      <span
                        key={tech}
                        className="px-1.5 py-0.5 rounded bg-black/40 text-gray-300 text-[10px] font-mono border border-white/5"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" /> {scen.duration_seconds}s
                    </span>
                    <span>{scen.event_sequence.length} Events</span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSelectedScenarioForModal(scen)}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                  >
                    Launch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Telemetry Stream Table */}
      {activeTab === "events" && (
        <TelemetryEventsTable
          events={events}
          isLoading={isLoadingEvents}
          onRefresh={handleRefreshData}
        />
      )}

      {/* Launch Scenario Modal */}
      <LaunchScenarioModal
        isOpen={Boolean(selectedScenarioForModal)}
        onClose={() => setSelectedScenarioForModal(null)}
        scenario={selectedScenarioForModal}
        assets={assets}
        onSuccess={handleLaunchSuccess}
      />
    </div>
  );
}
