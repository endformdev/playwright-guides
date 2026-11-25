// intent: "add a road bike named {name} to the fleet"
// test: "a new user can sign up, add a bike, and book it"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Bike name" }).fill(vars.name);
	await page.getByRole("button", { name: "Add bike" }).click();
	await expect(page.getByRole("rowheader", { name: vars.name })).toBeVisible();
	await expect(page.getByRole("cell", { name: "Road bike" })).toBeVisible();
}
