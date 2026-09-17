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
  Database,
  Terminal,
  Search,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  AlertCircle,
} from "lucide-react";
import type {
  TelemetryEvent,
  LogRecord,
  IngestionMetrics,
} from "@vrsoc/types";
import {
  getPipelineEvents,
  getPipelineLogs,
  getPipelineMetrics,
} from "@/lib/pipeline/actions";

interface LogEventExplorerProps {
  initialEvents: TelemetryEvent[];
  initialLogs: LogRecord[];
  initialMetrics: IngestionMetrics;
  initialEventCount: number;
  initialLogCount: number;
}

export function LogEventExplorer({
  initialEvents,
  initialLogs,
  initialMetrics,
  initialEventCount,
  initialLogCount,
}: LogEventExplorerProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>(initialEvents);
  const [logs, setLogs] = useState<LogRecord[]>(initialLogs);
  const [metrics, setMetrics] = useState<IngestionMetrics>(initialMetrics);
  const [eventCount, setEventCount] = useState(initialEventCount);
  const [logCount, setLogCount] = useState(initialLogCount);

  const [activeTab, setActiveTab] = useState<"events" | "logs">("events");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [logLevelFilter, setLogLevelFilter] = useState("ALL");
  const [parseStatusFilter, setParseStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [evRes, logRes, metRes] = await Promise.all([
        getPipelineEvents({
          severity: severityFilter !== "ALL" ? severityFilter : undefined,
          source: sourceFilter !== "ALL" ? sourceFilter : undefined,
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
          search: search || undefined,
          page: currentPage,
          pageSize: 25,
        }),
        getPipelineLogs({
          logLevel: logLevelFilter !== "ALL" ? logLevelFilter : undefined,
          parseStatus: parseStatusFilter !== "ALL" ? parseStatusFilter : undefined,
          search: search || undefined,
          page: currentPage,
          pageSize: 25,
        }),
        getPipelineMetrics(),
      ]);

      if (evRes.success && evRes.data) {
        setEvents(evRes.data.events);
        setEventCount(evRes.data.totalCount);
      }
      if (logRes.success && logRes.data) {
        setLogs(logRes.data.logs);
        setLogCount(logRes.data.totalCount);
      }
      if (metRes.success && metRes.data) {
        setMetrics(metRes.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    handleRefresh();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    handleRefresh();
  };

  const totalPages = Math.ceil(
    (activeTab === "events" ? eventCount : logCount) / 25
  );

  return (
    <div className="space-y-6 pb-12" data-hydrated={isHydrated ? "true" : "false"}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Log Explorer", href: "/logs" },
            ]}
          />
          <h1 className="text-2xl font-bold text-white tracking-wide mt-2">
            Log &amp; Event Pipeline Explorer
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Normalized telemetry events and raw log stream ingestion pipeline.
            Phase 13 verification surface.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4 text-emerald-400" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Pipeline Events"
          value={metrics.totalProcessed}
          subtitle={`${metrics.totalSucceeded} stored, ${metrics.totalFailed} failed`}
          icon={<Database className="w-5 h-5 text-blue-400" />}
        />
        <MetricCard
          label="Log Records"
          value={logCount}
          subtitle="Parsed and indexed"
          icon={<Terminal className="w-5 h-5 text-purple-400" />}
        />
        <MetricCard
          label="Source Types"
          value={Object.keys(metrics.sourceDistribution).length}
          subtitle="Distinct telemetry sources"
          icon={<Layers className="w-5 h-5 text-amber-400" />}
        />
        <MetricCard
          label="Last Ingested"
          value={
            metrics.lastProcessedAt
              ? new Date(metrics.lastProcessedAt).toLocaleTimeString()
              : "—"
          }
          subtitle={
            metrics.lastProcessedAt
              ? new Date(metrics.lastProcessedAt).toLocaleDateString()
              : "No events yet"
          }
          icon={<Clock className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => { setActiveTab("events"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "events"
              ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Database className="w-4 h-4" /> Events ({eventCount})
        </button>

        <button
          onClick={() => { setActiveTab("logs"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "bg-crimson-600 text-white shadow-md shadow-crimson-900/40"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Terminal className="w-4 h-4" /> Logs ({logCount})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={
              activeTab === "events"
                ? "Search by event type, source..."
                : "Search by message, raw log..."
            }
            className="pl-9 w-full text-xs"
          />
        </div>

        {activeTab === "events" ? (
          <>
            <Select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); }}
              className="w-full sm:w-36 text-xs"
              options={[
                { value: "ALL", label: "All Severity" },
                { value: "Critical", label: "Critical" },
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" },
                { value: "Informational", label: "Info" },
              ]}
            />
            <Select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); }}
              className="w-full sm:w-36 text-xs"
              options={[
                { value: "ALL", label: "All Sources" },
                { value: "Syslog", label: "Syslog" },
                { value: "WindowsEventLog", label: "WinEvent" },
                { value: "EDR", label: "EDR" },
                { value: "NetFlow", label: "NetFlow" },
                { value: "Suricata", label: "Suricata" },
                { value: "Zeek", label: "Zeek" },
                { value: "CloudTrail", label: "CloudTrail" },
              ]}
            />
            <Select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); }}
              className="w-full sm:w-36 text-xs"
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
          </>
        ) : (
          <>
            <Select
              value={logLevelFilter}
              onChange={(e) => { setLogLevelFilter(e.target.value); }}
              className="w-full sm:w-36 text-xs"
              options={[
                { value: "ALL", label: "All Levels" },
                { value: "DEBUG", label: "DEBUG" },
                { value: "INFO", label: "INFO" },
                { value: "WARN", label: "WARN" },
                { value: "ERROR", label: "ERROR" },
                { value: "CRIT", label: "CRIT" },
              ]}
            />
            <Select
              value={parseStatusFilter}
              onChange={(e) => { setParseStatusFilter(e.target.value); }}
              className="w-full sm:w-36 text-xs"
              options={[
                { value: "ALL", label: "All Status" },
                { value: "Parsed", label: "Parsed" },
                { value: "Raw", label: "Raw" },
                { value: "Failed", label: "Failed" },
              ]}
            />
          </>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={handleSearch}
          leftIcon={<Activity className="w-3.5 h-3.5" />}
        >
          Filter
        </Button>
      </div>

      {/* Events Table */}
      {activeTab === "events" && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Severity</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Event Type</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Source</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Category</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Asset</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px] w-10"></th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p>No events found. Run a simulation to generate telemetry.</p>
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <React.Fragment key={evt.id}>
                      <tr
                        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedRowId(
                            expandedRowId === evt.id ? null : evt.id
                          )
                        }
                      >
                        <td className="py-2 px-3 text-gray-300 font-mono text-[11px]">
                          {new Date(evt.occurred_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <SeverityBadge severity={evt.severity} />
                        </td>
                        <td className="py-2 px-3 text-white font-semibold">
                          {evt.event_type}
                        </td>
                        <td className="py-2 px-3 text-gray-300">{evt.source}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px]">
                            {evt.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">
                          {evt.asset?.hostname || "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-500">
                          {expandedRowId === evt.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </td>
                      </tr>
                      {expandedRowId === evt.id && (
                        <tr>
                          <td colSpan={7} className="bg-black/40 p-4">
                            <div className="space-y-2 font-mono text-[11px]">
                              <div className="flex gap-6">
                                <span className="text-gray-500">Event ID:</span>
                                <span className="text-gray-300">{evt.id}</span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Source Type:</span>
                                <span className="text-gray-300">{evt.source_type}</span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Identity:</span>
                                <span className="text-gray-300">
                                  {evt.identity?.username || "—"}
                                  {evt.identity?.display_name ? ` (${evt.identity.display_name})` : ""}
                                </span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Tags:</span>
                                <span className="text-gray-300">
                                  {evt.tags?.join(", ") || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Normalized Fields:</span>
                                <pre className="bg-black/60 rounded p-2 text-gray-300 text-[10px] max-h-40 overflow-auto">
                                  {JSON.stringify(evt.normalized_fields, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-[11px] text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      {activeTab === "logs" && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Level</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Service</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Host</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Message</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-left py-2.5 px-3 text-gray-400 font-semibold uppercase tracking-wider text-[10px] w-10"></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p>No logs found. Run a simulation to generate telemetry.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr
                        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedRowId(
                            expandedRowId === log.id ? null : log.id
                          )
                        }
                      >
                        <td className="py-2 px-3 text-gray-300 font-mono text-[11px]">
                          {new Date(log.logged_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.log_level === "CRIT" || log.log_level === "EMERG"
                                ? "bg-red-500/20 text-red-400"
                                : log.log_level === "ERROR" || log.log_level === "ALERT"
                                ? "bg-orange-500/20 text-orange-400"
                                : log.log_level === "WARN"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {log.log_level}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-white font-semibold">
                          {log.service_name || "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">
                          {log.source_host || "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-300 max-w-xs truncate">
                          {log.message}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              log.parse_status === "Parsed"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : log.parse_status === "Failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {log.parse_status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500">
                          {expandedRowId === log.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </td>
                      </tr>
                      {expandedRowId === log.id && (
                        <tr>
                          <td colSpan={7} className="bg-black/40 p-4">
                            <div className="space-y-2 font-mono text-[11px]">
                              <div className="flex gap-6">
                                <span className="text-gray-500">Log ID:</span>
                                <span className="text-gray-300">{log.id}</span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Parser:</span>
                                <span className="text-gray-300">{log.parser_name || "—"}</span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Facility:</span>
                                <span className="text-gray-300">{log.facility || "—"}</span>
                              </div>
                              <div className="flex gap-6">
                                <span className="text-gray-500">Linked Event:</span>
                                <span className="text-gray-300">{log.event_id || "—"}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Raw Log:</span>
                                <pre className="bg-black/60 rounded p-2 text-green-300 text-[10px] max-h-40 overflow-auto whitespace-pre-wrap">
                                  {log.raw_log || "—"}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-[11px] text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
