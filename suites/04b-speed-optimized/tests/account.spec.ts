import {
	changePassword,
	signIn,
	signOut,
	updateAccount,
} from "../support/actions";
import { PASSWORD, uniqueEmail } from "../support/api";
import { expect, testWithNewUser as test } from "../support/fixtures";

test("general settings show the user's email", async ({ page, newUser }) => {
	await page.goto("/dashboard/general");

	await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
		newUser.email,
	);
});

test("changing password needs the current password", async ({ page }) => {
	await changePassword(page, "wrong-password", "a-brand-new-password");

	await expect(page.getByText("Current password is incorrect.")).toBeVisible();
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

test("users can sign in with a changed password", async ({ page, newUser }) => {
	await changePassword(page, PASSWORD, "a-brand-new-password");
	await expect(page.getByText("Password updated successfully.")).toBeVisible();
	await signOut(page);

	await signIn(page, newUser.email, "a-brand-new-password");
});
