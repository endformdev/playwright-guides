import { expect, test } from "@playwright/test";
import { invite, PASSWORD, signOut, signUp, uniqueEmail } from "./helpers";

let email: string;

test.beforeEach(async ({ page }) => {
	email = await signUp(page);
});

test("the new user owns their team", async ({ page }) => {
	await page.goto("/dashboard/team");

	await expect(page.getByTestId("team-member-name")).toHaveText(email);
	await expect(page.getByTestId("team-member-role")).toHaveText("owner");
});

test("an invited member joins the team", async ({ page }) => {
	const teammate = uniqueEmail("teammate");
	const link = await invite(page, teammate);
	await signOut(page);

	await page.goto(link);
	await page.getByRole("textbox", { name: "Email" }).fill(teammate);
	await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).toHaveURL("/dashboard");

	await page.goto("/dashboard/team");
	await expect(page.getByTestId("team-member")).toHaveCount(2);
});
