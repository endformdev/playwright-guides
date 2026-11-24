import { expect, test } from "@playwright/test";

test("home page links to pricing", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Build Your SaaS Faster Than Ever" }),
	).toBeVisible();

	await page.getByRole("link", { name: "Pricing" }).click();

	await expect(page).toHaveURL("/pricing");
	await expect(
		page.getByRole("heading", { name: "Choose Your Plan" }),
	).toBeVisible();
});

test("pricing page lists both plans", async ({ page }) => {
	await page.goto("/pricing");

	await expect(page.getByRole("heading", { name: "Base" })).toBeVisible();
	await expect(page.getByText("$8 per user / month")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
	await expect(page.getByText("$15 per user / month")).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
	await page.goto("/dashboard");

	await expect(page).toHaveURL("/sign-in");
	await expect(
		page.getByRole("heading", { name: "Sign in to your account" }),
	).toBeVisible();
});
