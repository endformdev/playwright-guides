import { expect, test } from "playwright-intent";
import { addOfficeFleet, nextWeek, PASSWORD, uniqueEmail } from "./helpers";

test.beforeEach(async ({ page, ai }) => {
	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});
	await addOfficeFleet(page);
});

test("the office's bikes are listed with their type", async ({ page }) => {
	const rows = page.getByRole("row");

	// A header row, then one row per bike in the order they were added.
	await expect(rows).toHaveCount(5);
	await expect(rows.nth(1)).toContainText("Road 1");
	await expect(rows.nth(1)).toContainText("Road bike");
	await expect(rows.nth(4)).toContainText("Cargo bike");
});

test("users can book a bike and see it in their upcoming bookings", async ({
	page,
}) => {
	await page.goto(`/dashboard?date=${nextWeek()}`);

	await page.getByRole("button", { name: "Book E-City 2 morning" }).click();

	await expect(page.getByRole("status")).toContainText("Booked E-City 2");
	await expect(page.getByRole("row", { name: /E-City 2/ })).toContainText(
		"Booked by you",
	);
	await expect(
		page.getByRole("listitem").filter({ hasText: "E-City 2" }),
	).toContainText("morning");

	await page.getByRole("link", { name: "Activity" }).click();
	await expect(page.getByText(/You booked E-City 2/)).toBeVisible();
});

test("cancelling a booking frees the bike again", async ({ page }) => {
	await page.goto(`/dashboard?date=${nextWeek()}`);
	await page.getByRole("button", { name: "Book Cargo afternoon" }).click();
	await expect(page.getByRole("status")).toContainText("Booked Cargo");

	await page.getByRole("button", { name: "Cancel Cargo afternoon" }).click();

	await expect(page.getByRole("status")).toContainText("Cancelled Cargo");
	await expect(
		page.getByRole("button", { name: "Book Cargo afternoon" }),
	).toBeVisible();
	await expect(page.getByText("No upcoming bookings.")).toBeVisible();
});

test("a bike can't be booked twice for the same slot", async ({
	page,
	browser,
}) => {
	const day = `/dashboard?date=${nextWeek()}`;
	await page.goto(day);

	// A second browser, signed in as the same user, opens the same day.
	const otherContext = await browser.newContext({
		storageState: await page.context().storageState(),
	});
	const otherPage = await otherContext.newPage();
	await otherPage.goto(day);

	await page.getByRole("button", { name: "Book Road 1 morning" }).click();
	await expect(page.getByRole("status")).toContainText("Booked Road 1");

	// The other page still shows the slot as free, but booking it fails.
	await otherPage.getByRole("button", { name: "Book Road 1 morning" }).click();
	await expect(
		otherPage.getByText(/Road 1, .+ is already booked/),
	).toBeVisible();

	await otherContext.close();
});
