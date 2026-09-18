import { test, expect } from "@playwright/test";

test.describe("Phase 17 — EDR Investigation Workbench E2E Tests", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/edr");
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

      await page.goto("/edr");
    });

    test("renders EDR Workbench header, KPI cards, and endpoint selector", async ({ page }) => {
      // Header & Breadcrumbs
      await expect(page.locator("h1")).toContainText("EDR Investigation Workbench");
      await expect(page.getByText("Deep endpoint inspection, hierarchical process telemetry")).toBeVisible();

      // KPI Metric cards
      await expect(page.getByText("Running Processes")).toBeVisible();
      await expect(page.getByText("Network Sockets")).toBeVisible();
      await expect(page.getByText("Registry Keys")).toBeVisible();
      await expect(page.getByText("Persistence Items")).toBeVisible();

      // Endpoint Selector & Simulate EDR button
      await expect(page.getByText("Select Endpoint:")).toBeVisible();
      await expect(page.getByRole("button", { name: "Simulate EDR Telemetry" })).toBeVisible();
    });

    test("renders interactive Process Tree and allows inspecting suspicious nodes", async ({ page }) => {
      // Process tree container
      await expect(page.getByText("Process Execution Tree")).toBeVisible();

      // Verify explorer tree nodes exist
      const processNode = page.locator(".font-mono.text-white").first();
      await expect(processNode).toBeVisible();

      // Check for tree search filter
      const searchInput = page.getByPlaceholder("Search processes by name, PID, or hash...");
      await expect(searchInput).toBeVisible();
      await searchInput.fill("powershell");
      await expect(searchInput).toHaveValue("powershell");
    });

    test("switches between forensic activity tabs", async ({ page }) => {
      // Switch to File Activity tab
      await page.getByRole("tab", { name: /File Activity/i }).click();
      await expect(page.getByText("Endpoint File Activity")).toBeVisible();

      // Switch to Network Sockets tab
      await page.getByRole("tab", { name: /Network Sockets/i }).click();
      await expect(page.getByText("Active Network Sockets & Connections")).toBeVisible();

      // Switch to Registry Changes tab
      await page.getByRole("tab", { name: /Registry Changes/i }).click();
      await expect(page.getByText("Registry Modifications & Persistence Keys")).toBeVisible();

      // Switch to Services & Tasks tab
      await page.getByRole("tab", { name: /Services & Tasks/i }).click();
      await expect(page.getByText("Endpoint System Services")).toBeVisible();
      await expect(page.getByText("Scheduled Tasks")).toBeVisible();

      // Switch to Startup & USB tab
      await page.getByRole("tab", { name: /Startup & USB/i }).click();
      await expect(page.getByText("Startup Programs & Autoruns")).toBeVisible();
      await expect(page.getByText("USB & Removable Storage Events")).toBeVisible();

      // Switch to Timeline tab
      await page.getByRole("tab", { name: /Chronological Timeline/i }).click();
      await expect(page.getByText("Unified Forensic Event Stream")).toBeVisible();

      // Switch to Related Alerts tab
      await page.getByRole("tab", { name: /Related Alerts/i }).click();
      await expect(page.getByText("Correlated Threat Detections")).toBeVisible();
    });

    test("opens and closes Simulate EDR Telemetry modal", async ({ page }) => {
      const simulateBtn = page.getByRole("button", { name: "Simulate EDR Telemetry" });
      await expect(simulateBtn).toBeVisible();
      await simulateBtn.click();

      // Modal should be visible
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Simulate Safe EDR Telemetry")).toBeVisible();
      await expect(page.getByText("Educational & Defensive Endpoint Scenarios")).toBeVisible();

      // Select scenario option
      await expect(page.getByText("Process Masquerading (cmd.exe in %TEMP%)")).toBeVisible();

      // Close modal
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });
});
