import { expect, test, uniqueEmail } from "../support/fixtures";

test("an owner invites a teammate", async ({ page, user: _user }) => {
	const teammate = uniqueEmail("teammate");

	await test.step("Open the team settings", async () => {
		await page.goto("/dashboard");
	});

	await test.step("Invite a teammate by email", async () => {
		await page.getByRole("textbox", { name: "Email" }).fill(teammate);
		await page.getByRole("button", { name: "Invite Member" }).click();
	});

	await test.step("Get an invite link to share with them", async () => {
		await expect(page.getByText("Invitation sent successfully")).toBeVisible();
		await expect(page.getByText(`Invite link for ${teammate}`)).toBeVisible();
	});
});
