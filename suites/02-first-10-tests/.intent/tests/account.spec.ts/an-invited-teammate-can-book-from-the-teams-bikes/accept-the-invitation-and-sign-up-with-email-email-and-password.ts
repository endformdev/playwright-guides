// intent: "accept the invitation and sign up with email {email} and password {password}"
// test: "an invited teammate can book from the team's bikes"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("textbox", { name: "Password" }).fill(vars.password);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).not.toHaveURL(/\/sign-up/);
}
