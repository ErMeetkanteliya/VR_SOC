import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARBuilderPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/builder"
      title="Visual Playbook Builder"
      category="SOAR Orchestration"
      description="Drag-and-drop workflow canvas, conditional branching, decision nodes, and action integrations."
      plannedPhase="Phase 23 — Playbook Builder"
    />
  );
}
