import { invite, signOut } from "../support/actions";
import { deleteUser, PASSWORD, uniqueEmail } from "../support/api";
import { expect, testWithNewUser as test } from "../support/fixtures";

test("the user owns their team", async ({ page, newUser }) => {
	await page.goto("/dashboard/team");

	await expect(page.getByTestId("team-member-name")).toHaveText(newUser.email);
	await expect(page.getByTestId("team-member-role")).toHaveText("owner");
});

test("an invited member joins the team", async ({ page, request }) => {
	const teammate = uniqueEmail("teammate");
	try {
		const link = await invite(page, teammate);
		await signOut(page);

		await page.goto(link);
		await page.getByRole("textbox", { name: "Email" }).fill(teammate);
		await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
		await page.getByRole("button", { name: "Sign up" }).click();
		await expect(page).toHaveURL("/dashboard");

		await page.goto("/dashboard/team");
		await expect(page.getByTestId("team-member")).toHaveCount(2);
	} finally {
		await deleteUser(request, teammate);
	}
});
