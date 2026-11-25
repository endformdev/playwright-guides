import { uniqueEmail } from "../../support/api";
import { expect, test } from "../../support/fixtures";

test("shows the signed-in user's email", async ({ page, user }) => {
	await page.goto("/dashboard/general");

	await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
		user.email,
	);
});

test.describe("updating the account", () => {
	test.use({ account: "new" });

	test("a new name is shown in the team list", async ({ page }) => {
		await page.goto("/dashboard/general");

		await page.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();

		await page.getByRole("link", { name: "Team" }).click();
		await expect(page.getByTestId("team-member-name")).toHaveText(
			"Grace Hopper",
		);
	});

	test("a new name is kept after reloading", async ({ page }) => {
		await page.goto("/dashboard/general");
		const name = page.getByRole("textbox", { name: "Name" });

		await name.fill("Katherine Johnson");
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();
		await page.reload();

		await expect(name).toHaveValue("Katherine Johnson");
	});

	test("users can sign in with a changed email", async ({ page, user, ai }) => {
		const newEmail = uniqueEmail("changed");
		await page.goto("/dashboard/general");

		await page.getByRole("textbox", { name: "Name" }).fill("Margaret Hamilton");
		await page.getByRole("textbox", { name: "Email" }).fill(newEmail);
		await page.getByRole("button", { name: "Save Changes" }).click();
		await expect(page.getByText("Account updated successfully.")).toBeVisible();

		await ai.do("sign out from the user menu");
		await page.goto("/sign-in");
		await ai.do("sign in with email {email} and password {password}", {
			email: newEmail,
			password: user.password,
		});

		await expect(page).toHaveURL("/dashboard");
	});
});
