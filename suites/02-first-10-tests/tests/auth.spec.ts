import { expect, test } from "@playwright/test";
import { PASSWORD, signIn, signOut, signUp } from "./helpers";

test("new visitors can sign up", async ({ page }) => {
	const { email } = await signUp(page);

	await expect(
		page.getByRole("heading", { name: "Team Settings" }),
	).toBeVisible();
	await expect(page.getByText(email)).toBeVisible();
});

test("users can sign back in after signing out", async ({ page }) => {
	const { email } = await signUp(page);
	await signOut(page);

	await signIn(page, email, PASSWORD);

	await expect(page).toHaveURL("/dashboard");
	await expect(
		page.getByRole("heading", { name: "Team Settings" }),
	).toBeVisible();
});

test("signing in with the wrong password shows an error", async ({ page }) => {
	const { email } = await signUp(page);
	await signOut(page);

	await signIn(page, email, "not-the-password");

	await expect(
		page.getByText("Invalid email or password. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-in");
});
