import { expect, type Page } from "@playwright/test";

export const PASSWORD = "testpassword123";

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Every test starts by signing up a new user through the sign-up form. */
export async function signUp(page: Page, email = uniqueEmail()) {
	await page.goto("/sign-up");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).toHaveURL("/dashboard");
	return email;
}

export async function signOut(page: Page) {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
	await page.goto("/sign-in");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL("/dashboard");
}

export async function updateAccount(
	page: Page,
	values: { name?: string; email?: string },
) {
	await page.goto("/dashboard/general");
	if (values.name) {
		await page.getByRole("textbox", { name: "Name" }).fill(values.name);
	}
	if (values.email) {
		await page.getByRole("textbox", { name: "Email" }).fill(values.email);
	}
	await page.getByRole("button", { name: "Save Changes" }).click();
	await expect(page.getByText("Account updated successfully.")).toBeVisible();
}

export async function changePassword(
	page: Page,
	current: string,
	next: string,
	confirmation = next,
) {
	await page.goto("/dashboard/security");
	await page.getByRole("textbox", { name: "Current Password" }).fill(current);
	await page
		.getByRole("textbox", { name: "New Password", exact: true })
		.fill(next);
	await page
		.getByRole("textbox", { name: "Confirm New Password" })
		.fill(confirmation);
	await page.getByRole("button", { name: "Update Password" }).click();
}

export async function invite(page: Page, email: string) {
	await page.goto("/dashboard");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("button", { name: "Invite Member" }).click();
	const link = page.getByText(`Invite link for ${email}`).getByRole("link");
	return (await link.getAttribute("href")) as string;
}

export async function purchase(page: Page, plan: "Base" | "Plus") {
	await page.goto("/pricing");
	await page
		.getByRole("button", { name: "Get Started" })
		.nth(plan === "Base" ? 0 : 1)
		.click();
	await fillCheckout(page);
	await page.getByRole("button", { name: /Complete Purchase/ }).click();
	await expect(page).toHaveURL("/dashboard?payment=success");
}

export async function fillCheckout(page: Page, cardNumber = "12345678") {
	const textbox = (name: string) => page.getByRole("textbox", { name });
	await textbox("Card Holder Name").fill("Ada Lovelace");
	await textbox("Card Number (8 digits only)").fill(cardNumber);
	await textbox("Expiry Date").fill("12/30");
	await textbox("CVV").fill("123");
	await textbox("Street Address").fill("1 Analytical Engine Way");
	await textbox("City").fill("London");
	await textbox("State").fill("Greater London");
	await textbox("ZIP Code").fill("N1 9GU");
	await textbox("Country").fill("United Kingdom");
}
