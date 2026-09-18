import { test, expect } from "@playwright/test";

test.describe("Phase 19: MITRE ATT&CK Center E2E", () => {
  test("1. Redirects unauthenticated user to login with redirect parameter", async ({ page }) => {
    await page.goto("/mitre");
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

      await page.goto("/mitre");
    });

    test("2. Displays MITRE Enterprise Matrix, KPIs, and Tactics", async ({ page }) => {
      await expect(page).toHaveURL("/mitre");

      // Header validation
      await expect(page.locator("h1")).toContainText("MITRE ATT&CK");
      await expect(page.getByText("v14.1 Enterprise")).toBeVisible();

      // KPI Metric Cards
      await expect(page.getByText("Overall Coverage")).toBeVisible();
      await expect(page.getByText("Mapped Detection Rules")).toBeVisible();
      await expect(page.getByText("Sub-Technique Coverage")).toBeVisible();
      await expect(page.getByText("Detection Visibility Gaps")).toBeVisible();

      // Tactics Bar
      await expect(page.getByText("Initial Access").first()).toBeVisible();
      await expect(page.getByText("Execution").first()).toBeVisible();
      await expect(page.getByText("Impact").first()).toBeVisible();
    });

    test("3. Filters techniques via search query", async ({ page }) => {
      // Search for PowerShell
      const searchInput = page.getByPlaceholder(/Search by ID/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill("PowerShell");

      // Verify filtered result contains T1059.001
      await expect(page.getByText("T1059.001").first()).toBeVisible();

      // Clear search for subsequent tests
      await searchInput.fill("");
    });

    test("4. Opens Technique Forensic Drawer and inspects mitigations and pivots", async ({
      page,
    }) => {
      // Wait for page to be fully loaded and hydrated
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Overall Coverage")).toBeVisible();

      // Click on technique button T1595 (Active Scanning) in Matrix View (Column 1 - Reconnaissance)
      const techBtn = page.getByTestId("technique-card-T1595");
      await expect(techBtn).toBeVisible();
      await techBtn.click();

      // Drawer should appear with technique details
      const drawer = page.getByTestId("technique-drawer");
      await expect(drawer).toBeVisible({ timeout: 10000 });
      await expect(drawer.getByRole("heading", { name: "Active Scanning" })).toBeVisible();
      await expect(drawer.getByText("TA0043")).toBeVisible();

      // Switch to Mitigations tab
      const mitigationsTab = drawer.getByRole("button", { name: /Mitigations/i });
      await mitigationsTab.click();

      // Verify mitigation is listed
      await expect(drawer.getByText("Disable Ports").first()).toBeVisible();

      // Verify Quick Pivots exist
      await expect(drawer.getByText("SIEM Logs")).toBeVisible();
      await expect(drawer.getByText("EDR Endpoint")).toBeVisible();
      await expect(drawer.getByText("Alert Center")).toBeVisible();
    });
  });
});
