"use client";

import React, { useState, useEffect } from "react";
import {
  MetricCard,
  Button,
  Breadcrumbs,
  SeverityBadge,
  Input,
  Select,
} from "@vrsoc/ui";
import {
  Search,
  Clock,
  Database,
  Terminal,
  Bookmark,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Filter,
} from "lucide-react";
import type {
  TelemetryEvent,
  LogRecord,
  SavedQuery,
  SiemFilterParams,
  SiemTimelineItem,
  SeverityLevel,
} from "@vrsoc/types";
import {
  executeSiemEventsAction,
  executeSiemLogsAction,
  getSiemTimelineAction,
  getSavedQueriesAction,
} from "@/lib/siem/actions";
import { SiemTimeline } from "./SiemTimeline";
import { SiemEventInspector } from "./SiemEventInspector";
import { SavedQueriesModal } from "./SavedQueriesModal";

interface SiemCoreExplorerProps {
  initialEvents?: TelemetryEvent[];
  initialLogs?: LogRecord[];
  initialSavedQueries?: SavedQuery[];
  initialEventCount?: number;
  initialLogCount?: number;
}

export function SiemCoreExplorer({
  initialEvents = [],
  initialLogs = [],
  initialSavedQueries = [],
  initialEventCount = 0,
  initialLogCount = 0,
}: SiemCoreExplorerProps) {
  // State
  const [activeTab, setActiveTab] = useState<"events" | "logs" | "timeline" | "saved">("events");
  const [events, setEvents] = useState<TelemetryEvent[]>(initialEvents);
  const [logs, setLogs] = useState<LogRecord[]>(initialLogs);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(initialSavedQueries);
  const [timelineItems, setTimelineItems] = useState<SiemTimelineItem[]>([]);
  const [totalEventCount, setTotalEventCount] = useState(initialEventCount);
  const [totalLogCount, setTotalLogCount] = useState(initialLogCount);
  const [queryDurationMs, setQueryDurationMs] = useState(14);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<SiemFilterParams["timeRange"]>("24h");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Inspection & Modals
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSavedQueriesModalOpen, setIsSavedQueriesModalOpen] = useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsLoading(true);
    const filters: SiemFilterParams = {
      query: searchQuery || undefined,
      timeRange,
      severity: severityFilter !== "ALL" ? (severityFilter as SeverityLevel) : undefined,
      source: sourceFilter !== "ALL" ? sourceFilter : undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
      pipelineStatus: pipelineStatusFilter !== "ALL" ? (pipelineStatusFilter as any) : undefined,
      page: currentPage,
      pageSize: 25,
    };

    try {
      if (activeTab === "events") {
        const res = await executeSiemEventsAction({ filters });
        if (res.success && res.data) {
          setEvents(res.data.items);
          setTotalEventCount(res.data.totalCount);
          setQueryDurationMs(res.data.durationMs);
        }
      } else if (activeTab === "logs") {
        const res = await executeSiemLogsAction({ filters });
        if (res.success && res.data) {
          setLogs(res.data.items);
          setTotalLogCount(res.data.totalCount);
          setQueryDurationMs(res.data.durationMs);
        }
      } else if (activeTab === "timeline") {
        setIsTimelineLoading(true);
        const res = await getSiemTimelineAction({
          limit: 60,
        });
        if (res.success && res.data) {
          setTimelineItems(res.data);
        }
        setIsTimelineLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, timeRange, severityFilter, sourceFilter, categoryFilter, pipelineStatusFilter, currentPage]);

  const activeFilters: SiemFilterParams = {
    query: searchQuery || undefined,
    timeRange,
    severity: severityFilter !== "ALL" ? (severityFilter as SeverityLevel) : undefined,
    source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    pipelineStatus: pipelineStatusFilter !== "ALL" ? (pipelineStatusFilter as any) : undefined,
    page: currentPage,
    pageSize: 25,
  };

  // Trigger search on tab switch or page change
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    handleRefresh();
  };

  const handleInspectEvent = (ev: TelemetryEvent) => {
    setSelectedEvent(ev);
    setSelectedLog(null);
    setIsInspectorOpen(true);
  };

  const handleInspectLog = (l: LogRecord) => {
    setSelectedLog(l);
    setSelectedEvent(null);
    setIsInspectorOpen(true);
  };

  const handleLoadSavedQuery = (sq: SavedQuery) => {
    if (sq.filters.query !== undefined) setSearchQuery(sq.filters.query);
    if (sq.filters.timeRange !== undefined) setTimeRange(sq.filters.timeRange);
    if (sq.filters.severity !== undefined) setSeverityFilter(sq.filters.severity);
    if (sq.filters.source !== undefined) setSourceFilter(sq.filters.source);
    if (sq.filters.category !== undefined) setCategoryFilter(sq.filters.category);
    if (sq.filters.pipelineStatus !== undefined) setPipelineStatusFilter(sq.filters.pipelineStatus);
    setActiveTab(sq.query_type === "logs" ? "logs" : "events");
    setCurrentPage(1);
  };

  const handleRefreshSavedQueries = async () => {
    const res = await getSavedQueriesAction();
    if (res.success && res.data) {
      setSavedQueries(res.data);
    }
  };

  const totalPages = Math.ceil((activeTab === "events" ? totalEventCount : totalLogCount) / 25) || 1;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: "VRSOC", href: "/dashboard" },
              { label: "SIEM Core", href: "/logs" },
              { label: "Investigation Explorer" },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-crimson-500" />
            SIEM Core Telemetry & Investigation Explorer
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, filter, correlate, and inspect canonical events and logs with deterministic timeline semantics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSavedQueriesModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            Saved Queries ({savedQueries.length})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-crimson-500" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Canonical Events"
          value={totalEventCount.toLocaleString()}
          icon={<Database className="w-5 h-5 text-crimson-500" />}
          change="Occurred_at Indexed"
        />
        <MetricCard
          label="Log Stream Records"
          value={totalLogCount.toLocaleString()}
          icon={<Terminal className="w-5 h-5 text-amber-500" />}
          change="Raw & Parsed"
        />
        <MetricCard
          label="Active Pinned Presets"
          value={savedQueries.filter((q) => q.is_pinned).length.toString()}
          icon={<Bookmark className="w-5 h-5 text-blue-500" />}
          change={`${savedQueries.length} total saved`}
        />
        <MetricCard
          label="Query Latency"
          value={`${queryDurationMs} ms`}
          icon={<Activity className="w-5 h-5 text-emerald-500" />}
          change="Server-Side PostgreSQL"
        />
      </div>

      {/* Primary Search & Time Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-charcoal-900 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event type, source, host, message, or tags..."
              className="pl-10 w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as SiemFilterParams["timeRange"])}
              className="w-full md:w-36 text-xs"
              options={[
                { value: "15m", label: "Last 15m" },
                { value: "30m", label: "Last 30m" },
                { value: "1h", label: "Last 1h" },
                { value: "6h", label: "Last 6h" },
                { value: "12h", label: "Last 12h" },
                { value: "24h", label: "Last 24h" },
                { value: "7d", label: "Last 7d" },
                { value: "30d", label: "Last 30d" },
                { value: "all", label: "All Time" },
              ]}
            />

            <Button type="submit" variant="primary" size="sm" className="text-xs px-4">
              Search
            </Button>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5 text-xs">
          <span className="text-gray-500 flex items-center gap-1 text-[11px] font-semibold">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-32 text-xs"
            options={[
              { value: "ALL", label: "All Severity" },
              { value: "Critical", label: "Critical" },
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
              { value: "Informational", label: "Informational" },
            ]}
          />

          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-36 text-xs"
            options={[
              { value: "ALL", label: "All Sources" },
              { value: "Syslog", label: "Syslog" },
              { value: "Windows Event Log", label: "Windows Event Log" },
              { value: "EDR Agent", label: "EDR Agent" },
              { value: "Suricata", label: "Suricata" },
              { value: "Zeek", label: "Zeek" },
              { value: "Cloud Audit", label: "Cloud Audit" },
              { value: "Active Directory", label: "Active Directory" },
            ]}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-36 text-xs"
            options={[
              { value: "ALL", label: "All Categories" },
              { value: "Authentication", label: "Authentication" },
              { value: "Process", label: "Process" },
              { value: "Network", label: "Network" },
              { value: "File", label: "File" },
              { value: "Hardware", label: "Hardware" },
              { value: "Persistence", label: "Persistence" },
              { value: "Execution", label: "Execution" },
            ]}
          />

          <Select
            value={pipelineStatusFilter}
            onChange={(e) => setPipelineStatusFilter(e.target.value)}
            className="w-32 text-xs"
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "Stored", label: "Stored" },
              { value: "Validated", label: "Validated" },
              { value: "Failed", label: "Failed" },
            ]}
          />
        </div>
      </form>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => { setActiveTab("events"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "events"
                ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Database className="w-4 h-4" /> Events ({totalEventCount})
          </button>

          <button
            onClick={() => { setActiveTab("logs"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Terminal className="w-4 h-4" /> Raw Logs ({totalLogCount})
          </button>

          <button
            onClick={() => { setActiveTab("timeline"); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "timeline"
                ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" /> Chronological Timeline
          </button>
        </div>

        {/* Tab 1: Events Table */}
        {activeTab === "events" && (
          <div className="space-y-3">
            <div className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Occurrence Time (occurred_at)</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Source / Host</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500 font-sans">
                          No events match the specified query parameters.
                        </td>
                      </tr>
                    ) : (
                      events.map((ev) => {
                        const hostname = (ev as any).asset?.hostname || ev.source_host || "—";
                        const username = (ev as any).identity?.username || (ev.normalized_fields as any)?.user || "—";
                        return (
                          <tr
                            key={ev.id}
                            onClick={() => handleInspectEvent(ev)}
                            className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <SeverityBadge severity={ev.severity} />
                            </td>
                            <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                              {new Date(ev.occurred_at).toISOString().replace("T", " ").substring(0, 19)} UTC
                            </td>
                            <td className="py-3 px-4 font-bold text-white group-hover:text-crimson-300 transition-colors">
                              {ev.event_type}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 border border-white/5 font-sans">
                                {ev.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              <span className="text-gray-400">{ev.source}</span>
                              {hostname !== "—" && (
                                <span className="block text-[10px] text-crimson-400">{hostname}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {username !== "—" ? <span className="text-amber-400">{username}</span> : "—"}
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInspectEvent(ev)}
                                className="text-[11px] h-7 px-2.5"
                              >
                                Inspect
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Showing {events.length > 0 ? (currentPage - 1) * 25 + 1 : 0} to{" "}
                  {Math.min(currentPage * 25, totalEventCount)} of {totalEventCount} events
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </Button>
                  <span className="text-[11px] font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-7 text-xs px-2"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Logs Table */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Logged Time</th>
                      <th className="py-3 px-4">Facility / Service</th>
                      <th className="py-3 px-4">Message</th>
                      <th className="py-3 px-4">Parser</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500 font-sans">
                          No log records found.
                        </td>
                      </tr>
                    ) : (
                      logs.map((l) => (
                        <tr
                          key={l.id}
                          onClick={() => handleInspectLog(l)}
                          className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300">
                              {l.log_level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                            {new Date(l.logged_at).toISOString().replace("T", " ").substring(0, 19)} UTC
                          </td>
                          <td className="py-3 px-4 text-gray-200">
                            {l.service_name || l.facility}
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-sans max-w-md truncate">
                            {l.message}
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-[10px]">
                            {l.parser_name || "vrsoc-default"}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInspectLog(l)}
                              className="text-[11px] h-7 px-2.5"
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Showing {logs.length > 0 ? (currentPage - 1) * 25 + 1 : 0} to{" "}
                  {Math.min(currentPage * 25, totalLogCount)} of {totalLogCount} logs
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </Button>
                  <span className="text-[11px] font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-7 text-xs px-2"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Timeline */}
        {activeTab === "timeline" && (
          <div className="bg-charcoal-900 border border-white/10 rounded-xl p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-crimson-400" />
                  Chronological Investigation Sequence
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Ordered strictly by telemetry occurrence timestamp (occurred_at) for accurate forensic analysis.
                </p>
              </div>
            </div>

            <SiemTimeline
              items={timelineItems}
              isLoading={isTimelineLoading}
              onInspectItem={(item) => {
                if (item.rawEvent) handleInspectEvent(item.rawEvent);
                else if (item.rawLog) handleInspectLog(item.rawLog);
              }}
            />
          </div>
        )}
      </div>

      {/* Deep Event / Log Inspector Drawer */}
      <SiemEventInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        event={selectedEvent}
        log={selectedLog}
        onSelectCorrelatedEvent={(ev) => handleInspectEvent(ev)}
      />

      {/* Saved Queries Modal */}
      <SavedQueriesModal
        isOpen={isSavedQueriesModalOpen}
        onClose={() => setIsSavedQueriesModalOpen(false)}
        currentFilters={activeFilters}
        savedQueries={savedQueries}
        onLoadQuery={handleLoadSavedQuery}
        onRefreshQueries={handleRefreshSavedQueries}
      />
    </div>
  );
}
