import { test, expect } from "@playwright/test";

test.describe("VRSOC Application Bootstrap Smoke Test", () => {
  test("renders bootstrap verification page with Base44 cyber theme", async ({ page }) => {
    await page.goto("/");

    // Verify title and brand presence
    await expect(page).toHaveTitle(/VRSOC/);
    await expect(page.locator("h1")).toContainText("VRSOC — Cyber Defense Training");

    // Verify system operational badge
    await expect(page.getByText("SYSTEM OPERATIONAL — BOOTSTRAP READY")).toBeVisible();

    // Verify background color invariant (#0A0A0A)
    const body = page.locator("body");
    await expect(body).toHaveClass(/bg-\[#0A0A0A\]/);
  });

  test("health check endpoint returns operational status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("operational");
    expect(json.services.auth).toBe("ready");
  });
});
