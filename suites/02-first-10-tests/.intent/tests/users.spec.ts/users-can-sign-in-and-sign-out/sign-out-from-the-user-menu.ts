// intent: "sign out from the user menu"
// test: "users can sign in and sign out"
import type { StepContext } from "playwright-intent";

export default async function ({ page, expect }: StepContext): Promise<void> {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}
