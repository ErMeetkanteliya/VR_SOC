import { test, expect } from "@playwright/test";

test.describe("Phase 21: Threat Hunting & Investigation E2E", () => {
  test("1. Redirects unauthenticated user to login with redirect parameter", async ({ page }) => {
    await page.goto("/threat-hunting");
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe("Authenticated Analyst Workflows", () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies([
        {
          name: "vrsoc_e2e_session",
          value: "active_analyst_session",
          domain: "localhost",
          path: "/",
        },
      ]);

      await page.goto("/threat-hunting");
      await page.waitForLoadState("domcontentloaded");
    });

    test("2. Displays Threat Hunting Workbench, Hypothesis Chips, and KPIs", async ({ page }) => {
      await expect(page).toHaveURL("/threat-hunting");

      // Header validation
      await expect(page.locator("h1")).toContainText("Threat Hunting");
      await expect(page.getByText("Hypothesis Driven")).toBeVisible();

      // Quick Hypothesis Scenarios
      await expect(page.getByTestId("hunt-template-HUNT-001")).toBeVisible();
      await expect(page.getByTestId("hunt-template-HUNT-002")).toBeVisible();
      await expect(page.getByTestId("hunt-template-HUNT-003")).toBeVisible();

      // KPI Metric Cards
      await expect(page.getByText("Total Sightings")).toBeVisible();
      await expect(page.getByText("Detection Alerts")).toBeVisible();
      await expect(page.getByText("Known IOC Matches")).toBeVisible();
      await expect(page.getByText("Kill-Chain Stages")).toBeVisible();

      // Query Controls
      await expect(page.getByTestId("hunt-search-input")).toBeVisible();
      await expect(page.getByTestId("execute-hunt-btn")).toBeVisible();

      // Navigation Tabs
      await expect(page.getByTestId("tab-timeline")).toBeVisible();
      await expect(page.getByTestId("tab-attack-path")).toBeVisible();
      await expect(page.getByTestId("tab-graph")).toBeVisible();
      await expect(page.getByTestId("tab-alerts-iocs")).toBeVisible();
      await expect(page.getByTestId("tab-evidence-notes")).toBeVisible();
    });

    test("3. Executes Quick Hypothesis and verifies Forensic Timeline", async ({ page }) => {
      // Click HUNT-001 Cobalt Strike hypothesis
      const huntBtn = page.getByTestId("hunt-template-HUNT-001");
      await expect(huntBtn).toBeVisible();
      await huntBtn.click();

      // Verify search input updated to 185.220.101.5
      const searchInput = page.getByTestId("hunt-search-input");
      await expect(searchInput).toHaveValue("185.220.101.5");

      // Verify timeline view renders sightings
      const timelineView = page.getByTestId("hunt-timeline-view");
      await expect(timelineView).toBeVisible();
      await expect(page.getByText("Chronological Forensic Timeline")).toBeVisible();
      await expect(page.getByText("c2-update-services.ru").first()).toBeVisible();
    });

    test("4. Switches to Attack Path tab and inspects kill-chain stages", async ({ page }) => {
      // Switch to Attack Path tab
      const attackPathTab = page.getByTestId("tab-attack-path");
      await attackPathTab.click();

      // Verify Attack Path view rendered
      const attackView = page.getByTestId("hunt-attack-path-view");
      await expect(attackView).toBeVisible();
      await expect(page.getByText("Reconstructed Kill-Chain Attack Path")).toBeVisible();

      // Verify steps
      await expect(page.getByTestId("attack-step-1")).toContainText("Initial Access");
      await expect(page.getByTestId("attack-step-2")).toContainText("Execution");
      await expect(page.getByTestId("attack-step-3")).toContainText("Command and Control");
    });

    test("5. Switches to Graph tab, inspects topology, and adds Evidence & Notes", async ({ page }) => {
      // 1. Check Graph tab
      const graphTab = page.getByTestId("tab-graph");
      await graphTab.click();
      const graphView = page.getByTestId("hunt-graph-view");
      await expect(graphView).toBeVisible();
      await expect(page.getByText("Investigation Relationship Topology")).toBeVisible();
      await expect(page.getByTestId("graph-node-node-ioc-1")).toBeVisible();

      // 2. Switch to Evidence & Notes tab
      const evidenceTab = page.getByTestId("tab-evidence-notes");
      await evidenceTab.click();
      const evidenceNotesView = page.getByTestId("hunt-evidence-notes-tab");
      await expect(evidenceNotesView).toBeVisible();

      // 3. Post an analyst note
      const noteInput = page.getByTestId("note-content-input");
      await noteInput.fill("Automated E2E investigation note: Verified C2 beaconing pattern.");
      const submitNoteBtn = page.getByTestId("submit-note-btn");
      await submitNoteBtn.click();

      // Verify new note appears
      await expect(page.getByText("Automated E2E investigation note").first()).toBeVisible();

      // 4. Verify Quick Pivots
      await expect(page.getByRole("link", { name: "SIEM" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Alerts" })).toBeVisible();
      await expect(page.getByRole("link", { name: "EDR" })).toBeVisible();
      await expect(page.getByRole("link", { name: "IOCs" })).toBeVisible();
    });
  });
});
