// intent: "add a cargo bike named Cargo to the fleet"
// test: "cancelling a booking frees the slot again"
import type { StepContext } from "playwright-intent";

export default async function ({ page, expect }: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Bike name" }).fill("Cargo");
	await page
		.getByRole("combobox", { name: "Bike type" })
		.selectOption({ label: "Cargo bike" });
	await page.getByRole("button", { name: "Add bike" }).click();
	await expect(page.getByRole("rowheader", { name: "Cargo" })).toBeVisible();
	await expect(page.getByRole("cell", { name: "Cargo bike" })).toBeVisible();
}
