import { getDetectionRulesAction } from "@/lib/detections/actions";
import { CANONICAL_SYSTEM_DETECTION_RULES } from "@/lib/detections/system-rules";
import { DetectionRulesDashboard } from "@/components/detections/DetectionRulesDashboard";

export const dynamic = "force-dynamic";

export default async function DetectionsPage() {
  const rulesRes = await getDetectionRulesAction();

  // Fallback to system baseline rules if no custom tenant DB rules or not logged in yet
  const rules =
    rulesRes.success && rulesRes.data && rulesRes.data.length > 0
      ? rulesRes.data
      : CANONICAL_SYSTEM_DETECTION_RULES;

  return <DetectionRulesDashboard initialRules={rules} />;
}
