import { expect, type Page } from "@playwright/test";

export const PASSWORD = "testpassword123";

export function uniqueEmail() {
	return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Signs up a brand new user through the sign-up form. */
export async function signUp(page: Page) {
	const email = uniqueEmail();

	await page.goto("/sign-up");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).toHaveURL("/dashboard");

	return { email, password: PASSWORD };
}

export async function signOut(page: Page) {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}

export async function signIn(page: Page, email: string, password: string) {
	await page.goto("/sign-in");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();
}
