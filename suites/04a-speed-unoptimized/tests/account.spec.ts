import { expect, test } from "@playwright/test";
import {
	changePassword,
	PASSWORD,
	signIn,
	signOut,
	signUp,
	uniqueEmail,
	updateAccount,
} from "./helpers";

let email: string;

test.beforeEach(async ({ page }) => {
	email = await signUp(page);
});

test("general settings show the user's email", async ({ page }) => {
	await page.goto("/dashboard/general");

	await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(email);
});

test("users can change their name", async ({ page }) => {
	await updateAccount(page, { name: "Grace Hopper" });

	await page.goto("/dashboard/team");
	await expect(page.getByTestId("team-member-name")).toHaveText("Grace Hopper");
});

test("users can sign in with a changed email", async ({ page }) => {
	const newEmail = uniqueEmail("changed");
	await updateAccount(page, { name: "Grace Hopper", email: newEmail });
	await signOut(page);

	await signIn(page, newEmail);
});

test("users can sign in with a changed password", async ({ page }) => {
	await changePassword(page, PASSWORD, "a-brand-new-password");
	await expect(page.getByText("Password updated successfully.")).toBeVisible();
	await signOut(page);

	await signIn(page, email, "a-brand-new-password");
});

test("changing password needs the current password", async ({ page }) => {
	await changePassword(page, "wrong-password", "a-brand-new-password");

	await expect(page.getByText("Current password is incorrect.")).toBeVisible();
});
