import {
	addBike,
	book,
	daysFromNow,
	describeBooking,
} from "../support/actions";
import { expect, testWithNewUser as test } from "../support/fixtures";

test("owners can add bikes to the fleet", async ({ page }) => {
	await page.goto("/dashboard");
	await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();

	await addBike(page, "Road 1", "road");
	await addBike(page, "Cargo", "cargo");

	await expect(page.getByRole("row", { name: /^Road 1 / })).toBeVisible();
	await expect(page.getByRole("button", { name: /^Book / })).toHaveCount(4);
});

test("past days can't be booked", async ({ page, fleet }) => {
	await fleet.add({ name: "Road 1", type: "road" });

	await page.goto("/dashboard");
	await page.getByRole("link", { name: "Previous day" }).click();

	await expect(page).toHaveURL(`/dashboard?date=${daysFromNow(-1)}`);
	await expect(page.getByRole("row", { name: /^Road 1 / })).toBeVisible();
	await expect(page.getByRole("button", { name: /^Book / })).toHaveCount(0);
});

test("users can book a bike and see it in their upcoming bookings", async ({
	page,
	fleet,
}) => {
	await fleet.seed();
	const date = daysFromNow(1);
	await page.goto(`/dashboard?date=${date}`);

	await book(page, "E-City 2", date, "morning");

	await expect(page.getByRole("row", { name: /^E-City 2 / })).toContainText(
		"Booked by you",
	);
	await expect(
		page.getByRole("link", {
			name: describeBooking("E-City 2", date, "morning"),
		}),
	).toBeVisible();
});

test("users can cancel their booking", async ({ page, fleet }) => {
	await fleet.add({ name: "Road 1", type: "road" });
	const date = daysFromNow(2);
	const booking = describeBooking("Road 1", date, "afternoon");
	await page.goto(`/dashboard?date=${date}`);
	await book(page, "Road 1", date, "afternoon");

	await page.getByRole("button", { name: `Cancel ${booking}` }).click();

	await expect(page.getByText("No upcoming bookings.")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Book Road 1 afternoon", exact: true }),
	).toBeVisible();
});

test("a booked slot can't be booked again", async ({
	page,
	browser,
	fleet,
}) => {
	await fleet.add({ name: "Cargo", type: "cargo" });
	const date = daysFromNow(3);
	// A second browser, signed in as the same user, opens the day before
	// the slot is taken.
	const other = await browser.newContext({
		storageState: await page.context().storageState(),
	});
	const otherPage = await other.newPage();
	await otherPage.goto(`/dashboard?date=${date}`);
	await page.goto(`/dashboard?date=${date}`);
	await book(page, "Cargo", date, "morning");

	await otherPage
		.getByRole("button", { name: "Book Cargo morning", exact: true })
		.click();

	await expect(
		otherPage.getByText(
			`${describeBooking("Cargo", date, "morning")} is already booked`,
		),
	).toBeVisible();
	await expect(otherPage.getByRole("link", { name: /^Cargo, / })).toHaveCount(
		1,
	);
	await other.close();
});

test("owners can cancel a member's booking, members can't cancel theirs", async ({
	page,
	newUser,
	fleet,
	team,
}) => {
	await fleet.add({ name: "City 1", type: "city" });
	const date = daysFromNow(4);
	const member = await team.addMember();

	await member.page.goto(`/dashboard?date=${date}`);
	await book(member.page, "City 1", date, "morning");

	await page.goto(`/dashboard?date=${date}`);
	await book(page, "City 1", date, "afternoon");

	await member.page.reload();
	await expect(
		member.page.getByRole("row", { name: /^City 1 / }),
	).toContainText(`Booked by ${newUser.email}`);
	await expect(
		member.page.getByRole("button", { name: "Cancel City 1 afternoon" }),
	).toHaveCount(0);

	await expect(page.getByRole("row", { name: /^City 1 / })).toContainText(
		`Booked by ${member.email}`,
	);
	await page.getByRole("button", { name: "Cancel City 1 morning" }).click();
	await expect(
		page.getByRole("status").filter({
			hasText: `Cancelled ${describeBooking("City 1", date, "morning")}`,
		}),
	).toBeVisible();
});

test("activity shows bookings and cancellations", async ({ page, fleet }) => {
	await fleet.add({ name: "Road 2", type: "road" });
	const date = daysFromNow(5);
	const booking = describeBooking("Road 2", date, "morning");
	await page.goto(`/dashboard?date=${date}`);
	await book(page, "Road 2", date, "morning");
	await page.getByRole("button", { name: `Cancel ${booking}` }).click();
	await expect(page.getByText("No upcoming bookings.")).toBeVisible();

	await page.goto("/dashboard/activity");
	await expect(page.getByRole("listitem").nth(0)).toContainText(
		`You cancelled ${booking}`,
	);
	await expect(page.getByRole("listitem").nth(1)).toContainText(
		`You booked ${booking}`,
	);
});
