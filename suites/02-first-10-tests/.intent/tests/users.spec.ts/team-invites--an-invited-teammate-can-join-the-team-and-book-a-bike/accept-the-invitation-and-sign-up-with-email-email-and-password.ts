// intent: "accept the invitation and sign up with email {email} and password {password}"
// test: "team invites > an invited teammate can join the team and book a bike"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("textbox", { name: "Password" }).fill(vars.password);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).not.toHaveURL(/\/sign-up/);
}
