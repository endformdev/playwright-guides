import { expect, type Page, test } from "../../support/fixtures";
import { signOut } from "../../support/pages";

async function changePassword(
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

test.describe("changing password", () => {
	test.describe(() => {
		test.use({ account: "new" });

		test("users can sign in with their new password", async ({
			page,
			user,
			authForm,
		}) => {
			await changePassword(page, user.password, "a-brand-new-password");
			await expect(
				page.getByText("Password updated successfully."),
			).toBeVisible();
			await signOut(page);

			await authForm.signIn(user.email, "a-brand-new-password");

			await expect(page).toHaveURL("/dashboard");
		});
	});

	test("the current password must be correct", async ({ page }) => {
		await changePassword(page, "wrong-password", "a-brand-new-password");

		await expect(
			page.getByText("Current password is incorrect."),
		).toBeVisible();
	});

	test("the confirmation must match", async ({ page, user }) => {
		await changePassword(
			page,
			user.password,
			"a-brand-new-password",
			"a-different-password",
		);

		await expect(
			page.getByText("New password and confirmation password do not match."),
		).toBeVisible();
	});

	test("the new password must be different", async ({ page, user }) => {
		await changePassword(page, user.password, user.password);

		await expect(
			page.getByText(
				"New password must be different from the current password.",
			),
		).toBeVisible();
	});
});

test.describe("deleting the account", () => {
	test("requires the correct password", async ({ page }) => {
		await page.goto("/dashboard/security");

		await page
			.getByRole("textbox", { name: "Confirm Password" })
			.fill("wrong-password");
		await page.getByRole("button", { name: "Delete Account" }).click();

		await expect(
			page.getByText("Incorrect password. Account deletion failed."),
		).toBeVisible();
	});

	test.describe(() => {
		test.use({ account: "new" });

		test("signs the user out for good", async ({ page, user, authForm }) => {
			await page.goto("/dashboard/security");

			await page
				.getByRole("textbox", { name: "Confirm Password" })
				.fill(user.password);
			await page.getByRole("button", { name: "Delete Account" }).click();
			await expect(page).toHaveURL("/sign-in");

			await authForm.signIn(user.email, user.password);
			await expect(
				page.getByText("Invalid email or password. Please try again."),
			).toBeVisible();
		});
	});
});
