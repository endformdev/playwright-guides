import { expect, test } from "../support/fixtures";

test("changing password requires the current password", async ({
	page,
	user: _user,
}) => {
	await test.step("Open the security settings", async () => {
		await page.goto("/dashboard/security");
	});

	await test.step("Try to change password with the wrong current password", async () => {
		await page
			.getByRole("textbox", { name: "Current Password" })
			.fill("wrong-password");
		await page
			.getByRole("textbox", { name: "New Password", exact: true })
			.fill("a-brand-new-password");
		await page
			.getByRole("textbox", { name: "Confirm New Password" })
			.fill("a-brand-new-password");
		await page.getByRole("button", { name: "Update Password" }).click();
	});

	await test.step("Be told the current password is incorrect", async () => {
		await expect(
			page.getByText("Current password is incorrect."),
		).toBeVisible();
	});
});

test("a renamed user shows up in the team list", async ({
	page,
	user: _user,
}) => {
	await test.step("Open the team settings", async () => {
		await page.goto("/dashboard/team");
		await expect(page.getByTestId("team-member")).toHaveCount(1);
	});

	await test.step("Change your name in the general settings", async () => {
		await page.getByRole("link", { name: "General" }).click();
		await page.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();
	});

	await test.step("See the new name in the team list", async () => {
		await page.getByRole("link", { name: "Team" }).click();
		await expect(page.getByTestId("team-member-name")).toHaveText(
			"Grace Hopper",
		);
	});
});

test("a name typed straight after opening settings is saved", async ({
	page,
	user: _user,
}) => {
	await test.step("Open the general settings directly", async () => {
		await page.goto("/dashboard/general");
	});

	await test.step("Type a new name and save it", async () => {
		await page.getByRole("textbox", { name: "Name" }).fill("Katherine Johnson");
		await page.getByRole("button", { name: "Save Changes" }).click();
	});

	await test.step("See that the account was updated", async () => {
		await expect(page.getByText("Account updated successfully.")).toBeVisible();
		await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
			"Katherine Johnson",
		);
	});
});

test("the activity log shows the latest change first", async ({
	page,
	user,
}) => {
	await test.step("Update your name", async () => {
		await page.goto("/dashboard");
		await page.getByRole("link", { name: "General" }).click();
		await page.getByRole("textbox", { name: "Name" }).fill("Activity User");
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();
	});

	await test.step("Then change your password", async () => {
		await page.getByRole("link", { name: "Security" }).click();
		await page
			.getByRole("textbox", { name: "Current Password" })
			.fill(user.password);
		await page
			.getByRole("textbox", { name: "New Password", exact: true })
			.fill("a-brand-new-password");
		await page
			.getByRole("textbox", { name: "Confirm New Password" })
			.fill("a-brand-new-password");
		await page.getByRole("button", { name: "Update Password" }).click();
		await expect(
			page.getByText("Password updated successfully."),
		).toBeVisible();
	});

	await test.step("See the password change above the name change", async () => {
		await page.getByRole("link", { name: "Activity" }).click();
		const entries = page.getByRole("listitem");
		await expect(entries.nth(0)).toContainText("You changed your password");
		await expect(entries.nth(1)).toContainText("You updated your account");
	});
});
