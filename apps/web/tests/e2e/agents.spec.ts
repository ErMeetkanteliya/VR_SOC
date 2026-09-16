import { test, expect } from "@playwright/test";

test.describe("Phase 11 — Agent Management E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authenticated E2E cookie
    await context.addCookies([
      {
        name: "vrsoc_e2e_session",
        value: "active_analyst_session",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/agents");
  });

  test("renders Agent Management dashboard with breadcrumbs, title, and KPI metric cards", async ({ page }) => {
    // Title & description
    await expect(page.locator("h1")).toContainText("Endpoint Fleet & Sensor Management");
    await expect(page.getByText("Enterprise EDR sensors, telemetry health monitoring")).toBeVisible();

    // KPI Metric cards
    await expect(page.getByText("Total Fleet Agents")).toBeVisible();
    await expect(page.getByText("Online Sensors")).toBeVisible();
    await expect(page.getByText("Network Isolated")).toBeVisible();
    await expect(page.getByText("Fleet Avg CPU / RAM")).toBeVisible();
  });

  test("renders search input, filter dropdowns, and quick status pills", async ({ page }) => {
    // Search input
    const searchInput = page.getByPlaceholder("Search by hostname, IP address, OS, or version...");
    await expect(searchInput).toBeVisible();

    // Quick status filter pills
    await expect(page.getByRole("button", { name: /^All/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Online/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Offline/ })).toBeVisible();
  });

  test("opens Enroll Agent modal when clicking Enroll Agent button", async ({ page }) => {
    const enrollBtn = page.getByRole("button", { name: "Enroll Agent", exact: true });
    await expect(enrollBtn).toBeVisible();
    await enrollBtn.click();

    // Modal should be visible
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Enroll New Simulated Endpoint Agent")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. WKSTN-EXEC-01.corp.internal")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("renders agent data table columns and allows opening Agent Detail drawer", async ({ page }) => {
    // Table header columns
    await expect(page.getByText("Endpoint & Hostname")).toBeVisible();
    await expect(page.getByText("IP & MAC")).toBeVisible();
    await expect(page.getByText("Sensor Status")).toBeVisible();
    await expect(page.getByText("Load (CPU/RAM/Disk)")).toBeVisible();
    await expect(page.getByText("Network State")).toBeVisible();

    // Open Agent Detail drawer
    const detailsBtn = page.getByRole("button", { name: "Details" }).first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    await expect(page.getByText("Live Sensor Performance")).toBeVisible();
    await expect(page.getByText("Endpoint Identification")).toBeVisible();
    await expect(page.getByText("Sensor Runtime & Heartbeat")).toBeVisible();
  });
});
