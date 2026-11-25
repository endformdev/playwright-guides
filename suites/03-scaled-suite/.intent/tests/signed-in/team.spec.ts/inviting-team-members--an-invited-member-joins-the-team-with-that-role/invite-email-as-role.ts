// intent: "invite {email} as {role}"
// test: "inviting team members > an invited member joins the team with that role"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("radio", { name: vars.role }).check();
	await page.getByRole("button", { name: "Invite Member" }).click();
	await expect(page.getByText(`Invite link for ${vars.email}`)).toBeVisible();
}
