import { expect, test } from "@playwright/test";

test("Shaurya onboarding reaches the Aditya handoff", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "A smooth rhythm that keeps carrying you" }).click();
  await page.getByRole("button", { name: "A wave" }).click();
  await page.getByRole("button", { name: "Staying loose and flowing" }).click();
  await page.getByRole("button", { name: "Long relaxed reach" }).click();
  await page.getByRole("button", { name: "Repeating a smooth motion until it feels effortless" }).click();
  await page.getByRole("button", { name: "Smooth rhythm that never looks forced" }).click();
  await page.getByRole("button", { name: "My rhythm" }).click();
  await page.getByRole("button", { name: "Gliding through motion without fighting it" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Feet").fill("5");
  await page.getByLabel("Inches").fill("10");
  await page.getByLabel("Weight (lb)").fill("165");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Match archetype" }).click();

  await expect(page.getByText("Archetype revealed")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Paralympic sport")).toBeVisible();
  await expect(page.getByText("Olympic sport")).toBeVisible();

  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/moment$/);
  await expect(page.getByText("Received from Shaurya")).toBeVisible();
});
