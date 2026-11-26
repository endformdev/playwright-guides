// intent: "sign up with email {email} and password {password}"
// test: "new visitors can sign up and land on their office's bikes"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("textbox", { name: "Password" }).fill(vars.password);
	await page.getByRole("button", { name: "Sign up" }).click();
	await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
}
