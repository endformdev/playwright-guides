import { PASSWORD, uniqueEmail } from "../../support/api";
import { expect, test } from "../../support/fixtures";

test.beforeEach(async ({ page }) => {
	await page.goto("/sign-up");
});

test("new visitors land on their office's bikes after signing up", async ({
	page,
	ai,
}) => {
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
	await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();
});

test("new visitors own their new team", async ({ page, ai }) => {
	const email = uniqueEmail();
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});

	await page.getByRole("link", { name: "Team" }).click();

	await expect(page.getByTestId("team-member-name")).toHaveText(email);
	await expect(page.getByTestId("team-member-role")).toHaveText("owner");
});

test("new teams start on the free plan", async ({ page, ai }) => {
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});
	await page.getByRole("link", { name: "Team" }).click();

	await expect(page.getByText("Current Plan: Free")).toBeVisible();
	await expect(page.getByText("No active subscription")).toBeVisible();
});

test("an email that is already registered is rejected", async ({
	page,
	existingUser,
	ai,
}) => {
	await ai.do("sign up with email {email} and password {password}", {
		email: existingUser.email,
		password: PASSWORD,
	});

	await expect(
		page.getByText("Failed to create user. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-up");
});

test("passwords shorter than 8 characters are not submitted", async ({
	page,
}) => {
	await page.getByRole("textbox", { name: "Email" }).fill(uniqueEmail());
	const password = page.getByRole("textbox", { name: "Password" });
	await password.fill("short");
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(password).toHaveJSProperty("validity.tooShort", true);
	await expect(page).toHaveURL("/sign-up");
});

test("links to the sign in page", async ({ page }) => {
	await page.getByRole("link", { name: "Sign in to existing account" }).click();

	await expect(page).toHaveURL("/sign-in");
});

test("signing up from a checkout link returns to that checkout", async ({
	page,
	ai,
}) => {
	await page.goto("/sign-up?redirect=checkout&plan=Pro&amount=1500");

	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/pricing/checkout?plan=Pro&amount=1500");
	await expect(page.getByText("You are purchasing: Pro")).toBeVisible();
});
