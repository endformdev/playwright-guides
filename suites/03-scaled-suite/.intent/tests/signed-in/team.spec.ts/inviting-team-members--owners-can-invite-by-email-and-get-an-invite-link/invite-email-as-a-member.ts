// intent: "invite {email} as a Member"
// test: "inviting team members > owners can invite by email and get an invite link"
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
	await expect(page.getByText(`Invite link for ${vars.email}`)).toBeVisible();
}
