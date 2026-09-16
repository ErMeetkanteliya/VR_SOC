import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/alerts"
      title="Security Alerts & Triage Feed"
      category="Core SOC"
      description="Real-time correlated alert stream, risk scoring, analyst triage, and incident escalation."
      plannedPhase="Phase 14 — Security Alerts & Triage"
    />
  );
}
