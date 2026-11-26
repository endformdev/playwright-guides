// intent: "add a road bike named Road 1 to the fleet"
// test: "users can book a bike and see it in their upcoming bookings"
import type { StepContext } from "playwright-intent";

export default async function ({ page, expect }: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Bike name" }).fill("Road 1");
	await page
		.getByRole("combobox", { name: "Bike type" })
		.selectOption({ label: "Road bike" });
	await page.getByRole("button", { name: "Add bike" }).click();
	await expect(page.getByRole("rowheader", { name: "Road 1" })).toBeVisible();
	await expect(page.getByRole("cell", { name: "Road bike" })).toBeVisible();
}
