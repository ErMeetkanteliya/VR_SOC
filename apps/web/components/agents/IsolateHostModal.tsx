"use client";

import React, { useState } from "react";
import { Modal, Button, Input } from "@vrsoc/ui";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { isolateAgent } from "@/lib/agents/actions";
import type { AgentWithAsset } from "@vrsoc/types";

interface IsolateHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentWithAsset | null;
  onSuccess: (isIsolated: boolean) => void;
}

export function IsolateHostModal({
  isOpen,
  onClose,
  agent,
  onSuccess,
}: IsolateHostModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agent) return null;

  const willIsolate = !agent.asset?.is_isolated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await isolateAgent({
      agentId: agent.id,
      isolate: willIsolate,
      reason: reason || (willIsolate ? "Suspected malware / lateral movement containment" : "Analyst verified host cleared"),
    });

    setLoading(false);
    if (res.success && res.data) {
      onSuccess(res.data.isIsolated);
      onClose();
    } else {
      setError(res.error || "Failed to execute isolation command.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={willIsolate ? "Contain & Isolate Endpoint" : "Release Endpoint from Isolation"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-3.5 rounded-lg border ${willIsolate ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"} flex items-start gap-3`}>
          {willIsolate ? (
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-sm mb-1 text-white">
              Target: <span className="font-mono text-crimson-400">{agent.asset?.hostname}</span> ({agent.asset?.ip_address})
            </p>
            {willIsolate ? (
              <p>
                Network isolation severs all inbound and outbound TCP/UDP traffic from this host, except for secure TLS management heartbeats to the VRSOC defense console.
              </p>
            ) : (
              <p>
                Releasing this endpoint restores full network adapter routing and re-enables normal corporate traffic.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Analyst Reason / Incident Reference
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={willIsolate ? "e.g. INC-2026-089 Cobalt Strike beaconing" : "e.g. Host remediated and scanned clean"}
            className="w-full text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={willIsolate ? "destructive" : "primary"}
            size="sm"
            isLoading={loading}
          >
            {willIsolate ? "Confirm Network Isolation" : "Confirm Network Release"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
