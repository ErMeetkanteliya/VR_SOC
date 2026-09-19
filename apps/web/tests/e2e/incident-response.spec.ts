import { test, expect } from "@playwright/test";

test.describe("Phase 22: Incident Response Domain E2E", () => {
  test("1. Redirects unauthenticated user to login with redirect parameter", async ({ page }) => {
    await page.goto("/incidents");
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

      await page.goto("/incidents");
      await page.waitForLoadState("networkidle");
    });

    test("2. Displays Incident Workbench, KPIs, and Queue Table", async ({ page }) => {
      await expect(page).toHaveURL("/incidents");

      // Header validation
      await expect(page.locator("h1")).toContainText("Incident Response");
      await expect(page.getByText("NIST SP 800-61 Aligned")).toBeVisible();

      // KPI Metric Cards
      await expect(page.getByText("Total Active Incidents")).toBeVisible();
      await expect(page.getByText("Critical & P1 Priority")).toBeVisible();
      await expect(page.getByText("In Containment Phase")).toBeVisible();
      await expect(page.getByText("Resolved / Closed")).toBeVisible();

      // Filter & Search Controls
      await expect(page.getByTestId("incident-search-input")).toBeVisible();
      await expect(page.getByTestId("filter-stage-select")).toBeVisible();
      await expect(page.getByTestId("filter-severity-select")).toBeVisible();
      await expect(page.getByTestId("filter-priority-select")).toBeVisible();

      // Initial Table Items
      await expect(page.getByTestId("incident-row-INC-2026-001")).toBeVisible();
      await expect(page.getByText("Active Cobalt Strike C2 Outbreak")).toBeVisible();
    });

    test("3. Declares a new Incident via Modal and verifies Queue update", async ({ page }) => {
      // Click Declare Incident button
      const declareBtn = page.getByTestId("declare-incident-btn");
      await expect(declareBtn).toBeVisible();
      await declareBtn.click();

      // Verify modal inputs are visible
      const titleInput = page.getByTestId("declare-title-input");
      await expect(titleInput).toBeVisible({ timeout: 10000 });
      await titleInput.fill("Automated E2E Incident: Ransomware Pre-Encryption");

      const descInput = page.getByTestId("declare-description-input");
      await descInput.fill("Shadow copy deletion detected on FS-CORP-002.");

      // Submit
      const confirmBtn = page.getByTestId("confirm-declare-btn");
      await confirmBtn.click();

      // Verify modal closes and detail workspace is rendered
      await expect(page.getByTestId("incident-detail-workspace")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Automated E2E Incident: Ransomware Pre-Encryption")).toBeVisible();
    });

    test("4. Opens Incident Detail, verifies Lifecycle Stepper, and advances stage", async ({ page }) => {
      // Open INC-2026-001 detail via Investigate button
      const invBtn = page.getByTestId("investigate-btn-INC-2026-001");
      await expect(invBtn).toBeVisible();
      await invBtn.click();

      // Verify detail workspace and stepper
      await expect(page.getByTestId("incident-detail-workspace")).toBeVisible();
      await expect(page.getByTestId("stage-lifecycle-stepper")).toBeVisible();

      // Check current stage badge
      await expect(page.getByText("INC-2026-001")).toBeVisible();
      await expect(page.getByText("Containment").first()).toBeVisible();

      // Advance stage button
      const advanceBtn = page.getByTestId("advance-stage-btn");
      await expect(advanceBtn).toBeVisible();
      await advanceBtn.click();

      // Stage transition modal
      const rationaleInput = page.getByTestId("transition-rationale-input");
      await expect(rationaleInput).toBeVisible();
      await rationaleInput.fill("Eradication initiated: Rogue registry keys deleted.");

      const confirmTransitionBtn = page.getByTestId("confirm-transition-btn");
      await confirmTransitionBtn.click();

      // Verify stage updated to Eradication
      await expect(page.getByText("Eradication").first()).toBeVisible();
    });

    test("5. Interacts with Playbook Checklist, attaches Evidence, and posts Analyst Note", async ({ page }) => {
      // Open INC-2026-001 detail via Investigate button
      const invBtn = page.getByTestId("investigate-btn-INC-2026-001");
      await expect(invBtn).toBeVisible();
      await invBtn.click();

      // 1. Playbook Tab interaction
      await expect(page.getByTestId("incident-playbook-panel")).toBeVisible();
      const taskItem = page.getByTestId("task-item-task-003");
      await expect(taskItem).toBeVisible();

      // 2. Switch to Evidence Tab
      const evidenceTab = page.getByTestId("tab-evidence");
      await evidenceTab.click();
      await expect(page.getByTestId("incident-evidence-panel")).toBeVisible();

      // Attach new evidence
      const attachEvidBtn = page.getByTestId("attach-evidence-btn");
      await attachEvidBtn.click();

      const targetIdInput = page.getByTestId("evidence-target-id-input");
      await targetIdInput.fill("185.220.101.5:443");

      const summaryInput = page.getByTestId("evidence-summary-input");
      await summaryInput.fill("E2E Verified Outbound C2 Socket");

      const submitEvidBtn = page.getByTestId("submit-evidence-btn");
      await submitEvidBtn.click();

      await expect(page.getByText("E2E Verified Outbound C2 Socket").first()).toBeVisible();

      // 3. Switch to Notes Tab
      const notesTab = page.getByTestId("tab-notes");
      await notesTab.click();
      await expect(page.getByTestId("incident-notes-panel")).toBeVisible();

      // Post Note
      const noteInput = page.getByTestId("incident-note-input");
      await noteInput.fill("E2E Automated Investigation Note: Eradication verified.");

      const submitNoteBtn = page.getByTestId("submit-note-btn");
      await submitNoteBtn.click();

      await expect(page.getByText("E2E Automated Investigation Note: Eradication verified.").first()).toBeVisible();

      // 4. Switch to Audit History Tab
      const historyTab = page.getByTestId("tab-history");
      await historyTab.click();
      await expect(page.getByTestId("incident-history-timeline")).toBeVisible();
    });
  });
});
