import React from "react";
import { ThreatHuntingWorkbench } from "@/components/threat-hunting/ThreatHuntingWorkbench";
import {
  executeHuntQuery,
  getHuntEvidence,
  getHuntNotes,
} from "@/lib/threat-hunting/hunting-service";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  CANONICAL_HUNT_EVIDENCE,
  CANONICAL_HUNT_NOTES,
} from "@/lib/threat-hunting/catalog";

export const dynamic = "force-dynamic";

export default async function ThreatHuntingPage() {
  let orgId: string | undefined;

  try {
    const { organization } = await getActiveOrganization();
    orgId = organization?.id;
  } catch {
    // Session fallback
  }

  try {
    const [huntResult, evidence, notes] = await Promise.all([
      executeHuntQuery({ query: "185.220.101.5", hunt_type: "ioc", time_range: "24h" }, orgId),
      getHuntEvidence(undefined, orgId),
      getHuntNotes(undefined, orgId),
    ]);

    return (
      <ThreatHuntingWorkbench
        initialResult={huntResult}
        initialEvidence={evidence}
        initialNotes={notes}
        organizationId={orgId}
      />
    );
  } catch {
    // Robust fallback to canonical simulation dataset
    const fallbackResult = await executeHuntQuery({ query: "185.220.101.5", hunt_type: "ioc", time_range: "24h" });

    return (
      <ThreatHuntingWorkbench
        initialResult={fallbackResult}
        initialEvidence={CANONICAL_HUNT_EVIDENCE}
        initialNotes={CANONICAL_HUNT_NOTES}
        organizationId={orgId}
      />
    );
  }
}
