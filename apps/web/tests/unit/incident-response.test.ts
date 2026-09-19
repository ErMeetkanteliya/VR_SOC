import { describe, it, expect } from "vitest";
import {
  IncidentStageSchema,
  IncidentPrioritySchema,
  IncidentStatusSchema,
  IncidentTaskStatusSchema,
  CreateIncidentInputSchema,
  DeclareIncidentFromAlertInputSchema,
  TransitionIncidentStageInputSchema,
  CreateIncidentEvidenceInputSchema,
  CloseIncidentInputSchema,
} from "@vrsoc/validation";
import {
  isValidStageTransition,
  createIncident,
  declareIncidentFromAlert,
  transitionIncidentStage,
  closeIncident,
  getIncidentPlaybooks,
  getIncidentTasks,
  createIncidentTask,
  updateIncidentTask,
  getIncidentHistory,
  getIncidentEvidence,
  createIncidentEvidence,
  deleteIncidentEvidence,
  getIncidentNotes,
  createIncidentNote,
  deleteIncidentNote,
} from "@/lib/incident-response/incident-service";
import { hasPermission } from "@/lib/rbac/permissions";
import type { IncidentStage } from "@vrsoc/types";

describe("Phase 22 — Incident Response Domain Unit & Integration Tests", () => {
  describe("1. Schema & Contract Validation", () => {
    it("validates all supported IncidentStage values", () => {
      const validStages: IncidentStage[] = [
        "Detection",
        "Analysis",
        "Containment",
        "Eradication",
        "Recovery",
        "Lessons Learned",
        "Closed",
      ];
      for (const stg of validStages) {
        expect(IncidentStageSchema.parse(stg)).toBe(stg);
      }
      expect(() => IncidentStageSchema.parse("UnknownStage")).toThrow();
    });

    it("validates IncidentPriority values", () => {
      const validPriorities = ["P1", "P2", "P3", "P4", "Critical", "High", "Medium", "Low"];
      for (const p of validPriorities) {
        expect(IncidentPrioritySchema.parse(p)).toBe(p);
      }
      expect(() => IncidentPrioritySchema.parse("P99")).toThrow();
    });

    it("validates IncidentStatus and IncidentTaskStatus values", () => {
      expect(IncidentStatusSchema.parse("Open")).toBe("Open");
      expect(IncidentStatusSchema.parse("Contained")).toBe("Contained");
      expect(IncidentStatusSchema.parse("Closed")).toBe("Closed");
      expect(() => IncidentStatusSchema.parse("ArchivedState")).toThrow();

      expect(IncidentTaskStatusSchema.parse("pending")).toBe("pending");
      expect(IncidentTaskStatusSchema.parse("in_progress")).toBe("in_progress");
      expect(IncidentTaskStatusSchema.parse("completed")).toBe("completed");
      expect(IncidentTaskStatusSchema.parse("skipped")).toBe("skipped");
      expect(() => IncidentTaskStatusSchema.parse("failed")).toThrow();
    });

    it("validates CreateIncidentInputSchema and bounds defaults", () => {
      const valid = CreateIncidentInputSchema.parse({
        title: "Active Cobalt Strike C2 Outbreak",
        severity: "Critical",
        priority: "P1",
      });
      expect(valid.title).toBe("Active Cobalt Strike C2 Outbreak");
      expect(valid.severity).toBe("Critical");
      expect(valid.priority).toBe("P1");
      expect(valid.stage).toBe("Detection");

      // Rejects empty title
      expect(() => CreateIncidentInputSchema.parse({ title: "" })).toThrow();
    });

    it("validates DeclareIncidentFromAlertInputSchema", () => {
      const valid = DeclareIncidentFromAlertInputSchema.parse({
        alert_id: "alert-hunt-001",
        title: "Escalated from Cobalt Strike Beaconing",
        priority: "P1",
      });
      expect(valid.alert_id).toBe("alert-hunt-001");
      expect(valid.priority).toBe("P1");

      // Rejects empty alert_id
      expect(() => DeclareIncidentFromAlertInputSchema.parse({ alert_id: "" })).toThrow();
    });

    it("validates TransitionIncidentStageInputSchema", () => {
      const valid = TransitionIncidentStageInputSchema.parse({
        incident_id: "inc-001",
        new_stage: "Containment",
        rationale: "Host isolated via EDR agent.",
      });
      expect(valid.new_stage).toBe("Containment");

      expect(() =>
        TransitionIncidentStageInputSchema.parse({
          incident_id: "",
          new_stage: "Containment",
        })
      ).toThrow();
    });

    it("validates CreateIncidentEvidenceInputSchema", () => {
      const valid = CreateIncidentEvidenceInputSchema.parse({
        incident_id: "inc-001",
        target_type: "socket",
        target_id: "185.220.101.5:443",
        summary: "Cobalt Strike Outbound TLS Beacon",
        confidence: 98,
      });
      expect(valid.target_type).toBe("socket");
      expect(valid.confidence).toBe(98);

      // Rejects invalid target_type
      expect(() =>
        CreateIncidentEvidenceInputSchema.parse({
          incident_id: "inc-001",
          target_type: "invalid_type",
          target_id: "185.220.101.5:443",
          summary: "test",
        })
      ).toThrow();
    });

    it("validates CloseIncidentInputSchema", () => {
      const valid = CloseIncidentInputSchema.parse({
        incident_id: "inc-001",
        closure_reason: "Remediation verified clean.",
      });
      expect(valid.closure_reason).toBe("Remediation verified clean.");

      expect(() =>
        CloseIncidentInputSchema.parse({
          incident_id: "inc-001",
          closure_reason: "",
        })
      ).toThrow();
    });
  });

  describe("2. State Machine & Lifecycle Transitions", () => {
    it("validates allowed lifecycle state transitions", () => {
      expect(isValidStageTransition("Detection", "Analysis")).toBe(true);
      expect(isValidStageTransition("Detection", "Containment")).toBe(true);
      expect(isValidStageTransition("Analysis", "Containment")).toBe(true);
      expect(isValidStageTransition("Containment", "Eradication")).toBe(true);
      expect(isValidStageTransition("Eradication", "Recovery")).toBe(true);
      expect(isValidStageTransition("Recovery", "Lessons Learned")).toBe(true);
      expect(isValidStageTransition("Lessons Learned", "Closed")).toBe(true);
      expect(isValidStageTransition("Detection", "Detection")).toBe(true);
    });

    it("rejects invalid forward stage jumps", () => {
      expect(isValidStageTransition("Detection", "Recovery")).toBe(false);
      expect(isValidStageTransition("Detection", "Eradication")).toBe(false);
      expect(isValidStageTransition("Detection", "Lessons Learned")).toBe(false);
      expect(isValidStageTransition("Analysis", "Recovery")).toBe(false);
    });

    it("transitions incident lifecycle stage and records audit history", async () => {
      const inc = await createIncident({
        title: "Test Lifecycle State Machine",
        severity: "Critical",
        stage: "Detection",
      });

      // Advance Detection -> Analysis
      const res1 = await transitionIncidentStage({
        incident_id: inc.id,
        new_stage: "Analysis",
        rationale: "Initial alert verified by analyst.",
      });
      expect(res1.success).toBe(true);
      expect(res1.incident?.stage).toBe("Analysis");
      expect(res1.incident?.stage_timestamps.Analysis).toBeDefined();

      // Advance Analysis -> Containment
      const res2 = await transitionIncidentStage({
        incident_id: inc.id,
        new_stage: "Containment",
        rationale: "Patient zero isolated from network.",
      });
      expect(res2.success).toBe(true);
      expect(res2.incident?.stage).toBe("Containment");
      expect(res2.incident?.status).toBe("Contained");

      // Verify audit history generated
      const history = await getIncidentHistory(inc.id);
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history.some((h) => h.new_stage === "Containment")).toBe(true);
    });

    it("rejects invalid stage transition with descriptive error", async () => {
      const inc = await createIncident({
        title: "Test Invalid Jump",
        stage: "Detection",
      });

      const res = await transitionIncidentStage({
        incident_id: inc.id,
        new_stage: "Lessons Learned",
        rationale: "Attempting invalid leap.",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid lifecycle transition");
    });
  });

  describe("3. Playbooks & Checklist Execution", () => {
    it("returns canonical defensive playbooks", async () => {
      const playbooks = await getIncidentPlaybooks();
      expect(playbooks.length).toBe(3);
      expect(playbooks.some((p) => p.id === "PB-MAL-001")).toBe(true);
      expect(playbooks.some((p) => p.id === "PB-RAN-002")).toBe(true);
      expect(playbooks.some((p) => p.id === "PB-CRED-003")).toBe(true);
    });

    it("instantiates playbook checklist tasks for new incident", async () => {
      const inc = await createIncident({
        title: "Malware Outbreak Incident",
        playbook_id: "PB-MAL-001",
      });

      const tasks = await getIncidentTasks(inc.id);
      expect(tasks.length).toBe(6);
      expect(tasks.some((t) => t.stage === "Detection")).toBe(true);
      expect(tasks.some((t) => t.stage === "Containment")).toBe(true);
      expect(tasks.some((t) => t.stage === "Lessons Learned")).toBe(true);
    });

    it("updates checklist task status and records completion metadata", async () => {
      const inc = await createIncident({
        title: "Checklist Task Test",
        playbook_id: "PB-MAL-001",
      });

      const tasks = await getIncidentTasks(inc.id);
      const task1 = tasks[0]!;

      const updated = await updateIncidentTask({
        id: task1.id,
        status: "completed",
        completed_by: "Alex Mercer",
        notes: "Firewall rules confirmed active.",
      });

      expect(updated?.status).toBe("completed");
      expect(updated?.completed_by).toBe("Alex Mercer");
      expect(updated?.completed_at).toBeDefined();
      expect(updated?.notes).toContain("Firewall rules");
    });

    it("adds custom task to incident checklist", async () => {
      const inc = await createIncident({
        title: "Custom Task Incident",
      });

      const customTask = await createIncidentTask({
        incident_id: inc.id,
        stage: "Containment",
        title: "Revoke Okta Session Tokens",
        description: "Force logout all active cloud identity sessions.",
      });

      expect(customTask.id).toBeDefined();
      expect(customTask.title).toBe("Revoke Okta Session Tokens");
      expect(customTask.stage).toBe("Containment");

      const tasks = await getIncidentTasks(inc.id);
      expect(tasks.some((t) => t.id === customTask.id)).toBe(true);
    });
  });

  describe("4. Alert Hand-off & Incident Declaration", () => {
    it("declares incident from an alert and attaches initial evidence", async () => {
      const inc = await declareIncidentFromAlert({
        alert_id: "alert-hunt-001",
        title: "Escalated: Cobalt Strike Outbreak",
        severity: "Critical",
        priority: "P1",
        rationale: "Correlated beaconing activity with phishing dropper.",
      });

      expect(inc.id).toBeDefined();
      expect(inc.incident_code).toMatch(/^INC-\d{4}-\d{3}$/);
      expect(inc.source_alert_id).toBe("alert-hunt-001");
      expect(inc.source_alert_ids).toContain("alert-hunt-001");
      expect(inc.severity).toBe("Critical");
      expect(inc.priority).toBe("P1");

      // Verify source alert attached as initial evidence
      const evidence = await getIncidentEvidence(inc.id);
      expect(evidence.length).toBeGreaterThanOrEqual(1);
      expect(evidence[0]!.target_type).toBe("alert");
      expect(evidence[0]!.target_id).toBe("alert-hunt-001");

      // Verify playbook tasks created
      const tasks = await getIncidentTasks(inc.id);
      expect(tasks.length).toBe(6);
    });

    it("closes incident with formal reason and updates history", async () => {
      const inc = await createIncident({
        title: "Closure Test Incident",
        severity: "High",
      });

      const closed = await closeIncident({
        incident_id: inc.id,
        closure_reason: "Malware removed and endpoint restored.",
        closure_notes: "Root cause verified. No further indicators observed.",
        actor_name: "Incident Lead",
      });

      expect(closed?.stage).toBe("Closed");
      expect(closed?.status).toBe("Closed");
      expect(closed?.closed_at).toBeDefined();
      expect(closed?.closure_reason).toContain("Malware removed");

      const history = await getIncidentHistory(inc.id);
      expect(history.some((h) => h.action_type === "closed")).toBe(true);
    });
  });

  describe("5. Evidence & Analyst Notes Management", () => {
    it("creates, retrieves, and deletes incident evidence references", async () => {
      const inc = await createIncident({ title: "Evidence Test Incident" });

      const evid = await createIncidentEvidence({
        incident_id: inc.id,
        target_type: "socket",
        target_id: "185.220.101.5:443",
        summary: "Outbound C2 Socket",
        confidence: 95,
      });

      expect(evid.id).toBeDefined();
      expect(evid.target_type).toBe("socket");

      const list = await getIncidentEvidence(inc.id);
      expect(list.some((e) => e.id === evid.id)).toBe(true);

      const deleted = await deleteIncidentEvidence(evid.id);
      expect(deleted).toBe(true);

      const afterDelete = await getIncidentEvidence(inc.id);
      expect(afterDelete.some((e) => e.id === evid.id)).toBe(false);
    });

    it("creates, retrieves, and deletes incident notes", async () => {
      const inc = await createIncident({ title: "Notes Test Incident" });

      const note = await createIncidentNote({
        incident_id: inc.id,
        content: "Memory dump analysis confirmed Beacon payload in thread 4820.",
        tags: ["Forensics", "Beacon"],
      });

      expect(note.id).toBeDefined();
      expect(note.content).toContain("Memory dump analysis");
      expect(note.tags).toHaveLength(2);

      const notes = await getIncidentNotes(inc.id);
      expect(notes.some((n) => n.id === note.id)).toBe(true);

      const deleted = await deleteIncidentNote(note.id);
      expect(deleted).toBe(true);

      const afterDelete = await getIncidentNotes(inc.id);
      expect(afterDelete.some((n) => n.id === note.id)).toBe(false);
    });
  });

  describe("6. RBAC Role Matrix for Incident Response", () => {
    it("evaluates Incident Responder and SOC Lead permissions", () => {
      expect(hasPermission("Incident Responder", "incidents:read")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:create")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:update_status")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:assign")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:stage")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:task")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:note")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:evidence")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:playbook")).toBe(true);
      expect(hasPermission("Incident Responder", "incidents:close")).toBe(true);

      expect(hasPermission("Super Admin", "incidents:close")).toBe(true);
      expect(hasPermission("SOC Analyst", "incidents:create")).toBe(true);
      expect(hasPermission("SOC Analyst", "incidents:close")).toBe(false);

      expect(hasPermission("Student", "incidents:read")).toBe(true);
      expect(hasPermission("Student", "incidents:task")).toBe(true);
      expect(hasPermission("Student", "incidents:close")).toBe(false);

      expect(hasPermission("Auditor", "incidents:read")).toBe(true);
      expect(hasPermission("Auditor", "incidents:create")).toBe(false);

      expect(hasPermission("Viewer", "incidents:read")).toBe(false);
      expect(hasPermission("Viewer", "incidents:create")).toBe(false);
    });
  });
});
