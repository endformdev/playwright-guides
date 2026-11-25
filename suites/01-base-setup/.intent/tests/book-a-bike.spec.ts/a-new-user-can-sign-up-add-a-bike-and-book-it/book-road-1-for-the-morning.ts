// intent: "book Road 1 for the morning"
// test: "a new user can sign up, add a bike, and book it"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("button", { name: "Book Road 1 morning" }).click();
	await expect(page.getByRole("status")).toContainText("Booked Road 1");
	await expect(
		page.getByRole("listitem").filter({ hasText: "Road 1" }),
	).toContainText("morning");
}
