import { addBike, nextWeek } from "./bikebook";
import { expect, testWithNewUser } from "./test-with-new-user";

testWithNewUser(
	"users can book a bike and see it in their upcoming bookings",
	async ({ page, ai }) => {
		await page.goto(`/dashboard?date=${nextWeek()}`);
		await addBike(page, "Road 1", "road");
		await ai.do("book Road 1 for the morning");

		await expect(page.getByRole("status")).toContainText("Booked Road 1");
		await expect(page.getByRole("row", { name: /Road 1/ })).toContainText(
			"Booked by you",
		);
		await expect(
			page.getByRole("listitem").filter({ hasText: "Road 1" }),
		).toContainText("morning");

		await page.getByRole("link", { name: "Activity" }).click();
		await expect(page.getByText(/You booked Road 1/)).toBeVisible();
	},
);

testWithNewUser(
	"cancelling a booking frees the slot again",
	async ({ page }) => {
		await page.goto(`/dashboard?date=${nextWeek()}`);
		await addBike(page, "Cargo", "cargo");

		await page.getByRole("button", { name: "Book Cargo afternoon" }).click();
		await expect(page.getByRole("status")).toContainText("Booked Cargo");

		await page.getByRole("button", { name: "Cancel Cargo afternoon" }).click();
		await expect(page.getByRole("status")).toContainText("Cancelled Cargo");
		await expect(
			page.getByRole("button", { name: "Book Cargo afternoon" }),
		).toBeVisible();
		await expect(page.getByText("No upcoming bookings.")).toBeVisible();
	},
);

testWithNewUser(
	"a bike can't be booked twice for the same slot",
	async ({ page, browser }) => {
		const day = `/dashboard?date=${nextWeek()}`;
		await page.goto(day);
		await addBike(page, "Road 1", "road");

		const otherContext = await browser.newContext({
			storageState: await page.context().storageState(),
		});
		const otherPage = await otherContext.newPage();
		await otherPage.goto(day);

		await page.getByRole("button", { name: "Book Road 1 morning" }).click();
		await expect(page.getByRole("status")).toContainText("Booked Road 1");

		await otherPage
			.getByRole("button", { name: "Book Road 1 morning" })
			.click();
		await expect(
			otherPage.getByText(/Road 1, .+ is already booked/),
		).toBeVisible();

		await otherContext.close();
	},
);
