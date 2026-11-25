// intent: "sign up with email {email} and password {password}"
// test: "a bike can't be booked twice for the same slot"
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
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
}
