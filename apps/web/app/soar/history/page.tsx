import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARHistoryPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/history"
      title="Playbook Execution History"
      category="SOAR Orchestration"
      description="Historical run logs, node execution timings, output payloads, and audit trails."
      plannedPhase="Phase 22 — Playbooks Hub"
    />
  );
}
