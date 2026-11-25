import { expect, test } from "playwright-intent";
import { PASSWORD, uniqueEmail } from "./helpers";

test("new visitors can sign up and land on their office's bikes", async ({
	page,
	ai,
}) => {
	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
	await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();
});

test("users can sign out and sign back in", async ({ page, ai }) => {
	const email = uniqueEmail();

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});
	await ai.do("sign out from the user menu");

	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
});

test("signing in with the wrong password shows an error", async ({
	page,
	ai,
}) => {
	const email = uniqueEmail();

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});
	await ai.do("sign out from the user menu");

	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email,
		password: "not-the-password",
	});

	await expect(
		page.getByText("Invalid email or password. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-in");
});
