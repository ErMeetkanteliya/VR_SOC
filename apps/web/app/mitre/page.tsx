import React from "react";
import { MitreCenterWorkbench } from "@/components/mitre/MitreCenterWorkbench";
import {
  getMitreTactics,
  getMitreTechniques,
  getMitreCoverage,
  getActiveDetectionRules,
} from "@/lib/mitre/mitre-service";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { CANONICAL_MITRE_TACTICS, CANONICAL_MITRE_TECHNIQUES } from "@/lib/mitre/catalog";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "@/lib/detections/system-rules";

export const dynamic = "force-dynamic";

export default async function MitreCenterPage() {
  let orgId: string | undefined;

  try {
    const { organization } = await getActiveOrganization();
    orgId = organization?.id;
  } catch {
    // Session fallback
  }

  try {
    const [tactics, techniqueResult, coverageStats, rules] = await Promise.all([
      getMitreTactics(),
      getMitreTechniques({ pageSize: 150 }, orgId),
      getMitreCoverage(orgId),
      getActiveDetectionRules(orgId),
    ]);

    return (
      <MitreCenterWorkbench
        initialTactics={tactics}
        initialTechniques={techniqueResult.techniques}
        initialStats={coverageStats}
        initialRules={rules}
        organizationId={orgId}
      />
    );
  } catch {
    // Robust fallback to canonical data
    const fallbackStats = await getMitreCoverage();

    return (
      <MitreCenterWorkbench
        initialTactics={CANONICAL_MITRE_TACTICS}
        initialTechniques={CANONICAL_MITRE_TECHNIQUES}
        initialStats={fallbackStats}
        initialRules={CANONICAL_SYSTEM_DETECTION_RULES}
        organizationId={orgId}
      />
    );
  }
}
