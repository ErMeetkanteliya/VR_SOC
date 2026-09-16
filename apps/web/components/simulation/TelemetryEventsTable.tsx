import React, { useState } from "react";
import { DataTable, SeverityBadge, Button, Drawer, Input, Select, type Column } from "@vrsoc/ui";
import { Search, Eye, RefreshCw, Database } from "lucide-react";
import type { TelemetryEvent } from "@vrsoc/types";

interface TelemetryEventsTableProps {
  events: TelemetryEvent[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export function TelemetryEventsTable({
  events,
  isLoading = false,
  onRefresh,
}: TelemetryEventsTableProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    if (severityFilter !== "ALL" && e.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchType = e.event_type?.toLowerCase().includes(q);
      const matchSource = e.source?.toLowerCase().includes(q);
      const matchHost = e.asset?.hostname?.toLowerCase().includes(q);
      const matchMsg = JSON.stringify(e.normalized_fields).toLowerCase().includes(q);
      return matchType || matchSource || matchHost || matchMsg;
    }
    return true;
  });

  const columns: Column<TelemetryEvent>[] = [
    {
      key: "occurred_at",
      header: "Timestamp",
      render: (row) => (
        <div className="font-mono text-[11px] text-gray-300">
          {new Date(row.occurred_at).toLocaleTimeString()}
        </div>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: "event_type",
      header: "Event Type & Category",
      render: (row) => (
        <div>
          <span className="font-medium text-white font-mono text-xs block">{row.event_type}</span>
          <span className="text-[10px] text-gray-400">{row.category}</span>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source & Host",
      render: (row) => (
        <div>
          <span className="text-xs text-crimson-300 font-mono block">
            {row.asset?.hostname || row.source}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">{row.source_type}</span>
        </div>
      ),
    },
    {
      key: "message",
      header: "Normalized Payload Summary",
      render: (row) => {
        const msg = (row.normalized_fields as any)?.message || JSON.stringify(row.normalized_fields);
        return (
          <p className="text-xs text-gray-300 truncate max-w-xs xl:max-w-md font-sans">
            {msg}
          </p>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(row);
            }}
            className="text-gray-300 hover:text-white"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Inspect
          </Button>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search telemetry events by type, host, message..."
            className="pl-9 w-full text-xs"
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full text-xs"
            options={[
              { value: "ALL", label: "All Severities" },
              { value: "Critical", label: "Critical Only" },
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
              { value: "Informational", label: "Informational" },
            ]}
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {/* Events Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedEvent(row)}
        emptyTitle="No Telemetry Events Generated Yet"
        emptyDescription="Launch a simulation scenario above to generate live synthetic telemetry into the pipeline."
      />

      {/* Drawer: Detailed Event Inspector */}
      <Drawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Telemetry Event Inspector"
        subtitle="Normalized structured SOC event representation (public.events)"
        width="md"
      >
        {selectedEvent && (
          <div className="space-y-5 text-xs text-gray-300">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm font-mono">
                  {selectedEvent.event_type}
                </span>
                <SeverityBadge severity={selectedEvent.severity} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5 text-gray-400">
                <div>
                  <span className="block text-gray-500">Source / Type:</span>
                  <span className="text-white font-mono">{selectedEvent.source} ({selectedEvent.source_type})</span>
                </div>
                <div>
                  <span className="block text-gray-500">Timestamp:</span>
                  <span className="text-white font-mono">{selectedEvent.occurred_at}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Category:</span>
                  <span className="text-white">{selectedEvent.category}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Target Host:</span>
                  <span className="text-crimson-300 font-mono">{selectedEvent.asset?.hostname || "Unassigned"}</span>
                </div>
              </div>
            </div>

            {/* Normalized Fields Viewer */}
            <div className="space-y-2">
              <label className="block text-gray-300 font-semibold text-xs flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" /> Normalized Fields (JSONB)
              </label>
              <pre className="p-3.5 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedEvent.normalized_fields, null, 2)}
              </pre>
            </div>

            {/* Tags */}
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-gray-400 text-[11px]">Event Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
