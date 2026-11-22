import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle("ACME");
	await expect(
		page.getByRole("heading", { name: "Build Your SaaS Faster Than Ever" }),
	).toBeVisible();
});
