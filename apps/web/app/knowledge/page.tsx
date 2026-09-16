import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function KnowledgePage() {
  return (
    <PlaceholderModulePage
      currentPath="/knowledge"
      title="Knowledge Center"
      category="Core SOC"
      description="SOC playbooks reference, threat intel dossiers, scenario documentation, and training guides."
      plannedPhase="Phase 29 — Knowledge Center"
    />
  );
}
