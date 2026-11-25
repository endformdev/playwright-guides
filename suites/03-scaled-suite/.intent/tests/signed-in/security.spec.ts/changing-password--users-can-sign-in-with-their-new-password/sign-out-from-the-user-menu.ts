// intent: "sign out from the user menu"
// test: "changing password > users can sign in with their new password"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}
