/**
 * Phase 15: Detection & Correlation Rules — Canonical System Rules
 *
 * Authoritative baseline detection catalog mapping directly to Phase 12
 * simulation telemetry contracts and enterprise MITRE ATT&CK techniques.
 */

import type { DetectionRule } from "@vrsoc/types";

export const CANONICAL_SYSTEM_DETECTION_RULES: DetectionRule[] = [
  {
    id: "rule-brute-force-auth",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Brute Force Authentication & Password Spraying",
    description:
      "Detects abnormal frequency of authentication failures or burst login rejections targeting enterprise domain accounts within a 15-minute window.",
    severity: "High",
    rule_type: "threshold",
    category: "Authentication Attacks",
    mitre_tactic: "Credential Access",
    mitre_technique_id: "T1110.001",
    mitre_technique_name: "Password Guessing",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 2,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        { field: "category", operator: "equals", value: "Authentication" },
        {
          logicalOperator: "OR",
          conditions: [
            {
              field: "event_type",
              operator: "in",
              value: ["AUTH_FAILED", "AUTH_FAILED_BURST", "AUTH_FAILURE", "ACCOUNT_LOCKED"],
            },
            { field: "failure_reason", operator: "contains", value: "FAILURE" },
            { field: "attempt_count", operator: "greater_than_or_equal", value: 3 },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Review source IP, verify account lock status, and consider host quarantine.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-powershell-encoded-exec",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Suspicious Encoded PowerShell / Command Execution",
    description:
      "Identifies execution of PowerShell or cmd.exe processes utilizing base64 encoded payloads (-enc, -EncodedCommand) or in-memory loaders (Invoke-Expression, DownloadString).",
    severity: "Critical",
    rule_type: "single_event",
    category: "Endpoint Execution",
    mitre_tactic: "Execution",
    mitre_technique_id: "T1059.001",
    mitre_technique_name: "PowerShell",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        {
          logicalOperator: "OR",
          conditions: [
            { field: "category", operator: "in", value: ["Execution", "Process"] },
            { field: "event_type", operator: "in", value: ["PROCESS_CREATE", "POWERSHELL_EXEC", "CMD_EXEC"] },
          ],
        },
        {
          logicalOperator: "OR",
          conditions: [
            { field: "command_line", operator: "contains", value: "-enc" },
            { field: "command_line", operator: "contains", value: "-EncodedCommand" },
            { field: "command_line", operator: "contains", value: "Invoke-Expression" },
            { field: "command_line", operator: "contains", value: "DownloadString" },
            { field: "process_name", operator: "equals", value: "powershell.exe" },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Inspect parent process hierarchy, decode base64 command line, and isolate endpoint.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-scheduled-task-persistence",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Persistence via Scheduled Task Creation",
    description:
      "Detects creation or modification of Windows scheduled tasks using schtasks.exe or Task Scheduler APIs.",
    severity: "High",
    rule_type: "single_event",
    category: "Persistence Mechanism",
    mitre_tactic: "Persistence",
    mitre_technique_id: "T1053.005",
    mitre_technique_name: "Scheduled Task",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        {
          logicalOperator: "OR",
          conditions: [
            { field: "event_type", operator: "in", value: ["TASK_SCHEDULED", "PROCESS_CREATE"] },
            { field: "category", operator: "equals", value: "Persistence" },
          ],
        },
        {
          logicalOperator: "OR",
          conditions: [
            { field: "command_line", operator: "contains", value: "schtasks" },
            { field: "command_line", operator: "contains", value: "/create" },
            { field: "task_name", operator: "exists", value: true },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Inspect task trigger frequency, target binary path, and creator user account.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-ransomware-vssadmin-deletion",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Ransomware Precursor — Shadow Copy Deletion",
    description:
      "Detects execution of vssadmin or wmic commands attempting to delete volume shadow copies to prevent file recovery.",
    severity: "Critical",
    rule_type: "single_event",
    category: "Ransomware & Destruction",
    mitre_tactic: "Impact",
    mitre_technique_id: "T1490",
    mitre_technique_name: "Inhibit System Recovery",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        {
          logicalOperator: "OR",
          conditions: [
            { field: "command_line", operator: "contains", value: "delete shadows" },
            { field: "command_line", operator: "contains", value: "vssadmin" },
            { field: "event_type", operator: "in", value: ["VSSADMIN_EXEC", "RANSOMWARE_CANARY_ALERT"] },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "URGENT: Immediately isolate endpoint from network, terminate parent process tree, and verify shadow backup integrity.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-network-port-scan",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Internal Subnet Reconnaissance & Port Sweep",
    description:
      "Identifies rapid TCP SYN port scanning bursts indicative of internal network enumeration and lateral movement reconnaissance.",
    severity: "Medium",
    rule_type: "single_event",
    category: "Network Anomalies",
    mitre_tactic: "Discovery",
    mitre_technique_id: "T1046",
    mitre_technique_name: "Network Service Discovery",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        { field: "category", operator: "equals", value: "Network" },
        {
          logicalOperator: "OR",
          conditions: [
            { field: "event_type", operator: "in", value: ["PORT_SCAN_SYN_BURST", "PORT_SCAN_DETECTED"] },
            { field: "syn_scan", operator: "equals", value: true },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Check source host segmentation rules, identify scanning tool process, and apply network ACL block.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-usb-unauthorized-hardware",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Unauthorized Removable USB Storage Insertion",
    description:
      "Detects insertion of unauthorized USB mass storage devices or external flash drives in restricted network segments.",
    severity: "Medium",
    rule_type: "single_event",
    category: "Hardware Additions",
    mitre_tactic: "Initial Access",
    mitre_technique_id: "T1200",
    mitre_technique_name: "Hardware Additions",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        {
          logicalOperator: "OR",
          conditions: [
            { field: "category", operator: "equals", value: "Hardware" },
            { field: "event_type", operator: "in", value: ["USB_STORAGE_ATTACHED", "HARDWARE_INSERT", "usb_connected"] },
            { field: "source", operator: "equals", value: "PnP Manager" },
            { field: "device_vendor", operator: "exists", value: true },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Verify hardware whitelist, scan device volume for unauthorized binaries, and notify endpoint owner.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
  {
    id: "rule-canary-file-modification",
    organization_id: "00000000-0000-0000-0000-000000000000",
    name: "Canary File Modification / Suspicious Dropper",
    description:
      "Identifies write operations to decoy canary files or suspicious executable/dll drops in temp directories.",
    severity: "High",
    rule_type: "single_event",
    category: "File Integrity",
    mitre_tactic: "Impact",
    mitre_technique_id: "T1486",
    mitre_technique_name: "Data Encrypted for Impact",
    is_enabled: true,
    is_system: true,
    evaluation_window_minutes: 15,
    threshold_count: 1,
    conditions: {
      logicalOperator: "AND",
      conditions: [
        {
          logicalOperator: "OR",
          conditions: [
            { field: "category", operator: "equals", value: "File" },
            { field: "event_type", operator: "in", value: ["FILE_WRITE", "CANARY_CORRUPTED", "FILE_RENAME_BURST"] },
          ],
        },
        {
          logicalOperator: "OR",
          conditions: [
            { field: "file_path", operator: "contains", value: "canary" },
            { field: "file_path", operator: "contains", value: "beacon" },
            { field: "is_canary", operator: "equals", value: true },
          ],
        },
      ],
    },
    metadata: {
      author: "VRSOC Detection Engineering",
      recommended_action: "Check modifying process executable, calculate hash on VirusTotal, and trigger ransomware containment playbook.",
    },
    created_at: "2026-09-17T00:00:00Z",
    updated_at: "2026-09-17T00:00:00Z",
  },
];
