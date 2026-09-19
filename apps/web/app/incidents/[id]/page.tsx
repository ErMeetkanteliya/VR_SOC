import React from "react";
import { notFound } from "next/navigation";
import { IncidentCenterWorkbench } from "@/components/incident-response/IncidentCenterWorkbench";
import {
  getIncidents,
  getIncidentById,
  getIncidentOverviewStats,
  getIncidentPlaybooks,
  getIncidentTasks,
  getIncidentHistory,
  getIncidentEvidence,
  getIncidentNotes,
} from "@/lib/incident-response/incident-service";
import { getActiveOrganization } from "@/lib/tenant/actions";
import {
  CANONICAL_INCIDENTS,
} from "@/lib/incident-response/catalog";

export const dynamic = "force-dynamic";

interface IncidentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  let orgId: string | undefined;

  try {
    const { organization } = await getActiveOrganization();
    orgId = organization?.id;
  } catch {
    // Session fallback
  }

  const incident = await getIncidentById(params.id, orgId);
  if (!incident) {
    // Check fallback
    const fallbackInc = CANONICAL_INCIDENTS.find(
      (i) => i.id === params.id || i.incident_code === params.id
    );
    if (!fallbackInc) {
      notFound();
    }
  }

  const activeId = incident?.id || params.id;

  const [{ incidents, total }, stats, playbooks, tasks, history, evidence, notes] = await Promise.all([
    getIncidents({}, orgId),
    getIncidentOverviewStats(orgId),
    getIncidentPlaybooks(),
    getIncidentTasks(activeId, orgId),
    getIncidentHistory(activeId, orgId),
    getIncidentEvidence(activeId, orgId),
    getIncidentNotes(activeId, orgId),
  ]);

  return (
    <IncidentCenterWorkbench
      initialIncidents={incidents}
      initialTotal={total}
      initialStats={stats}
      initialPlaybooks={playbooks}
      initialTasks={tasks}
      initialHistory={history}
      initialEvidence={evidence}
      initialNotes={notes}
      selectedIncidentId={activeId}
      organizationId={orgId}
    />
  );
}
