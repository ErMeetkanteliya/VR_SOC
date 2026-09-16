import { describe, it, expect } from "vitest";
import { generateBreadcrumbs } from "@/lib/navigation/breadcrumbs";
import { BASE44_NAV_GROUPS, getAccessibleNavGroups } from "@/lib/navigation/config";
import type { UserRole } from "@vrsoc/types";

describe("Application Shell Unit Tests", () => {
  describe("generateBreadcrumbs", () => {
    it("generates root breadcrumb for '/'", () => {
      const breadcrumbs = generateBreadcrumbs("/");
      expect(breadcrumbs).toEqual([{ label: "Dashboard", href: "/" }]);
    });

    it("generates single-segment breadcrumb for '/agents'", () => {
      const breadcrumbs = generateBreadcrumbs("/agents");
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0]).toEqual({ label: "Dashboard", href: "/" });
      expect(breadcrumbs[1]).toEqual({ label: "Agents (EDR)", href: undefined });
    });

    it("generates multi-segment breadcrumb for '/soar/automation'", () => {
      const breadcrumbs = generateBreadcrumbs("/soar/automation");
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0]).toEqual({ label: "Dashboard", href: "/" });
      expect(breadcrumbs[1]).toEqual({ label: "SOAR Dashboard", href: "/soar" });
      expect(breadcrumbs[2]).toEqual({ label: "Automation Pipeline", href: undefined });
    });

    it("formats unknown segments cleanly with capitalization", () => {
      const breadcrumbs = generateBreadcrumbs("/custom-section/sub-feature");
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[1]).toEqual({ label: "Custom Section", href: "/custom-section" });
      expect(breadcrumbs[2]).toEqual({ label: "Sub Feature", href: undefined });
    });
  });

  describe("BASE44_NAV_GROUPS Configuration", () => {
    it("defines Core Operations and SOAR Orchestration groups", () => {
      expect(BASE44_NAV_GROUPS).toHaveLength(2);
      expect(BASE44_NAV_GROUPS[0]?.title).toBe("Core Operations");
      expect(BASE44_NAV_GROUPS[1]?.title).toBe("SOAR Orchestration");
    });

    it("contains all core operational SOC items", () => {
      const coreHrefs = BASE44_NAV_GROUPS[0]?.items.map((i) => i.href) || [];
      expect(coreHrefs).toContain("/");
      expect(coreHrefs).toContain("/agents");
      expect(coreHrefs).toContain("/alerts");
      expect(coreHrefs).toContain("/incidents");
      expect(coreHrefs).toContain("/detections");
      expect(coreHrefs).toContain("/mitre");
      expect(coreHrefs).toContain("/logs");
      expect(coreHrefs).toContain("/cases");
      expect(coreHrefs).toContain("/analytics");
      expect(coreHrefs).toContain("/ai-assistant");
      expect(coreHrefs).toContain("/knowledge");
      expect(coreHrefs).toContain("/settings");
    });

    it("contains all SOAR orchestration items", () => {
      const soarHrefs = BASE44_NAV_GROUPS[1]?.items.map((i) => i.href) || [];
      expect(soarHrefs).toContain("/soar");
      expect(soarHrefs).toContain("/soar/automation");
      expect(soarHrefs).toContain("/soar/playbooks");
      expect(soarHrefs).toContain("/soar/builder");
      expect(soarHrefs).toContain("/soar/simulation");
    });
  });

  describe("getAccessibleNavGroups RBAC Filtering", () => {
    it("returns all items for Super Admin role", () => {
      const groups = getAccessibleNavGroups("Super Admin" as UserRole);
      const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
      const allBaseItems = BASE44_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
      expect(totalItems).toBe(allBaseItems);
    });

    it("filters out settings and sensitive management for Student role", () => {
      const groups = getAccessibleNavGroups("Student" as UserRole);
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
      
      // Student has read access to simulation and knowledge, but NOT org settings or playbook builder
      expect(allHrefs).not.toContain("/settings");
      expect(allHrefs).not.toContain("/soar/builder");
      expect(allHrefs).toContain("/soar/simulation");
      expect(allHrefs).toContain("/knowledge");
    });

    it("allows SOC Analyst to access alerts, incidents, cases, logs, and SOAR", () => {
      const groups = getAccessibleNavGroups("SOC Analyst" as UserRole);
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

      expect(allHrefs).toContain("/alerts");
      expect(allHrefs).toContain("/incidents");
      expect(allHrefs).toContain("/cases");
      expect(allHrefs).toContain("/logs");
      expect(allHrefs).toContain("/soar");
      expect(allHrefs).not.toContain("/settings");
    });

    it("restricts Viewer to read-only paths and hides admin controls", () => {
      const groups = getAccessibleNavGroups("Viewer" as UserRole);
      const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));

      expect(allHrefs).toContain("/");
      expect(allHrefs).not.toContain("/settings");
      expect(allHrefs).not.toContain("/soar/builder");
      expect(allHrefs).not.toContain("/soar/actions");
    });
  });
});
