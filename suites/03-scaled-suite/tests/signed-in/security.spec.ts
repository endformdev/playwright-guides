import { expect, type Page, testWithNewUser } from "../../support/fixtures";

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

testWithNewUser.describe("changing password", () => {
	testWithNewUser(
		"users can sign in with their new password",
		async ({ page, newUser, ai }) => {
			await changePassword(page, newUser.password, "a-brand-new-password");
			await expect(
				page.getByText("Password updated successfully."),
			).toBeVisible();

			await ai.do("sign out from the user menu");
			await page.goto("/sign-in");
			await ai.do("sign in with email {email} and password {password}", {
				email: newUser.email,
				password: "a-brand-new-password",
			});

			await expect(page).toHaveURL("/dashboard");
		},
	);

	testWithNewUser("the current password must be correct", async ({ page }) => {
		await changePassword(page, "wrong-password", "a-brand-new-password");

		await expect(
			page.getByText("Current password is incorrect."),
		).toBeVisible();
	});

	testWithNewUser("the confirmation must match", async ({ page, newUser }) => {
		await changePassword(
			page,
			newUser.password,
			"a-brand-new-password",
			"a-different-password",
		);

		await expect(
			page.getByText("New password and confirmation password do not match."),
		).toBeVisible();
	});

	testWithNewUser(
		"the new password must be different",
		async ({ page, newUser }) => {
			await changePassword(page, newUser.password, newUser.password);

			await expect(
				page.getByText(
					"New password must be different from the current password.",
				),
			).toBeVisible();
		},
	);
});

testWithNewUser.describe("deleting the account", () => {
	testWithNewUser("requires the correct password", async ({ page }) => {
		await page.goto("/dashboard/security");

		await page
			.getByRole("textbox", { name: "Confirm Password" })
			.fill("wrong-password");
		await page.getByRole("button", { name: "Delete Account" }).click();

		await expect(
			page.getByText("Incorrect password. Account deletion failed."),
		).toBeVisible();
	});

	testWithNewUser(
		"signs the user out for good",
		async ({ page, newUser, ai }) => {
			await page.goto("/dashboard/security");

			await page
				.getByRole("textbox", { name: "Confirm Password" })
				.fill(newUser.password);
			await page.getByRole("button", { name: "Delete Account" }).click();
			await expect(page).toHaveURL("/sign-in");

			await ai.do("sign in with email {email} and password {password}", {
				email: newUser.email,
				password: newUser.password,
			});
			await expect(
				page.getByText("Invalid email or password. Please try again."),
			).toBeVisible();
		},
	);
});
