import { PASSWORD, uniqueEmail } from "../../support/api";
import { expect, test } from "../../support/fixtures";

test("users can sign in", async ({ page, existingUser, ai }) => {
	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email: existingUser.email,
		password: existingUser.password,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
});

test("a wrong password is rejected", async ({ page, existingUser, ai }) => {
	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email: existingUser.email,
		password: "not-the-password",
	});

	await expect(
		page.getByText("Invalid email or password. Please try again."),
	).toBeVisible();
});

test("an unknown email is rejected with the same message", async ({
	page,
	ai,
}) => {
	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email: uniqueEmail("unknown"),
		password: PASSWORD,
	});

	await expect(
		page.getByText("Invalid email or password. Please try again."),
	).toBeVisible();
});

test("links to the sign up page", async ({ page }) => {
	await page.goto("/sign-in");

	await page.getByRole("link", { name: "Create an account" }).click();

	await expect(page).toHaveURL("/sign-up");
});

for (const path of [
	"/dashboard",
	"/dashboard/team",
	"/dashboard/general",
	"/dashboard/activity",
	"/dashboard/security",
]) {
	test(`${path} requires signing in`, async ({ page }) => {
		await page.goto(path);

		await expect(page).toHaveURL("/sign-in");
	});
}
