import { test, expect } from "@playwright/test";

test.describe("DEV-ONLY Super Admin Account E2E Verification", () => {
  const devEmail = process.env.DEV_ADMIN_EMAIL || "dev-admin@vrsoc.local";
  const devPassword = process.env.DEV_ADMIN_PASSWORD || "VRSOC_DevAdmin_2026_Secure!";

  test("1. Rejects invalid credentials on normal login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");

    // Attempt with incorrect password
    await page.fill('input[type="email"]', devEmail);
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Verify error banner
    const errorBanner = page.locator('[data-testid="auth-error-banner"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText("Invalid email or password");
  });

  test("2. Logs in successfully with DEV_ADMIN credentials and resolves Super Admin", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");

    // Fill valid dev admin credentials
    await page.fill('input[type="email"]', devEmail);
    await page.fill('input[type="password"]', devPassword);
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL("/", { timeout: 8000 });
    await expect(page.locator("body")).toContainText("Cyber Defense Academy");
    await expect(page.locator("body")).toContainText("Super Admin");
  });

  test("3. Session persists across page reload and accesses protected modules", async ({ page }) => {
    test.setTimeout(60000);

    // Authenticate
    await page.goto("/login");
    await page.fill('input[type="email"]', devEmail);
    await page.fill('input[type="password"]', devPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Refresh page
    await page.reload();
    await expect(page.locator("body")).toContainText("Cyber Defense Academy");

    // Navigate to Incidents module
    await page.goto("/incidents");
    await expect(page.locator("body")).toContainText("Incident Response");

    // Navigate to Threat Hunting module
    await page.goto("/threat-hunting");
    await expect(page.locator("body")).toContainText("Threat Hunting");
  });

  test("4. Logs out successfully and blocks access to protected routes", async ({ page }) => {
    test.setTimeout(60000);

    // Authenticate first
    await page.goto("/login");
    await page.fill('input[type="email"]', devEmail);
    await page.fill('input[type="password"]', devPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Ensure page hydration is complete
    await page.waitForLoadState("networkidle");

    // Open User Profile Menu and Logout
    const userMenuBtn = page.getByLabel("User profile menu");
    await expect(userMenuBtn).toBeVisible({ timeout: 15000 });
    await userMenuBtn.click();

    const signOutBtn = page.getByRole("menuitem", { name: /Sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });
    await signOutBtn.click();

    // Confirm redirected to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    // Try accessing protected page directly
    await page.goto("/incidents");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fincidents/, { timeout: 10000 });
  });
});
