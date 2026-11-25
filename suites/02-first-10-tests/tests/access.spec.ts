import { expect, test } from "playwright-intent";

test("signed-out visitors are redirected to sign in", async ({ page }) => {
	await page.goto("/dashboard");

	await expect(page).toHaveURL("/sign-in");
	await expect(
		page.getByRole("heading", { name: "Sign in to your account" }),
	).toBeVisible();
});
