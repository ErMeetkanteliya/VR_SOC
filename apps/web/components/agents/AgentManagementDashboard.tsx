"use client";

import React, { useState, useEffect } from "react";
import {
  MetricCard,
  StatusBadge,
  Button,
  Input,
  Select,
  DataTable,
  Breadcrumbs,
  type Column,
} from "@vrsoc/ui";
import {
  Server,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  AlertTriangle,
  Monitor,
  Laptop,
  Database,
  SlidersHorizontal,
} from "lucide-react";
import { getAgents, seedFleetDemoData } from "@/lib/agents/actions";
import { AgentDetailDrawer } from "./AgentDetailDrawer";
import { IsolateHostModal } from "./IsolateHostModal";
import { RegisterAgentModal } from "./RegisterAgentModal";
import type {
  AgentWithAsset,
  AgentFleetSummary,
  AssetGroup,
  OSType,
} from "@vrsoc/types";

interface AgentManagementDashboardProps {
  initialAgents: AgentWithAsset[];
  initialSummary: AgentFleetSummary;
  initialAssetGroups: AssetGroup[];
  totalCount: number;
}

export function AgentManagementDashboard({
  initialAgents,
  initialSummary,
  initialAssetGroups,
}: AgentManagementDashboardProps) {
  const [agents, setAgents] = useState<AgentWithAsset[]>(initialAgents);
  const [summary, setSummary] = useState<AgentFleetSummary>(initialSummary);
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>(initialAssetGroups);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [osFilter, setOsFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals & Drawers state
  const [selectedAgent, setSelectedAgent] = useState<AgentWithAsset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isolateModalOpen, setIsolateModalOpen] = useState(false);
  const [agentToIsolate, setAgentToIsolate] = useState<AgentWithAsset | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [successToast]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAgents({
        search,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        osType: osFilter !== "ALL" ? osFilter : undefined,
        assetGroupId: groupFilter !== "ALL" ? groupFilter : undefined,
        page: 1,
        pageSize: 50,
      });

      if (res.success && res.data) {
        setAgents(res.data.agents);
        setSummary(res.data.summary);
        setAssetGroups(res.data.assetGroups);

        // Keep selected agent in sync if open in drawer
        if (selectedAgent) {
          const updated = res.data.agents.find((a) => a.id === selectedAgent.id);
          if (updated) setSelectedAgent(updated);
        }
      } else {
        setErrorMessage(res.error || "Failed to retrieve agent fleet data.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const prevFilters = React.useRef({ search, statusFilter, osFilter, groupFilter });

  // Re-fetch only when filters actually change
  useEffect(() => {
    if (
      prevFilters.current.search === search &&
      prevFilters.current.statusFilter === statusFilter &&
      prevFilters.current.osFilter === osFilter &&
      prevFilters.current.groupFilter === groupFilter
    ) {
      return;
    }
    prevFilters.current = { search, statusFilter, osFilter, groupFilter };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, osFilter, groupFilter]);

  const handleSeedFleet = async () => {
    setSeeding(true);
    setErrorMessage(null);
    const res = await seedFleetDemoData();
    setSeeding(false);

    if (res.success) {
      setSuccessToast(`Successfully seeded Base44 demo fleet with realistic endpoints.`);
      loadData();
    } else {
      setErrorMessage(res.error || "Failed to seed demo fleet.");
    }
  };

  const handleOpenDetail = (agent: AgentWithAsset) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };

  const handleOpenIsolate = (agent: AgentWithAsset) => {
    setAgentToIsolate(agent);
    setIsolateModalOpen(true);
  };

  const handleIsolateSuccess = (isIsolated: boolean) => {
    setSuccessToast(
      isIsolated
        ? "Endpoint successfully isolated from network routing."
        : "Endpoint released from isolation."
    );
    loadData();
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const now = new Date();
    const past = new Date(dateStr);
    const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSeconds < 10) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMins = Math.floor(diffSeconds / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString();
  };

  const getOsIcon = (osType?: OSType) => {
    switch (osType) {
      case "Windows":
        return <Monitor className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case "Linux":
        return <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "macOS":
        return <Laptop className="w-3.5 h-3.5 text-gray-300 shrink-0" />;
      default:
        return <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
  };

  const columns: Column<AgentWithAsset>[] = [
    {
      key: "endpoint",
      header: "Endpoint & Hostname",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
            {getOsIcon(row.asset?.os_type)}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white font-mono text-xs hover:text-crimson-300 transition-colors">
                {row.asset?.hostname}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                {row.asset?.asset_type}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              {row.asset?.display_name || row.asset?.os_version || "Enterprise Endpoint"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "IP & MAC",
      render: (row) => (
        <div>
          <span className="font-mono text-xs text-crimson-300 block">{row.asset?.ip_address || "—"}</span>
          <span className="font-mono text-[10px] text-gray-500">{row.asset?.mac_address || "—"}</span>
        </div>
      ),
    },
    {
      key: "group",
      header: "Group & Tier",
      render: (row) => (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-gray-200 block truncate max-w-[140px]">
            {row.asset?.group?.name || "Unassigned"}
          </span>
          <span
            className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              row.asset?.criticality === "Critical"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : row.asset?.criticality === "High"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}
          >
            {row.asset?.criticality}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Sensor Status",
      render: (row) => (
        <StatusBadge status={row.status} pulse={row.status === "Online"} />
      ),
    },
    {
      key: "metrics",
      header: "Load (CPU/RAM/Disk)",
      render: (row) => (
        <div className="space-y-1 w-32">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>CPU {row.cpu_usage_pct || 0}%</span>
            <span>RAM {row.ram_usage_pct || 0}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
            <div
              className={`h-full ${
                Number(row.cpu_usage_pct || 0) > 80 ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, Number(row.cpu_usage_pct || 0)))}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "containment",
      header: "Network State",
      render: (row) =>
        row.asset?.is_isolated ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            ISOLATED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            Connected
          </span>
        ),
    },
    {
      key: "last_seen",
      header: "Last Seen",
      render: (row) => (
        <div className="text-right">
          <span className="text-xs text-gray-300 font-mono block">
            {formatRelativeTime(row.last_seen_at)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">v{row.agent_version}</span>
        </div>
      ),
      align: "right",
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenDetail(row)}
            className="text-gray-300 hover:text-white"
          >
            Details
          </Button>
          <Button
            size="sm"
            variant={row.asset?.is_isolated ? "outline" : "destructive"}
            onClick={() => handleOpenIsolate(row)}
          >
            {row.asset?.is_isolated ? "Release" : "Isolate"}
          </Button>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Confirmation Banner */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Core SOC", href: "/agents" },
              { label: "Endpoint Agents", href: "/agents" },
            ]}
          />
          <h1 className="text-2xl font-bold text-white tracking-wide mt-2">
            Endpoint Fleet & Sensor Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Enterprise EDR sensors, telemetry health monitoring, and network isolation containment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4 text-gray-400" />}
          >
            Refresh Fleet
          </Button>

          {agents.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedFleet}
              isLoading={seeding}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
            >
              Seed Base44 Fleet
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setRegisterModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Enroll Agent
          </Button>
        </div>
      </div>

      {/* Metric Cards KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Fleet Agents"
          value={summary.totalAgents}
          subtitle={`${summary.onlineAgents} active sensors`}
          icon={<Server className="w-5 h-5 text-crimson-400" />}
        />

        <MetricCard
          label="Online Sensors"
          value={summary.onlineAgents}
          subtitle={`${summary.totalAgents > 0 ? Math.round((summary.onlineAgents / summary.totalAgents) * 100) : 0}% fleet online`}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        />

        <MetricCard
          label="Network Isolated"
          value={summary.isolatedAgents}
          subtitle={summary.isolatedAgents > 0 ? "Contained threat targets" : "0 hosts isolated"}
          icon={<ShieldAlert className={`w-5 h-5 ${summary.isolatedAgents > 0 ? "text-red-400 animate-pulse" : "text-gray-400"}`} />}
        />

        <MetricCard
          label="Fleet Avg CPU / RAM"
          value={`${summary.avgCpuUsagePct}% / ${summary.avgRamUsagePct}%`}
          subtitle={`Disk usage avg ${summary.avgDiskUsagePct}%`}
          icon={<Cpu className="w-5 h-5 text-blue-400" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hostname, IP address, OS, or version..."
              className="pl-9 w-full text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-44 shrink-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs"
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "Online", label: "Online Only" },
                { value: "Warning", label: "Warning" },
                { value: "Offline", label: "Offline" },
                { value: "Updating", label: "Updating" },
                { value: "Error", label: "Error / Critical" },
                { value: "Pending", label: "Pending" },
              ]}
            />
          </div>

          {/* OS Filter */}
          <div className="w-full lg:w-36 shrink-0">
            <Select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="w-full text-xs"
              options={[
                { value: "ALL", label: "All Platforms" },
                { value: "Windows", label: "Windows" },
                { value: "Linux", label: "Linux" },
                { value: "macOS", label: "macOS" },
              ]}
            />
          </div>

          {/* Group Filter */}
          <div className="w-full lg:w-44 shrink-0">
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full text-xs"
              options={[
                { value: "ALL", label: "All Asset Groups" },
                ...assetGroups.map((g) => ({
                  value: g.id,
                  label: g.name,
                })),
              ]}
            />
          </div>
        </div>

        {/* Status Pill Filters for Quick Access */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          <span className="text-[11px] text-gray-400 font-medium shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Quick Filter:
          </span>

          {[
            { id: "ALL", label: "All", count: summary.totalAgents },
            { id: "Online", label: "Online", count: summary.onlineAgents },
            { id: "Offline", label: "Offline", count: summary.offlineAgents },
            { id: "Updating", label: "Updating", count: summary.updatingAgents },
            { id: "Error", label: "Error", count: summary.errorAgents },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === item.id
                  ? "bg-crimson-600 text-white font-semibold shadow-md shadow-crimson-900/40"
                  : "bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-gray-300">
                {item.count}
              </span>
            </button>
          ))}

          {(search || statusFilter !== "ALL" || osFilter !== "ALL" || groupFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setOsFilter("ALL");
                setGroupFilter("ALL");
              }}
              className="text-xs text-crimson-400 hover:text-crimson-300 ml-auto shrink-0 underline decoration-crimson-500/50"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Agents Data Table */}
      <DataTable
        columns={columns}
        data={agents}
        isLoading={isLoading}
        onRowClick={handleOpenDetail}
        emptyTitle="No Endpoint Agents Found"
        emptyDescription={
          search || statusFilter !== "ALL"
            ? "No agents match your current search and filter criteria."
            : "No endpoint agents enrolled in this organization yet."
        }
      />

      {/* Modals & Drawers */}
      <AgentDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        agent={selectedAgent}
        assetGroups={assetGroups}
        onOpenIsolateModal={handleOpenIsolate}
        onRefresh={loadData}
      />

      <IsolateHostModal
        isOpen={isolateModalOpen}
        onClose={() => setIsolateModalOpen(false)}
        agent={agentToIsolate}
        onSuccess={handleIsolateSuccess}
      />

      <RegisterAgentModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        assetGroups={assetGroups}
        onSuccess={() => {
          setSuccessToast("New simulated endpoint agent enrolled successfully.");
          loadData();
        }}
      />
    </div>
  );
}
