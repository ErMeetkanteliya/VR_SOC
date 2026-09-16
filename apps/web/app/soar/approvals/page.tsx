import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARApprovalsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/approvals"
      title="Human-in-the-Loop Approvals"
      category="SOAR Orchestration"
      description="Pending approval queue for high-impact containment actions and isolation playbooks."
      plannedPhase="Phase 21 — Automation Pipeline"
    />
  );
}
