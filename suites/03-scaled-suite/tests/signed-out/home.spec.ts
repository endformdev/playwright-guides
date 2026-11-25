import { expect, test } from "../../support/fixtures";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("shows the product headline", async ({ page }) => {
	await expect(page).toHaveTitle("BikeBook");
	await expect(
		page.getByRole("heading", {
			name: "The office bike pool, without the spreadsheet",
		}),
	).toBeVisible();
});

test("header links to pricing", async ({ page }) => {
	await page.getByRole("link", { name: "Pricing", exact: true }).click();

	await expect(page).toHaveURL("/pricing");
});

test("header links to sign up", async ({ page }) => {
	await page.getByRole("link", { name: "Sign Up", exact: true }).click();

	await expect(page).toHaveURL("/sign-up");
	await expect(
		page.getByRole("heading", { name: "Create your account" }),
	).toBeVisible();
});

test("the call to action starts sign up", async ({ page }) => {
	await page.getByRole("link", { name: "Start booking" }).click();

	await expect(page).toHaveURL("/sign-up");
});
