// intent: "sign in with email {email} and password {password}"
// test: "users can sign out and sign back in"
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
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/dashboard$/);
}
