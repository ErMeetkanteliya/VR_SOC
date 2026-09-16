import { test, expect } from "@playwright/test";

test.describe("Phase 12 — Telemetry Engine & Simulation Pipeline E2E Tests", () => {
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

    await page.goto("/soar/simulation");
    await page.waitForSelector('[data-hydrated="true"]');
  });

  test("renders Simulation Lab dashboard with header, metric cards, and scenario catalog", async ({ page }) => {
    // Title & description
    await expect(page.locator("h1")).toContainText("Cyber Threat Simulation & Telemetry Engine");
    await expect(page.getByText("Deterministic synthetic attack simulation")).toBeVisible();

    // Metric cards
    await expect(page.getByText("Available Scenarios")).toBeVisible();
    await expect(page.getByText("Pipeline Events Ingested")).toBeVisible();
    await expect(page.getByText("Raw Syslog Stream")).toBeVisible();
    await expect(page.getByText("Active Simulations")).toBeVisible();

    // Scenario Cards in Catalog
    await expect(page.getByText("Brute Force Authentication & Account Lockout")).toBeVisible();
    await expect(page.getByText("Suspicious Obfuscated PowerShell Execution & C2 Beacon")).toBeVisible();
    await expect(page.getByText("Persistence via Scheduled Task Creation & Script Dropper")).toBeVisible();
  });

  test("filters scenario catalog by search query", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search scenarios by name, MITRE technique, description...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("PowerShell");
    await expect(page.getByText("Suspicious Obfuscated PowerShell Execution & C2 Beacon")).toBeVisible();
    await expect(page.getByText("Brute Force Authentication & Account Lockout")).not.toBeVisible();

    await searchInput.clear();
    await expect(page.getByText("Brute Force Authentication & Account Lockout")).toBeVisible();
  });

  test("opens Launch Scenario Modal when clicking Launch button", async ({ page }) => {
    const launchBtn = page.getByRole("button", { name: "Launch" }).first();
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Modal should be visible
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Launch Simulated Security Scenario")).toBeVisible();
    await expect(page.getByText("SOC Learning Objective:")).toBeVisible();
    await expect(page.getByText("Strict Defensive Boundary:")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("executes simulation scenario and streams live telemetry events", async ({ page }) => {
    const launchBtn = page.getByRole("button", { name: "Launch" }).first();
    await launchBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    const executeBtn = page.getByRole("button", { name: "Execute Scenario" });
    await expect(executeBtn).toBeVisible();
    await executeBtn.click();

    // Modal closes and active simulation progress card appears
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("Execution Progress:")).toBeVisible();
    await expect(page.getByText("CANONICAL TELEMETRY STREAM")).toBeVisible();

    // Switch to Telemetry Stream tab
    const telemetryTab = page.getByRole("button", { name: /Telemetry Stream/ });
    await expect(telemetryTab).toBeVisible();
    await telemetryTab.click();

    // Telemetry stream controls
    await expect(page.getByPlaceholder("Search telemetry events by type, host, message...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  });
});
