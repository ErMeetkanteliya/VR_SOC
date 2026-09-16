import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARLivePage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/live"
      title="Live Playbook Execution"
      category="SOAR Orchestration"
      description="Real-time execution visualizer, active node state transitions, and step output inspection."
      plannedPhase="Phase 23 — Playbook Builder"
    />
  );
}
