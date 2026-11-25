import { expect, test } from "@playwright/test";

test("marketing pages explain the product and the prices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ship the launch. Keep the record." })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" }).click();
  await expect(page.getByRole("heading", { name: "A plan for the size of the launch." })).toBeVisible();
  await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Team", { exact: true }).first()).toBeVisible();
  const toggle = page.getByRole("button", { name: "Toggle color theme" });
  const before = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
  await toggle.click();
  await expect.poll(() => page.locator("html").evaluate((element) => element.classList.contains("dark"))).not.toBe(before);
});

test("the owner lands in the seeded Northstar workspace", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("demo-akhil@launchpad.dev").click();
  await page.waitForURL("**/app");
  await expect(page.getByText("Northstar").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Public beta/ })).toBeVisible();
  await page.getByRole("link", { name: "Platform admin" }).click();
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
});

test("a member cannot read the audit log", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("demo-jordan@launchpad.dev").click();
  await page.waitForURL("**/app");
  await page.goto("/app/audit");
  await expect(page.getByTestId("audit-forbidden")).toBeVisible();
  await expect(page.getByTestId("audit-forbidden")).toContainText("Owners and admins");
});

test("a free organisation cannot create a second launch", async ({ page }) => {
  const email = `pilot-${Date.now()}@launchpad.dev`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Test Pilot");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("launchpad");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/app");

  await page.goto("/app/launches/new");
  await page.getByLabel("Name").fill("Only launch");
  await page.getByRole("button", { name: "Create launch" }).click();
  await page.waitForURL("**/app/launches/**");
  await expect(page.getByRole("heading", { name: "Only launch" })).toBeVisible();

  await page.goto("/app/launches/new");
  await page.getByLabel("Name").fill("Second launch");
  await page.getByRole("button", { name: "Create launch" }).click();
  await expect(page.getByText("The Free plan includes 1 launch")).toBeVisible();
});
