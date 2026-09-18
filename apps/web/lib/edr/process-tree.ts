/**
 * EDR Process Tree Reconstruction & Analysis Engine
 *
 * Reconstructs hierarchical execution trees (PID -> PPID relationships)
 * from recorded endpoint process events. Detects anomalous process relationships,
 * masquerading binaries, suspicious paths, and unquoted executable arguments.
 */

import type { ProcessRecord, EdrProcessTreeNode } from "@vrsoc/types";

export interface BuildProcessTreeOptions {
  highlightSuspicious?: boolean;
}

const SUSPICIOUS_PATHS = [
  "\\appdata\\local\\temp",
  "\\users\\public\\",
  "\\windows\\temp\\",
  "/tmp/",
  "/var/tmp/",
  "/dev/shm/",
];

const SUSPICIOUS_PROCESS_NAMES = [
  "mimikatz.exe",
  "psexec.exe",
  "nc.exe",
  "ncat.exe",
  "powershell.exe -enc",
  "certutil.exe -urlcache",
  "vssadmin.exe delete shadows",
  "whoami.exe /priv",
  "net.exe user /add",
];

const ANOMALOUS_PARENTS: Record<string, string[]> = {
  "svchost.exe": ["cmd.exe", "powershell.exe", "explorer.exe", "winword.exe", "excel.exe"],
  "lsass.exe": ["cmd.exe", "powershell.exe", "explorer.exe"],
  "cmd.exe": ["winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe"],
  "powershell.exe": ["winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe"],
  "mshta.exe": ["winword.exe", "excel.exe", "explorer.exe"],
  "cscript.exe": ["winword.exe", "excel.exe"],
  "wscript.exe": ["winword.exe", "excel.exe"],
};

/**
 * Analyzes a single process record for heuristic indicators of compromise.
 */
export function analyzeProcessSuspicion(
  process: ProcessRecord,
  parentName?: string
): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const execPath = (process.executable_path || "").toLowerCase();
  const cmdLine = (process.command_line || "").toLowerCase();
  const name = (process.name || "").toLowerCase();

  // 1. Suspicious execution paths
  for (const suspiciousPath of SUSPICIOUS_PATHS) {
    if (execPath.includes(suspiciousPath) || cmdLine.includes(suspiciousPath)) {
      reasons.push(`Process spawned from volatile/unusual directory (${suspiciousPath})`);
      break;
    }
  }

  // 2. Encoded / Obfuscated Commands
  if (cmdLine.includes("-enc ") || cmdLine.includes("-encodedcommand ") || cmdLine.includes("frombase64string")) {
    reasons.push("Obfuscated or Base64-encoded command line arguments");
  }

  // 3. Shadow copy deletion or defense evasion commands
  if (cmdLine.includes("delete shadows") || cmdLine.includes("bcedit") || cmdLine.includes("disable-windowsoptionalfeature")) {
    reasons.push("Defense evasion or shadow copy manipulation command");
  }

  // 4. Download cradle usage
  if (cmdLine.includes("downloadstring") || cmdLine.includes("downloadfile") || cmdLine.includes("curl ") || cmdLine.includes("certutil -urlcache")) {
    reasons.push("Remote payload download cradle detected");
  }

  // 5. Masquerading or anomalous parent-child relationship
  if (parentName) {
    const parentLower = parentName.toLowerCase();
    const disallowedParents = ANOMALOUS_PARENTS[name];
    if (disallowedParents && disallowedParents.some((p) => parentLower.includes(p))) {
      reasons.push(`Anomalous parent process (${parentName} spawning ${process.name})`);
    }
  }

  // 6. Suspicious process names
  for (const suspiciousName of SUSPICIOUS_PROCESS_NAMES) {
    if (cmdLine.includes(suspiciousName) || name === suspiciousName) {
      reasons.push(`Recognized suspicious binary or signature (${suspiciousName})`);
      break;
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Constructs a hierarchical tree of processes from a flat list of process records.
 * Handles:
 * - Multi-root forests (e.g. system processes + explorer trees)
 * - Orphaned nodes (processes whose parent PID was not captured)
 * - Cycle detection and prevention
 * - Heuristic suspicion tagging
 */
export function buildProcessTree(
  processes: ProcessRecord[],
  options: BuildProcessTreeOptions = { highlightSuspicious: true }
): EdrProcessTreeNode[] {
  if (!processes || processes.length === 0) {
    return [];
  }

  // Map to hold nodes by PID and GUID
  const nodeMap = new Map<number, EdrProcessTreeNode>();
  const parentNameMap = new Map<number, string>();

  // Sort processes chronologically so parent processes are generally registered before children
  const sortedProcesses = [...processes].sort((a, b) => {
    return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
  });

  // Pre-populate parent name map
  for (const p of sortedProcesses) {
    parentNameMap.set(p.pid, p.name);
  }

  // Step 1: Initialize all tree nodes
  for (const p of sortedProcesses) {
    const parentName = p.ppid ? parentNameMap.get(p.ppid) : undefined;
    const suspicion = options.highlightSuspicious
      ? analyzeProcessSuspicion(p, parentName)
      : { isSuspicious: false, reasons: [] };

    const node: EdrProcessTreeNode = {
      id: p.id,
      pid: p.pid,
      ppid: p.ppid,
      process_guid: p.process_guid,
      parent_process_guid: p.parent_process_guid,
      name: p.name,
      executable_path: p.executable_path,
      command_line: p.command_line,
      username: p.username || "SYSTEM",
      sha256: p.sha256,
      started_at: p.started_at,
      ended_at: p.ended_at,
      integrity_level: p.integrity_level || "Medium",
      is_suspicious: suspicion.isSuspicious,
      suspicious_reasons: suspicion.reasons,
      event_count: 1,
      children: [],
    };

    nodeMap.set(p.pid, node);
  }

  // Step 2: Build tree relationships
  const rootNodes: EdrProcessTreeNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.ppid && nodeMap.has(node.ppid) && node.ppid !== node.pid) {
      const parent = nodeMap.get(node.ppid)!;
      // Cycle detection: ensure parent is not already a descendant of this node
      if (!isDescendant(node, parent.pid)) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      // Root or orphan node
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Checks if targetPid is already a descendant of node to prevent cyclic trees.
 */
function isDescendant(node: EdrProcessTreeNode, targetPid: number): boolean {
  for (const child of node.children) {
    if (child.pid === targetPid) return true;
    if (isDescendant(child, targetPid)) return true;
  }
  return false;
}

/**
 * Flattens a process tree back into a list of nodes with depth levels.
 */
export function flattenProcessTree(
  nodes: EdrProcessTreeNode[],
  depth = 0
): Array<{ node: EdrProcessTreeNode; depth: number }> {
  const result: Array<{ node: EdrProcessTreeNode; depth: number }> = [];

  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenProcessTree(node.children, depth + 1));
    }
  }

  return result;
}
