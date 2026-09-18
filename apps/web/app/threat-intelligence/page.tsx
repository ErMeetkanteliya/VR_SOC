import React from "react";
import { ThreatIntelWorkbench } from "@/components/threat-intel/ThreatIntelWorkbench";
import {
  getThreatIndicators,
  getIocOverviewStats,
} from "@/lib/threat-intel/threat-intel-service";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  CANONICAL_THREAT_INDICATORS,
  CANONICAL_IOC_RELATIONSHIPS,
  calculateIocOverviewStats,
} from "@/lib/threat-intel/catalog";

export const dynamic = "force-dynamic";

export default async function ThreatIntelligencePage() {
  let orgId: string | undefined;

  try {
    const { organization } = await getActiveOrganization();
    orgId = organization?.id;
  } catch {
    // Session fallback
  }

  try {
    const [result, stats] = await Promise.all([
      getThreatIndicators({ pageSize: 50 }, orgId),
      getIocOverviewStats(orgId),
    ]);

    return (
      <ThreatIntelWorkbench
        initialIndicators={result.indicators}
        initialTotal={result.total}
        initialStats={stats}
        organizationId={orgId}
      />
    );
  } catch {
    // Robust fallback to canonical intelligence catalog
    const fallbackStats = calculateIocOverviewStats(
      CANONICAL_THREAT_INDICATORS,
      CANONICAL_IOC_RELATIONSHIPS
    );

    return (
      <ThreatIntelWorkbench
        initialIndicators={CANONICAL_THREAT_INDICATORS}
        initialTotal={CANONICAL_THREAT_INDICATORS.length}
        initialStats={fallbackStats}
        organizationId={orgId}
      />
    );
  }
}
