import { expect, type Page } from "@playwright/test";

export async function addBike(
	page: Page,
	name: string,
	type: "road" | "city" | "e-city" | "cargo",
) {
	await page.getByRole("textbox", { name: "Bike name" }).fill(name);
	await page.getByRole("combobox", { name: "Bike type" }).selectOption(type);
	await page.getByRole("button", { name: "Add bike" }).click();
	await expect(
		page.getByRole("rowheader", { name, exact: true }),
	).toBeVisible();
}

/** A day a week from now, as YYYY-MM-DD, so it is always bookable. */
export function nextWeek() {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + 7);
	return day.toISOString().slice(0, 10);
}
