import { expect, setFleet, test } from "../support/fixtures";

/** A date `days` from today as YYYY-MM-DD, in UTC like the app. */
function dayFromToday(days: number) {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + days);
	return day.toISOString().slice(0, 10);
}

/** How the app writes a day, e.g. "Thu 4 Jun". */
function formatDay(date: string) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	}).format(new Date(`${date}T00:00:00Z`));
}

test("a member books a bike and cancels it again", async ({
	page,
	request,
	user,
}) => {
	const tomorrow = dayFromToday(1);
	const booking = `Road 1, ${formatDay(tomorrow)}, morning`;

	await test.step("Give the office its bikes", async () => {
		await setFleet(request, user.apiKey);
	});

	await test.step("Book a road bike for tomorrow morning", async () => {
		await page.goto(`/dashboard?date=${tomorrow}`);
		await page.getByRole("button", { name: "Book Road 1 morning" }).click();
		await expect(page.getByRole("status")).toHaveText(`Booked ${booking}`);
	});

	await test.step("See it in your upcoming bookings", async () => {
		await expect(
			page.getByRole("listitem").filter({ hasText: booking }),
		).toBeVisible();
	});

	await test.step("Cancel it from your upcoming bookings", async () => {
		await page.getByRole("button", { name: `Cancel ${booking}` }).click();
		await expect(page.getByText("No upcoming bookings.")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Book Road 1 morning" }),
		).toBeVisible();
	});

	await test.step("Find both in the activity log", async () => {
		await page.getByRole("link", { name: "Activity" }).click();
		await expect(
			page.getByRole("listitem").filter({ hasText: `You booked ${booking}` }),
		).toBeVisible();
		await expect(
			page
				.getByRole("listitem")
				.filter({ hasText: `You cancelled ${booking}` }),
		).toBeVisible();
	});
});

// This test waits a fixed time for the bikes page to switch to the chosen day,
// instead of waiting for the day to show up. Usually the new day has loaded by
// then; when the server is a bit slower, the click lands on the Book button of
// the day still on screen, today, and books the wrong day.
test("a member books a bike for next week", async ({ page, request, user }) => {
	const nextWeek = dayFromToday(7);

	await test.step("Give the office its bikes", async () => {
		await setFleet(request, user.apiKey);
	});

	await test.step("Pick a day next week on the bikes page", async () => {
		await page.goto("/dashboard");
		await page.getByRole("textbox", { name: "Date" }).fill(nextWeek);
		await page.waitForTimeout(500);
	});

	await test.step("Book a road bike for the morning", async () => {
		await page.getByRole("button", { name: "Book Road 1 morning" }).click();
	});

	await test.step("See the booking confirmed for that day", async () => {
		await expect(page.getByRole("status")).toHaveText(
			`Booked Road 1, ${formatDay(nextWeek)}, morning`,
		);
	});
});
