// intent: "sign up with email {email} and password {password}"
// test: "users can upgrade from Free to the Pro plan"
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
	await expect(page.getByRole("link", { name: "Team" })).toBeVisible();
}
