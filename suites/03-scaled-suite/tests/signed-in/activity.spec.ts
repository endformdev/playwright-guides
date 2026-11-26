import { uniqueEmail } from "../../support/api";
import {
	expect,
	type Page,
	test,
	testWithNewUser,
} from "../../support/fixtures";

const entries = (page: Page) => page.getByRole("listitem");

test("a new account shows its sign up and team creation", async ({ page }) => {
	await page.goto("/dashboard/activity");

	await expect(
		entries(page).filter({ hasText: "You signed up" }),
	).toBeVisible();
	await expect(
		entries(page).filter({ hasText: "You created a new team" }),
	).toBeVisible();
});

test.describe("after changes to the account", () => {
	testWithNewUser("account updates are logged", async ({ page }) => {
		await page.goto("/dashboard/general");
		await page.getByRole("textbox", { name: "Name" }).fill("Activity User");
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(entries(page).first()).toContainText(
			"You updated your account",
		);
	});

	testWithNewUser("password changes are logged", async ({ page, user }) => {
		await page.goto("/dashboard/security");
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

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(entries(page).first()).toContainText(
			"You changed your password",
		);
	});

	testWithNewUser("invitations are logged", async ({ page, ai }) => {
		await page.goto("/dashboard/team");
		await ai.do("invite {email} as a Member", {
			email: uniqueEmail("teammate"),
		});

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(entries(page).first()).toContainText(
			"You invited a team member",
		);
	});

	testWithNewUser("signing in is logged", async ({ page, user, ai }) => {
		await page.goto("/dashboard");
		await ai.do("sign out from the user menu");
		await page.goto("/sign-in");
		await ai.do("sign in with email {email} and password {password}", {
			email: user.email,
			password: user.password,
		});

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(entries(page).first()).toContainText("You signed in");
		await expect(entries(page).nth(1)).toContainText("You signed out");
	});
});
