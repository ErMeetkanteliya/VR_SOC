import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOAREnrichmentPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/enrichment"
      title="Threat Intelligence Enrichment"
      category="SOAR Orchestration"
      description="Automated IP/domain reputation lookup, sandbox detonations, and threat feed correlation."
      plannedPhase="Phase 24 — Threat Enrichment"
    />
  );
}
