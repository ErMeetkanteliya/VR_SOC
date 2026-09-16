"use client";

import React, { useState } from "react";
import { Modal, Button, Input, Select } from "@vrsoc/ui";
import { Server, AlertTriangle } from "lucide-react";
import { registerEndpointAgent } from "@/lib/agents/actions";
import type { AssetGroup, AssetType, OSType, SeverityLevel, AgentStatus } from "@vrsoc/types";

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetGroups: AssetGroup[];
  onSuccess: () => void;
}

export function RegisterAgentModal({
  isOpen,
  onClose,
  assetGroups,
  onSuccess,
}: RegisterAgentModalProps) {
  const [hostname, setHostname] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ipAddress, setIpAddress] = useState("10.0.4.120");
  const [assetType, setAssetType] = useState<AssetType>("Endpoint");
  const [osType, setOsType] = useState<OSType>("Windows");
  const [osVersion, setOsVersion] = useState("Windows 11 Enterprise 23H2");
  const [criticality, setCriticality] = useState<SeverityLevel>("Medium");
  const [assetGroupId, setAssetGroupId] = useState<string>("");
  const [status, setStatus] = useState<AgentStatus>("Online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim()) {
      setError("Hostname is required");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await registerEndpointAgent({
      hostname: hostname.trim(),
      displayName: displayName.trim() || undefined,
      ipAddress: ipAddress.trim() || "10.0.4.120",
      assetType,
      osType,
      osVersion,
      criticality,
      assetGroupId: assetGroupId || undefined,
      agentVersion: "1.4.2",
      status,
    });

    setLoading(false);
    if (res.success) {
      setHostname("");
      setDisplayName("");
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to register endpoint agent.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Simulated Endpoint Agent"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Hostname (FQDN) *
            </label>
            <Input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g. WKSTN-EXEC-01.corp.internal"
              required
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Executive Workstation 01"
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              IP Address
            </label>
            <Input
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="10.0.4.120"
              className="w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Asset Type
            </label>
            <Select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              className="w-full text-xs"
              options={[
                { value: "Endpoint", label: "Endpoint (Workstation/Laptop)" },
                { value: "Server", label: "Application / File Server" },
                { value: "Domain Controller", label: "Domain Controller (AD/LDAP)" },
                { value: "Cloud VM", label: "Cloud Virtual Machine" },
                { value: "Container", label: "Container Workload" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Operating System
            </label>
            <Select
              value={osType}
              onChange={(e) => {
                const val = e.target.value as OSType;
                setOsType(val);
                if (val === "Windows") setOsVersion("Windows 11 Enterprise 23H2");
                else if (val === "Linux") setOsVersion("Ubuntu 24.04 LTS");
                else if (val === "macOS") setOsVersion("macOS 14.5 Sonoma");
              }}
              className="w-full text-xs"
              options={[
                { value: "Windows", label: "Microsoft Windows" },
                { value: "Linux", label: "Linux (Ubuntu/RHEL/Debian)" },
                { value: "macOS", label: "Apple macOS" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              OS Version String
            </label>
            <Input
              value={osVersion}
              onChange={(e) => setOsVersion(e.target.value)}
              placeholder="e.g. Windows 11 Enterprise 23H2"
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Asset Group
            </label>
            <Select
              value={assetGroupId}
              onChange={(e) => setAssetGroupId(e.target.value)}
              className="w-full text-xs"
              options={[
                { value: "", label: "-- Unassigned --" },
                ...assetGroups.map((g) => ({
                  value: g.id,
                  label: `${g.name} (${g.criticality})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Criticality Tier
            </label>
            <Select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as SeverityLevel)}
              className="w-full text-xs"
              options={[
                { value: "Low", label: "Low (Tier 3 General)" },
                { value: "Medium", label: "Medium (Tier 2 Corporate)" },
                { value: "High", label: "High (Tier 1 Executive / Core)" },
                { value: "Critical", label: "Critical (Tier 0 Crown Jewels)" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Initial Agent Sensor Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AgentStatus)}
              className="w-full text-xs"
              options={[
                { value: "Online", label: "Online (Active Telemetry)" },
                { value: "Pending", label: "Pending Deployment" },
                { value: "Offline", label: "Offline" },
              ]}
            />
          </div>
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
            variant="primary"
            size="sm"
            isLoading={loading}
            leftIcon={<Server className="w-4 h-4" />}
          >
            Enroll & Deploy Agent
          </Button>
        </div>
      </form>
    </Modal>
  );
}
