import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "@playwright/test";

const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);
}

async function main() {
  await mkdir("docs/screenshots", { recursive: true });
  const browser = await chromium.launch();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(base);
  await settle(desktopPage);
  await desktopPage.screenshot({ path: "docs/screenshots/landing-desktop.png" });
  await desktopPage.goto(`${base}/pricing`);
  await settle(desktopPage);
  await desktopPage.screenshot({ path: "docs/screenshots/pricing-desktop.png" });
  await desktopPage.goto(`${base}/login`);
  await settle(desktopPage);
  await desktopPage.getByTestId("demo-akhil@launchpad.dev").click();
  await desktopPage.waitForURL("**/app**");
  await settle(desktopPage);
  await desktopPage.screenshot({ path: "docs/screenshots/dashboard-desktop.png" });
  await desktopPage.goto(`${base}/app/billing`);
  await settle(desktopPage);
  await desktopPage.screenshot({ path: "docs/screenshots/billing-desktop.png" });
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(base);
  await settle(mobilePage);
  await mobilePage.screenshot({ path: "docs/screenshots/landing-mobile.png" });
  await mobilePage.goto(`${base}/login`);
  await settle(mobilePage);
  await mobilePage.getByTestId("demo-akhil@launchpad.dev").click();
  await mobilePage.waitForURL("**/app**");
  await settle(mobilePage);
  await mobilePage.screenshot({ path: "docs/screenshots/dashboard-mobile.png" });
  await mobile.close();

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
