import { expect, type Page } from "@playwright/test";

export const PASSWORD = "testpassword123";

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** The bikes most of the tests' offices have. */
export const OFFICE_FLEET = [
	{ name: "Road 1", type: "road" },
	{ name: "Road 2", type: "road" },
	{ name: "City 1", type: "city" },
	{ name: "City 2", type: "city" },
	{ name: "E-City 1", type: "e-city" },
	{ name: "E-City 2", type: "e-city" },
	{ name: "E-City 3", type: "e-city" },
	{ name: "Cargo", type: "cargo" },
];

/**
 * New teams start without bikes. A team's owner finds the team's API key on
 * the bikes page, and the Fleet API sets up its bikes.
 */
export async function addOfficeFleet(page: Page) {
	await page.goto("/dashboard");
	const apiKey = await page
		.getByRole("textbox", { name: "API key" })
		.inputValue();

	const response = await page.request.put("/api/fleet", {
		headers: { authorization: `Bearer ${apiKey}` },
		data: { bikes: OFFICE_FLEET },
	});
	expect(response.ok()).toBe(true);

	await page.reload();
}

/** A day a week from now, as YYYY-MM-DD, so it's always bookable. */
export function nextWeek() {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + 7);
	return day.toISOString().slice(0, 10);
}
