import type { Browser } from "@playwright/test";
import { daysFromNow, PASSWORD, uniqueEmail } from "../../support/api";
import { expect, type Page, test } from "../../support/fixtures";

const bikeRow = (page: Page, bike: string) =>
	page.getByRole("row").filter({
		has: page.getByRole("rowheader", { name: bike, exact: true }),
	});
const bookButton = (page: Page, bike: string, slot: "morning" | "afternoon") =>
	page.getByRole("button", { name: `Book ${bike} ${slot}` });
const upcoming = (page: Page) =>
	page
		.getByRole("list", { name: "Your upcoming bookings" })
		.getByRole("listitem");

/** Books a slot on a day and waits for the confirmation. */
async function book(
	page: Page,
	bike: string,
	slot: "morning" | "afternoon",
	date: string,
) {
	await page.goto(`/dashboard?date=${date}`);
	await bookButton(page, bike, slot).click();
	await expect(page.getByRole("status")).toContainText(`Booked ${bike}`);
}

test.describe("the fleet", () => {
	test("lists the office's bikes with their type", async ({ page }) => {
		await page.goto("/dashboard");

		await expect(page.getByRole("rowheader")).toHaveText([
			"Road 1",
			"Road 2",
			"City 1",
			"City 2",
			"E-City 1",
			"E-City 2",
			"E-City 3",
			"Cargo",
		]);
		await expect(bikeRow(page, "E-City 1")).toContainText("Electric city bike");
		await expect(bikeRow(page, "Cargo")).toContainText("Cargo bike");
	});

	test("every bike can be booked for the morning or the afternoon", async ({
		page,
	}) => {
		await page.goto(`/dashboard?date=${daysFromNow(30)}`);

		await expect(bookButton(page, "Cargo", "morning")).toBeVisible();
		await expect(bookButton(page, "Cargo", "afternoon")).toBeVisible();
		await expect(page.getByRole("button", { name: /^Book / })).toHaveCount(16);
	});

	test.describe("an empty office", () => {
		test.use({ account: "new", fleet: [] });

		test("explains how owners add bikes", async ({ page }) => {
			await page.goto("/dashboard");

			await expect(
				page.getByText("Your office has no bikes yet."),
			).toBeVisible();
			await expect(
				page.getByRole("button", { name: "Add bike" }),
			).toBeVisible();
		});
	});
});

test.describe("picking a day", () => {
	test("starts on today", async ({ page }) => {
		await page.goto("/dashboard");

		await expect(page.getByLabel("Date")).toHaveValue(daysFromNow(0));
		await expect(page.getByRole("link", { name: "Today" })).toHaveCount(0);
	});

	test("moves a day at a time", async ({ page }) => {
		await page.goto("/dashboard");

		await page.getByRole("link", { name: "Next day" }).click();
		await expect(page).toHaveURL(`/dashboard?date=${daysFromNow(1)}`);
		await page.getByRole("link", { name: "Next day" }).click();
		await page.getByRole("link", { name: "Previous day" }).click();

		await expect(page.getByLabel("Date")).toHaveValue(daysFromNow(1));
	});

	test("jumps to a date from the date picker and back to today", async ({
		page,
	}) => {
		await page.goto("/dashboard");

		await page.getByLabel("Date").fill(daysFromNow(10));
		await expect(page).toHaveURL(`/dashboard?date=${daysFromNow(10)}`);
		await page.getByRole("link", { name: "Today" }).click();

		await expect(page.getByLabel("Date")).toHaveValue(daysFromNow(0));
	});

	test("past days can't be booked", async ({ page }) => {
		await page.goto(`/dashboard?date=${daysFromNow(-1)}`);

		await expect(page.getByRole("rowheader")).toHaveCount(8);
		await expect(page.getByRole("button", { name: /^Book / })).toHaveCount(0);
	});
});

test.describe("booking", () => {
	test.use({ account: "new" });

	test("a booked slot shows who has the bike", async ({ page }) => {
		await book(page, "E-City 2", "morning", daysFromNow(3));

		await expect(bikeRow(page, "E-City 2")).toContainText("Booked by you");
		await expect(bookButton(page, "E-City 2", "morning")).toHaveCount(0);
		await expect(bookButton(page, "E-City 2", "afternoon")).toBeVisible();
	});

	test("upcoming bookings are listed in date order", async ({ page }) => {
		await book(page, "Road 1", "afternoon", daysFromNow(5));
		await book(page, "Cargo", "morning", daysFromNow(2));
		await book(page, "City 2", "morning", daysFromNow(5));

		await expect(upcoming(page)).toHaveCount(3);
		await expect(upcoming(page).nth(0)).toContainText("Cargo");
		await expect(upcoming(page).nth(1)).toContainText("City 2");
		await expect(upcoming(page).nth(2)).toContainText("Road 1");
	});

	test("an upcoming booking links to its day", async ({ page }) => {
		const date = daysFromNow(4);
		await book(page, "Road 2", "afternoon", date);
		await page.goto("/dashboard");

		await upcoming(page).getByRole("link").click();

		await expect(page).toHaveURL(`/dashboard?date=${date}`);
		await expect(bikeRow(page, "Road 2")).toContainText("Booked by you");
	});

	test("bookings are logged in the activity log", async ({ page }) => {
		await book(page, "Cargo", "afternoon", daysFromNow(2));

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(page.getByRole("listitem").first()).toContainText(
			/You booked Cargo, .+, afternoon/,
		);
	});

	test("a slot taken in another browser can't be booked again", async ({
		page,
		browser,
	}) => {
		const date = daysFromNow(6);
		await page.goto(`/dashboard?date=${date}`);
		const other = await browser.newContext({
			storageState: await page.context().storageState(),
		});
		const otherPage = await other.newPage();
		await book(otherPage, "Road 1", "morning", date);

		// This page loaded before the booking, so it still offers the slot.
		await bookButton(page, "Road 1", "morning").click();

		await expect(
			page.getByText(/^Road 1, .+, morning is already booked$/),
		).toBeVisible();
		await expect(bikeRow(page, "Road 1")).toContainText("Booked by you");
		await other.close();
	});
});

test.describe("cancelling", () => {
	test.use({ account: "new" });

	test("cancelling from the day frees the slot", async ({ page }) => {
		await book(page, "City 1", "morning", daysFromNow(3));

		await page.getByRole("button", { name: "Cancel City 1 morning" }).click();

		await expect(page.getByRole("status")).toContainText("Cancelled City 1");
		await expect(bookButton(page, "City 1", "morning")).toBeVisible();
	});

	test("cancelling from upcoming bookings removes it from the list", async ({
		page,
	}) => {
		await book(page, "E-City 3", "afternoon", daysFromNow(3));

		await upcoming(page)
			.getByRole("button", { name: /^Cancel/ })
			.click();

		await expect(page.getByText("No upcoming bookings.")).toBeVisible();
	});

	test("cancellations are logged in the activity log", async ({ page }) => {
		await book(page, "City 1", "afternoon", daysFromNow(3));
		await page.getByRole("button", { name: "Cancel City 1 afternoon" }).click();
		await expect(page.getByRole("status")).toContainText("Cancelled");

		await page.getByRole("link", { name: "Activity" }).click();

		await expect(page.getByRole("listitem").nth(0)).toContainText(
			"You cancelled City 1",
		);
		await expect(page.getByRole("listitem").nth(1)).toContainText(
			"You booked City 1",
		);
	});
});

test.describe("booking with teammates", () => {
	test.use({ account: "new" });

	/** Invites a member, who signs up in their own browser. */
	async function addMember(page: Page, browser: Browser) {
		const email = uniqueEmail("member");
		await page.goto("/dashboard/team");
		await page.getByRole("textbox", { name: "Email" }).fill(email);
		await page.getByRole("button", { name: "Invite Member" }).click();
		const link = (await page
			.getByText(`Invite link for ${email}`)
			.getByRole("link")
			.getAttribute("href")) as string;

		const memberContext = await browser.newContext();
		const memberPage = await memberContext.newPage();
		await memberPage.goto(link);
		await memberPage.getByRole("textbox", { name: "Email" }).fill(email);
		await memberPage.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
		await memberPage.getByRole("button", { name: "Sign up" }).click();
		await expect(memberPage).toHaveURL("/dashboard");
		return { email, page: memberPage };
	}

	test("only owners can manage the fleet", async ({ page, browser }) => {
		const member = await addMember(page, browser);

		await page.goto("/dashboard");
		await expect(page.getByRole("button", { name: "Add bike" })).toBeVisible();
		await expect(
			member.page.getByRole("button", { name: "Add bike" }),
		).toHaveCount(0);
	});

	test("members can't cancel someone else's booking", async ({
		page,
		browser,
		user,
	}) => {
		const date = daysFromNow(7);
		const member = await addMember(page, browser);
		await book(page, "Cargo", "morning", date);

		await member.page.goto(`/dashboard?date=${date}`);

		await expect(bikeRow(member.page, "Cargo")).toContainText(
			`Booked by ${user.email}`,
		);
		await expect(
			member.page.getByRole("button", { name: "Cancel Cargo morning" }),
		).toHaveCount(0);
	});

	test("owners can cancel a member's booking", async ({ page, browser }) => {
		const date = daysFromNow(7);
		const member = await addMember(page, browser);
		await book(member.page, "Road 2", "morning", date);

		await page.goto(`/dashboard?date=${date}`);
		await expect(bikeRow(page, "Road 2")).toContainText(
			`Booked by ${member.email}`,
		);
		await page.getByRole("button", { name: "Cancel Road 2 morning" }).click();

		await expect(bookButton(page, "Road 2", "morning")).toBeVisible();
		await member.page.reload();
		await expect(member.page.getByText("No upcoming bookings.")).toBeVisible();
	});
});

test.describe("managing the fleet", () => {
	test.use({ account: "new" });

	test("owners can add and remove bikes through the UI", async ({ page }) => {
		await page.goto("/dashboard");

		await page.getByRole("textbox", { name: "Bike name" }).fill("Gravel 1");
		await page
			.getByRole("combobox", { name: "Bike type" })
			.selectOption("road");
		await page.getByRole("button", { name: "Add bike" }).click();
		await expect(
			page.getByRole("rowheader", { name: "Gravel 1", exact: true }),
		).toBeVisible();

		await page.getByRole("button", { name: "Remove Gravel 1" }).click();
		await expect(
			page.getByRole("rowheader", { name: "Gravel 1", exact: true }),
		).toHaveCount(0);
	});

	test("duplicate bike names are rejected", async ({ page }) => {
		await page.goto("/dashboard");

		await page.getByRole("textbox", { name: "Bike name" }).fill("Road 1");
		await page.getByRole("button", { name: "Add bike" }).click();

		await expect(
			page.getByText("A bike named Road 1 is already in your fleet"),
		).toBeVisible();
	});

	test("removing a bike removes its bookings", async ({ page }) => {
		await book(page, "Cargo", "morning", daysFromNow(3));

		await page.getByRole("button", { name: "Remove Cargo" }).click();

		await expect(
			page.getByRole("rowheader", { name: "Cargo", exact: true }),
		).toHaveCount(0);
		await expect(page.getByText("No upcoming bookings.")).toBeVisible();
	});

	test("changing the fleet through the API keeps bookings of kept bikes", async ({
		page,
		apiKey,
		request,
	}) => {
		const date = daysFromNow(3);
		await book(page, "Road 1", "morning", date);
		await book(page, "Cargo", "morning", date);

		await request.put("/api/fleet", {
			headers: { authorization: `Bearer ${apiKey}` },
			data: {
				bikes: [
					{ name: "Road 1", type: "road" },
					{ name: "Cargo 2", type: "cargo" },
				],
			},
		});
		await page.reload();

		await expect(page.getByRole("rowheader")).toHaveText(["Road 1", "Cargo 2"]);
		await expect(bikeRow(page, "Road 1")).toContainText("Booked by you");
		await expect(upcoming(page)).toHaveCount(1);
	});
});
