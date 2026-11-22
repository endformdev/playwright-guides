import { PASSWORD, uniqueEmail } from "../support/api";
import { invite } from "../support/actions";
import { expect, signOut, test } from "../support/fixtures";

test("the user owns their team", async ({ page, user }) => {
	await page.goto("/dashboard");

	await expect(page.getByTestId("team-member-name")).toHaveText(user.email);
	await expect(page.getByTestId("team-member-role")).toHaveText("owner");
});

test.describe("inviting", () => {
	test.use({ account: "new" });

	test("owners can invite a member", async ({ page }) => {
		const link = await invite(page, uniqueEmail("teammate"));

		expect(link).toMatch(/inviteId=\d+/);
	});

	test("the same email can't be invited twice", async ({ page }) => {
		const teammate = uniqueEmail("teammate");
		await invite(page, teammate);

		await page.getByRole("textbox", { name: "Email" }).fill(teammate);
		await page.getByRole("button", { name: "Invite Member" }).click();

		await expect(
			page.getByText("An invitation has already been sent to this email"),
		).toBeVisible();
	});

	test("an invited member joins the team", async ({ page }) => {
		const teammate = uniqueEmail("teammate");
		const link = await invite(page, teammate);
		await signOut(page);

		await page.goto(link);
		await page.getByRole("textbox", { name: "Email" }).fill(teammate);
		await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
		await page.getByRole("button", { name: "Sign up" }).click();

		await expect(page.getByTestId("team-member")).toHaveCount(2);
	});
});
