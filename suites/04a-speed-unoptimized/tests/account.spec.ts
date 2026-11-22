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

	await page.goto("/dashboard");
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

test("changing password needs a matching confirmation", async ({ page }) => {
	await changePassword(page, PASSWORD, "a-brand-new-password", "different");

	await expect(
		page.getByText("New password and confirmation password do not match."),
	).toBeVisible();
});

test("activity shows the sign up", async ({ page }) => {
	await page.goto("/dashboard/activity");

	await expect(
		page.getByRole("listitem").filter({ hasText: "You signed up" }),
	).toBeVisible();
});

test("activity shows account updates", async ({ page }) => {
	await updateAccount(page, { name: "Activity User" });

	await page.goto("/dashboard/activity");
	await expect(page.getByRole("listitem").first()).toContainText(
		"You updated your account",
	);
});

test("activity shows password changes", async ({ page }) => {
	await changePassword(page, PASSWORD, "a-brand-new-password");
	await expect(page.getByText("Password updated successfully.")).toBeVisible();

	await page.goto("/dashboard/activity");
	await expect(page.getByRole("listitem").first()).toContainText(
		"You changed your password",
	);
});

test("activity shows signing back in", async ({ page }) => {
	await signOut(page);
	await signIn(page, email);

	await page.goto("/dashboard/activity");
	await expect(page.getByRole("listitem").first()).toContainText(
		"You signed in",
	);
});
