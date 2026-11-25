// intent: "invite {email} as a Member"
// test: "after changes to the account > invitations are logged"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("button", { name: "Invite Member" }).click();
	await expect(page.getByText("Invitation sent successfully")).toBeVisible();
}
