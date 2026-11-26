// intent: "sign in with email {email} and password {password}"
// test: "signing in with the wrong password shows an error"
import type { StepContext } from "playwright-intent";

export default async function ({ page, vars }: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("textbox", { name: "Password" }).fill(vars.password);
	await page.getByRole("button", { name: "Sign in" }).click();
}
