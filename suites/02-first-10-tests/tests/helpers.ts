import { expect, type Page } from "@playwright/test";

export const PASSWORD = "testpassword123";

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** The bikes these tests add to an office through the Manage fleet UI. */
export const OFFICE_FLEET = [
	{ name: "Road 1", type: "road" },
	{ name: "City 1", type: "city" },
	{ name: "E-City 2", type: "e-city" },
	{ name: "Cargo", type: "cargo" },
] as const;

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

/**
 * New teams start without bikes. Add the office fleet through the Manage fleet
 * form on the bikes page.
 */
export async function addOfficeFleet(page: Page, bikes = OFFICE_FLEET) {
	await page.goto("/dashboard");
	for (const bike of bikes) {
		await addBike(page, bike.name, bike.type);
	}
}

/** A day a week from now, as YYYY-MM-DD, so it's always bookable. */
export function nextWeek() {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + 7);
	return day.toISOString().slice(0, 10);
}
