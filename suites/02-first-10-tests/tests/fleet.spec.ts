import { expect, testWithNewUser } from "./test-with-new-user";

testWithNewUser(
	"owners can add bikes and see them listed with their type",
	async ({ page, ai }) => {
		await page.goto("/dashboard");
		await ai.do("add a road bike named Road 1 to the fleet");
		await ai.do("add a cargo bike named Cargo to the fleet");

		const rows = page.getByRole("row");
		await expect(rows).toHaveCount(3);
		await expect(rows.nth(1)).toContainText("Road 1");
		await expect(rows.nth(1)).toContainText("Road bike");
		await expect(rows.nth(2)).toContainText("Cargo");
		await expect(rows.nth(2)).toContainText("Cargo bike");
	},
);

testWithNewUser(
	"removing a bike removes it and its bookings",
	async ({ page, ai }) => {
		await page.goto(`/dashboard?date=${nextWeek()}`);
		await ai.do("add a cargo bike named Cargo to the fleet");

		await page.getByRole("button", { name: "Book Cargo morning" }).click();
		await expect(page.getByRole("status")).toContainText("Booked Cargo");

		await page.getByRole("button", { name: "Remove Cargo" }).click();
		await expect(
			page.getByRole("rowheader", { name: "Cargo", exact: true }),
		).toHaveCount(0);
		await expect(page.getByText("No upcoming bookings.")).toBeVisible();
	},
);

testWithNewUser("duplicate bike names are rejected", async ({ page, ai }) => {
	await page.goto("/dashboard");
	await ai.do("add a road bike named Road 1 to the fleet");

	await page.getByRole("textbox", { name: "Bike name" }).fill("Road 1");
	await page.getByRole("button", { name: "Add bike" }).click();

	await expect(
		page.getByText("A bike named Road 1 is already in your fleet"),
	).toBeVisible();
});

function nextWeek() {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + 7);
	return day.toISOString().slice(0, 10);
}
