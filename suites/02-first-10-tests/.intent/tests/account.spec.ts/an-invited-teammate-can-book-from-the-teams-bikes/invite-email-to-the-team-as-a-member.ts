// intent: "invite {email} to the team as a member"
// test: "an invited teammate can book from the team's bikes"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Email" }).fill(vars.email);
	await page.getByRole("radio", { name: "Member" }).check();
	await page.getByRole("button", { name: "Invite Member" }).click();
	await expect(page.getByRole("link", { name: /inviteId=/ })).toBeVisible();
}
