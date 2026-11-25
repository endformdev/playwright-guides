// intent: "sign out from the user menu"
// test: "users can sign out and sign back in"
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
	await expect(page).toHaveURL("/");
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}
