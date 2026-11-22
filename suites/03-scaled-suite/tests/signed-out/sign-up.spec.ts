import { PASSWORD, uniqueEmail } from "../../support/api";
import { expect, test } from "../../support/fixtures";

test.beforeEach(async ({ page }) => {
	await page.goto("/sign-up");
});

test("new visitors land on their team settings after signing up", async ({
	page,
	authForm,
}) => {
	const email = uniqueEmail();

	await authForm.signUp(email, PASSWORD);

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByTestId("team-member-name")).toHaveText(email);
	await expect(page.getByTestId("team-member-role")).toHaveText("owner");
});

test("new teams start on the free plan", async ({ page, authForm }) => {
	await authForm.signUp(uniqueEmail(), PASSWORD);

	await expect(page.getByText("Current Plan: Free")).toBeVisible();
	await expect(page.getByText("No active subscription")).toBeVisible();
});

test("an email that is already registered is rejected", async ({
	page,
	existingUser,
	authForm,
}) => {
	await authForm.signUp(existingUser.email, PASSWORD);

	await expect(
		page.getByText("Failed to create user. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-up");
});

test("passwords shorter than 8 characters are not submitted", async ({
	page,
	authForm,
}) => {
	await authForm.signUp(uniqueEmail(), "short");

	await expect(authForm.password).toHaveJSProperty("validity.tooShort", true);
	await expect(page).toHaveURL("/sign-up");
});

test("links to the sign in page", async ({ page }) => {
	await page.getByRole("link", { name: "Sign in to existing account" }).click();

	await expect(page).toHaveURL("/sign-in");
});

test("signing up from a checkout link returns to that checkout", async ({
	page,
	authForm,
}) => {
	await page.goto("/sign-up?redirect=checkout&plan=Plus&amount=1200");

	await authForm.signUp(uniqueEmail(), PASSWORD);

	await expect(page).toHaveURL("/pricing/checkout?plan=Plus&amount=1200");
	await expect(page.getByText("You are purchasing: Plus")).toBeVisible();
});
