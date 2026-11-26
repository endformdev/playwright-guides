// intent: "add a city bike named City 1 to the fleet"
// test: "an invited teammate can join the team and book a bike"
import type { StepContext } from "playwright-intent";

export default async function ({ page, expect }: StepContext): Promise<void> {
	await page.getByRole("textbox", { name: "Bike name" }).fill("City 1");
	await page
		.getByRole("combobox", { name: "Bike type" })
		.selectOption({ label: "City bike" });
	await page.getByRole("button", { name: "Add bike" }).click();
	await expect(page.getByRole("rowheader", { name: "City 1" })).toBeVisible();
	await expect(page.getByRole("cell", { name: "City bike" })).toBeVisible();
}
