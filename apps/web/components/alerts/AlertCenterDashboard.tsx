"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MetricCard,
  Button,
  Breadcrumbs,
  SeverityBadge,
  Input,
  Select,
} from "@vrsoc/ui";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Server,
  User,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type {
  Alert,
  AlertHistory,
  AlertFilterParams,
  AlertStatus,
  SeverityLevel,
  TelemetryEvent,
} from "@vrsoc/types";
import { AlertStatusBadge } from "./AlertStatusBadge";
import { AlertTriageDrawer } from "./AlertTriageDrawer";
import {
  getAlertsAction,
  getAlertDetailsAction,
  acknowledgeAlertAction,
  getAlertStatsAction,
} from "@/lib/alerts/actions";

interface AlertCenterDashboardProps {
  initialAlerts?: Alert[];
  initialTotalCount?: number;
  initialStats?: {
    totalAlerts: number;
    openCount: number;
    criticalCount: number;
    acknowledgedCount: number;
    inProgressCount: number;
    closedCount: number;
  };
}

export function AlertCenterDashboard({
  initialAlerts = [],
  initialTotalCount = 0,
  initialStats,
}: AlertCenterDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [stats, setStats] = useState(
    initialStats || {
      totalAlerts: initialAlerts.length,
      openCount: initialAlerts.filter((a) => (a.status || "").toLowerCase() === "open")
        .length,
      criticalCount: initialAlerts.filter(
        (a) =>
          (a.severity || "").toLowerCase() === "critical" ||
          (a.severity || "").toLowerCase() === "high"
      ).length,
      acknowledgedCount: initialAlerts.filter(
        (a) => (a.status || "").toLowerCase() === "acknowledged"
      ).length,
      inProgressCount: initialAlerts.filter(
        (a) =>
          (a.status || "").toLowerCase() === "in progress" ||
          (a.status || "").toLowerCase() === "in_progress"
      ).length,
      closedCount: initialAlerts.filter(
        (a) =>
          (a.status || "").toLowerCase() === "closed" ||
          (a.status || "").toLowerCase() === "false positive" ||
          (a.status || "").toLowerCase() === "false_positive"
      ).length,
    }
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [timeRange, setTimeRange] = useState<AlertFilterParams["timeRange"]>("24h");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);

  // Drawer & Inspection State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [matchedEvents, setMatchedEvents] = useState<TelemetryEvent[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: AlertFilterParams = {
        query: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as AlertStatus) : undefined,
        severity: severityFilter !== "ALL" ? (severityFilter as SeverityLevel) : undefined,
        timeRange,
        page: currentPage,
        pageSize,
        sortBy: "occurred_at",
        sortDirection: "desc",
      };

      const [alertsRes, statsRes] = await Promise.all([
        getAlertsAction(filters),
        getAlertStatsAction(),
      ]);

      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data.items);
        setTotalCount(alertsRes.data.totalCount);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, severityFilter, timeRange, currentPage, pageSize]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleOpenAlert = async (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDrawerOpen(true);
    setMatchedEvents([]);
    setAlertHistory([]);

    try {
      const res = await getAlertDetailsAction(alert.id);
      if (res.success && res.data) {
        setMatchedEvents(res.data.matchedEvents);
        setAlertHistory(res.data.history);
      }
    } catch (err) {
      console.error("Failed to inspect alert:", err);
    }
  };

  const handleQuickAcknowledge = async (e: React.MouseEvent, alert: Alert) => {
    e.stopPropagation();
    try {
      const res = await acknowledgeAlertAction({ alertId: alert.id });
      if (res.success && res.data) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? res.data! : a))
        );
        setStats((prev) => ({
          ...prev,
          openCount: Math.max(0, prev.openCount - 1),
          acknowledgedCount: prev.acknowledgedCount + 1,
        }));
      }
    } catch (err) {
      console.error("Quick acknowledge failed:", err);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Alerts & Triage Center", href: "/alerts" },
            ]}
          />
          <h1 className="text-xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Alerts &amp; Triage Center
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Authoritative SOC alert queue, severity classification, and forensic triage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={isLoading}
            className="gap-1.5 border-white/10 hover:border-white/20 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Alerts"
          value={stats.totalAlerts}
          icon={<ShieldAlert className="w-4 h-4 text-neutral-400" />}
        />
        <MetricCard
          label="Open / Unassigned"
          value={stats.openCount}
          icon={<Flame className="w-4 h-4 text-red-400" />}
        />
        <MetricCard
          label="Critical / High"
          value={stats.criticalCount}
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
        />
        <MetricCard
          label="Acknowledged"
          value={stats.acknowledgedCount}
          icon={<CheckCircle2 className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          label="Resolved / Closed"
          value={stats.closedCount}
          icon={<CheckCheck className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 rounded-lg bg-[#141414] border border-white/5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by code, title, MITRE technique, or asset..."
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "Open", label: "Open" },
              { value: "Acknowledged", label: "Acknowledged" },
              { value: "In Progress", label: "In Progress" },
              { value: "Escalated", label: "Escalated" },
              { value: "Closed", label: "Closed" },
              { value: "False Positive", label: "False Positive" },
            ]}
          />
        </div>

        <div className="w-32">
          <Select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "ALL", label: "All Severities" },
              { value: "Critical", label: "Critical" },
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
              { value: "Informational", label: "Informational" },
            ]}
          />
        </div>

        <div className="w-32">
          <Select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value as any);
              setCurrentPage(1);
            }}
            options={[
              { value: "1h", label: "Last 1 hour" },
              { value: "6h", label: "Last 6 hours" },
              { value: "24h", label: "Last 24 hours" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "all", label: "All Time" },
            ]}
          />
        </div>
      </div>

      {/* Alert Queue Table */}
      <div className="rounded-lg border border-white/5 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#161616] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4">Alert Code &amp; Title</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-24">Risk Score</th>
                <th className="py-3 px-4 w-44">Asset / Identity</th>
                <th className="py-3 px-4 w-32">MITRE ATT&amp;CK</th>
                <th className="py-3 px-4 w-28">Occurred</th>
                <th className="py-3 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {isLoading ? "Loading threat alerts..." : "No alerts matching filter criteria."}
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => handleOpenAlert(alert)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    {/* Severity */}
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity as SeverityLevel} />
                    </td>

                    {/* Alert Code & Title */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-neutral-400 text-[11px]">
                          [{alert.alert_code}]
                        </span>
                        <span className="font-semibold text-white truncate">
                          {alert.title}
                        </span>
                      </div>
                      {alert.description && (
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {alert.description}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <AlertStatusBadge status={alert.status} />
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4 font-mono font-bold text-neutral-200">
                      <span
                        className={
                          alert.risk_score >= 80
                            ? "text-red-400"
                            : alert.risk_score >= 50
                            ? "text-amber-400"
                            : "text-blue-400"
                        }
                      >
                        {alert.risk_score}/100
                      </span>
                    </td>

                    {/* Asset & Identity */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-white font-mono truncate">
                        <Server className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate">
                          {alert.asset?.hostname || alert.asset_id || "ws-host"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono truncate">
                        <User className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate">
                          {alert.identity?.username || alert.identity_id || "SYSTEM"}
                        </span>
                      </div>
                    </td>

                    {/* MITRE */}
                    <td className="py-3 px-4">
                      {alert.mitre_technique_id ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-500/20">
                          {alert.mitre_technique_id}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Occurred At */}
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {new Date(alert.occurred_at || alert.triggered_at || "").toLocaleTimeString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status.toLowerCase() === "open" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleQuickAcknowledge(e, alert)}
                            className="h-7 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                            title="Acknowledge alert"
                          >
                            Ack
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAlert(alert)}
                          className="h-7 px-2 text-[11px] text-neutral-300 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Triage
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-[#141414] border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing <strong className="text-white">{alerts.length}</strong> of{" "}
            <strong className="text-white">{totalCount}</strong> alerts
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs border-white/10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-neutral-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs border-white/10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Deep Inspection & Triage Drawer */}
      <AlertTriageDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAlert(null);
        }}
        alert={selectedAlert}
        matchedEvents={matchedEvents}
        history={alertHistory}
        onAlertUpdated={(updated) => {
          setSelectedAlert(updated);
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }}
        onHistoryAdded={(newHist) => {
          setAlertHistory((prev) => [newHist, ...prev]);
        }}
      />
    </div>
  );
}
