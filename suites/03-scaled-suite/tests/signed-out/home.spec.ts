import { expect, test } from "../../support/fixtures";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("shows the product headline", async ({ page }) => {
	await expect(page).toHaveTitle("ACME");
	await expect(
		page.getByRole("heading", { name: "Build Your SaaS Faster Than Ever" }),
	).toBeVisible();
});

test("header links to pricing", async ({ page }) => {
	await page.getByRole("link", { name: "Pricing" }).click();

	await expect(page).toHaveURL("/pricing");
});

test("header links to sign up", async ({ page }) => {
	await page.getByRole("link", { name: "Sign Up" }).click();

	await expect(page).toHaveURL("/sign-up");
	await expect(
		page.getByRole("heading", { name: "Create your account" }),
	).toBeVisible();
});

test("shows the getting started commands", async ({ page }) => {
	await expect(
		page.getByText("git clone https://github.com/endformdev/playwright-guides"),
	).toBeVisible();
	await expect(page.getByText("pnpm install")).toBeVisible();
});
