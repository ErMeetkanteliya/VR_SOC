"use client";

import React, { useState } from "react";
import {
  AppShell,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  Button,
  IconButton,
  Badge,
  SeverityBadge,
  StatusBadge,
  Input,
  Select,
  Checkbox,
  Toggle,
  Tabs,
  DataTable,
  Modal,
  Drawer,
  Tooltip,
  Timeline,
  ChartContainer,
  Skeleton,
  EmptyState,
  ErrorState,
  Toast,
} from "@vrsoc/ui";
import { OrganizationSwitcher } from "@/components/tenant/OrganizationSwitcher";
import { MemberRoleManager } from "@/components/rbac/MemberRoleManager";
import type { Organization, Membership } from "@vrsoc/types";
import {
  ShieldAlert,
  Server,
  Flame,
  Layers,
  Activity,
  Bell,
  Play,
  Terminal,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";

export default function DesignSystemShowcasePage() {
  const [activeTab, setActiveTab] = useState("components");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [toggleState, setToggleState] = useState(true);
  const [checkboxState, setCheckboxState] = useState(true);

  // Sample Table Data
  const sampleAlerts = [
    {
      id: "ALT-2026-0342",
      title: "Brute Force Authentication Attack",
      severity: "Critical" as const,
      score: 95,
      asset: "DC-01.corp.internal",
      mitre: "T1110",
      status: "Open",
      time: "2m ago",
    },
    {
      id: "ALT-2026-0343",
      title: "Suspicious Encoded PowerShell Execution",
      severity: "High" as const,
      score: 82,
      asset: "WS-FIN-04.corp.internal",
      mitre: "T1059.001",
      status: "In Progress",
      time: "14m ago",
    },
    {
      id: "ALT-2026-0344",
      title: "Unauthorized USB Storage Insertion",
      severity: "Medium" as const,
      score: 54,
      asset: "WS-ENG-12.corp.internal",
      mitre: "T1052.001",
      status: "Acknowledged",
      time: "1h ago",
    },
    {
      id: "ALT-2026-0345",
      title: "Perimeter Port Sweep Detected",
      severity: "Low" as const,
      score: 28,
      asset: "FW-EDGE-01",
      mitre: "T1046",
      status: "Closed",
      time: "3h ago",
    },
  ];

  const tableColumns = [
    { key: "id", header: "Alert ID", className: "font-mono font-bold text-white" },
    { key: "title", header: "Alert Title" },
    {
      key: "severity",
      header: "Severity",
      render: (row: (typeof sampleAlerts)[0]) => (
        <SeverityBadge severity={row.severity} score={row.score} showIcon />
      ),
    },
    { key: "asset", header: "Target Asset", className: "font-mono text-white/70" },
    {
      key: "mitre",
      header: "MITRE ATT&CK",
      render: (row: (typeof sampleAlerts)[0]) => (
        <Badge variant="burgundy">{row.mitre}</Badge>
      ),
    },
    { key: "time", header: "Triggered", className: "text-white/40 font-mono" },
    {
      key: "actions",
      header: "Action",
      render: () => (
        <Button size="sm" variant="outline" onClick={() => setIsDrawerOpen(true)}>
          Investigate
        </Button>
      ),
    },
  ];

  const sampleTimeline = [
    {
      id: "1",
      title: "Initial Authentication Spike Detected",
      timestamp: "09:14:02 UTC",
      description: "50+ failed Kerberos logon attempts from IP 198.51.100.24",
      status: "error" as const,
    },
    {
      id: "2",
      title: "Automated Host Quarantine Triggered",
      timestamp: "09:14:30 UTC",
      description: "SOAR playbook executed firewall block and host containment",
      status: "warning" as const,
    },
    {
      id: "3",
      title: "Analyst Acknowledged Alert",
      timestamp: "09:16:10 UTC",
      description: "Assigned to Lead Responder Alex Mercer",
      status: "success" as const,
    },
  ];

  const commandItems = [
    {
      id: "nav-dash",
      label: "Navigate to Dashboard",
      category: "Navigation",
      onSelect: () => {},
    },
    {
      id: "nav-alerts",
      label: "View Active Alerts",
      category: "Alerts",
      shortcut: "G A",
      onSelect: () => {},
    },
    {
      id: "action-sim",
      label: "Launch Brute Force Simulation",
      category: "Actions",
      icon: <Play className="w-3.5 h-3.5 text-[#E53935]" />,
      onSelect: () => {},
    },
  ];

  const demoOrg: Organization = {
    id: "org-demo-01",
    name: "Cyber Defense Academy",
    slug: "cda-enterprise",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const demoUserOrgs: Membership[] = [
    {
      id: "mem-01",
      user_id: "usr-01",
      organization_id: "org-demo-01",
      role: "Super Admin",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization: demoOrg,
    },
    {
      id: "mem-02",
      user_id: "usr-01",
      organization_id: "org-demo-02",
      role: "SOC Analyst",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization: {
        id: "org-demo-02",
        name: "FinTech Global SOC",
        slug: "fintech-soc",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];

  const demoOrgMembers: Membership[] = [
    {
      id: "mem-01",
      user_id: "usr-01",
      organization_id: "org-demo-01",
      role: "Super Admin",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization: demoOrg,
      profile: {
        id: "usr-01",
        email: "alex.mercer@cda.internal",
        full_name: "Alex Mercer (SecOps Lead)",
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "mem-03",
      user_id: "usr-02",
      organization_id: "org-demo-01",
      role: "SOC Analyst",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization: demoOrg,
      profile: {
        id: "usr-02",
        email: "jordan.vance@cda.internal",
        full_name: "Jordan Vance (Tier-2 Analyst)",
        created_at: new Date().toISOString(),
      },
    },
  ];

  return (
    <AppShell currentPath="/design-system" commandItems={commandItems}>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Showcase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="burgundy">Design System</Badge>
              <Badge variant="burgundy">Multi-Tenant Enabled</Badge>
              <span className="text-xs font-mono text-white/40">Base44 Visual Parity Specification</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              VRSOC Component Library Showcase
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Validating theme tokens (#0A0A0A, #161616, #5B0A0A, #E53935), micro-animations, typography, and controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <OrganizationSwitcher
              currentOrganization={demoOrg}
              memberships={demoUserOrgs}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRoleManagerOpen(true)}
              leftIcon={<Users className="w-3.5 h-3.5 text-[#E53935]" />}
            >
              Manage Roles
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Launch Modal
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(true)}>
              Open Drawer
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: "components", label: "Core Components", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "tables", label: "Data Tables & Telemetry", icon: <Terminal className="w-3.5 h-3.5" /> },
            { id: "states", label: "UI States & Feedback", icon: <Sparkles className="w-3.5 h-3.5" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "components" && (
          <div className="space-y-8">
            {/* 1. Metric Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Active Alerts"
                value="24"
                change="+12%"
                isPositive={false}
                icon={<ShieldAlert className="w-4 h-4" />}
                subtitle="5 critical alerts require triage"
              />
              <MetricCard
                label="Open Incidents"
                value="7"
                change="-3%"
                isPositive={true}
                icon={<Flame className="w-4 h-4" />}
                subtitle="Avg MTTA 4.2m"
              />
              <MetricCard
                label="Active Agents"
                value="156 / 160"
                change="97.5%"
                isPositive={true}
                icon={<Server className="w-4 h-4" />}
                subtitle="4 agents offline"
              />
              <MetricCard
                label="MITRE Coverage"
                value="78%"
                change="+5%"
                isPositive={true}
                icon={<Activity className="w-4 h-4" />}
                subtitle="142 / 193 techniques mapped"
              />
            </div>

            {/* 2. Badges & Indicators */}
            <Card variant="glass">
              <CardHeader>
                <div>
                  <CardTitle>Badges & Status Indicators</CardTitle>
                  <CardDescription>Visual matrix for alert severities and agent lifecycle states.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs text-white/40 font-mono">Severity Indicators:</span>
                  <div className="flex flex-wrap gap-2.5">
                    <SeverityBadge severity="Critical" score={95} showIcon />
                    <SeverityBadge severity="High" score={80} showIcon />
                    <SeverityBadge severity="Medium" score={55} showIcon />
                    <SeverityBadge severity="Low" score={25} showIcon />
                    <SeverityBadge severity="Informational" showIcon />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-white/40 font-mono">Agent Status Badges:</span>
                  <div className="flex flex-wrap gap-2.5">
                    <StatusBadge status="Online" />
                    <StatusBadge status="Warning" />
                    <StatusBadge status="Critical" />
                    <StatusBadge status="Offline" />
                    <StatusBadge status="Updating" />
                    <StatusBadge status="Pending" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Form Controls & Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Button System</CardTitle>
                  <CardDescription>CTAs, actions, and icon buttons with active focus states.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary CTA</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="primary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}>
                      Run Lab
                    </Button>
                    <Button variant="outline" size="sm" isLoading>
                      Processing
                    </Button>
                    <IconButton label="Notifications" variant="outline" size="md">
                      <Bell className="w-4 h-4" />
                    </IconButton>
                    <Tooltip content="Reset simulation state">
                      <IconButton label="Reset" variant="ghost" size="md">
                        <RotateCcw className="w-4 h-4" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Form Controls</CardTitle>
                  <CardDescription>Inputs, selects, checkboxes, and toggle switches.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Search Filter"
                    placeholder="Enter hostname or IP address..."
                  />
                  <Select
                    label="Operating System Filter"
                    options={[
                      { label: "All Operating Systems", value: "all" },
                      { label: "Windows Server 2022", value: "win2022" },
                      { label: "Ubuntu Linux 22.04", value: "ubuntu" },
                    ]}
                  />
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Checkbox
                      label="Enforce strict MFA"
                      description="Require TOTP tokens on all logins"
                      checked={checkboxState}
                      onChange={(e) => setCheckboxState(e.target.checked)}
                    />
                    <Toggle
                      label="Automated Quarantine"
                      checked={toggleState}
                      onChange={setToggleState}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "tables" && (
          <div className="space-y-6">
            <Card variant="glass">
              <CardHeader>
                <div>
                  <CardTitle>Security Alerts Data Table</CardTitle>
                  <CardDescription>High-density telemetry feed with status badges and row actions.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable columns={tableColumns} data={sampleAlerts} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="Investigation Timeline" description="Forensic event progression">
                <Timeline items={sampleTimeline} />
              </ChartContainer>

              <ChartContainer title="Live Telemetry Ingestion" description="Realtime event throughput">
                <div className="h-48 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center text-xs font-mono text-white/40">
                  [Area Chart Slot — Realtime Timeseries Data]
                </div>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === "states" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Empty State Container</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="No compromised endpoints"
                    description="All 156 agent sensors are reporting normal CPU/RAM telemetry without isolation flags."
                    actionLabel="Deploy New Agent"
                    onAction={() => {}}
                  />
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Error State Alert</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ErrorState
                    title="Threat Intel Rate Limit Exceeded"
                    message="VirusTotal lookup API returned HTTP 429. Falling back to local cached reputation store."
                    onRetry={() => {}}
                  />
                  <div className="space-y-2">
                    <span className="text-xs text-white/40 font-mono">Skeleton Loading Shimmer:</span>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>In-App Toast Alerts</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Toast
                  id="toast-1"
                  type="success"
                  title="Host Isolation Successful"
                  message="Asset WS-FIN-04 quarantined from network."
                />
                <Toast
                  id="toast-2"
                  type="error"
                  title="Playbook Approval Required"
                  message="Domain Controller firewall rule modification requires human authorization."
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interactive Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Declare Security Incident"
          description="Escalate active alerts to formal NIST SP 800-61 incident response."
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                Confirm Declaration
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Incident Title" defaultValue="INC-2026-0342 — Credential Stuffing & Domain Breach" />
            <Select
              label="Assigned Lead Responder"
              options={[
                { label: "Alex Mercer (Senior Responder)", value: "alex" },
                { label: "Jordan Vance (SOC Lead)", value: "jordan" },
              ]}
            />
          </div>
        </Modal>

        {/* Interactive Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Alert Investigation Dossier"
          subtitle="ALT-2026-0342 • Risk Score 95/100"
          footer={
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Acknowledge Alert
            </Button>
          }
        >
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Brute Force Authentication Attack</span>
                <SeverityBadge severity="Critical" score={95} />
              </div>
              <p className="text-white/60">Target: DC-01.corp.internal • Mapped to MITRE ATT&CK T1110</p>
            </div>

            <div className="space-y-2">
              <h5 className="font-mono uppercase text-white/50">Triggering Event Payload:</h5>
              <pre className="p-3.5 rounded-lg bg-[#0A0A0A] border border-white/10 font-mono text-[11px] text-red-300 overflow-x-auto">
{`{
  "EventID": 4625,
  "TargetUserName": "svc_backup",
  "WorkstationName": "WS-FIN-04",
  "IpAddress": "198.51.100.24",
  "FailureReason": "Unknown user name or bad password",
  "Count": 54
}`}
              </pre>
            </div>
          </div>
        </Drawer>

        {/* Interactive Member Role Manager Modal */}
        <MemberRoleManager
          isOpen={isRoleManagerOpen}
          onClose={() => setIsRoleManagerOpen(false)}
          organizationId={demoOrg.id}
          organizationName={demoOrg.name}
          currentUserRole="Super Admin"
          currentUserId="usr-01"
          initialMembers={demoOrgMembers}
        />
      </div>
    </AppShell>
  );
}
