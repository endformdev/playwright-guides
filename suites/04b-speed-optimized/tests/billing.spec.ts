import { fillCheckout, purchase } from "../support/actions";
import { expect, test } from "../support/fixtures";

test("pricing lists both plans", async ({ page }) => {
	await page.goto("/pricing");

	await expect(page.getByText("Unlimited bookings")).toBeVisible();
	await expect(page.getByText("Everything in Base, and:")).toBeVisible();
	await expect(page.getByRole("button", { name: "Get Started" })).toHaveCount(
		2,
	);
});

test("checkout summarises the chosen plan", async ({ page }) => {
	await page.goto("/pricing/checkout?plan=Plus&amount=1200");

	await expect(
		page.getByText("You are purchasing: Plus for $12/month"),
	).toBeVisible();
});

test("an invalid card number can't be submitted", async ({ page }) => {
	await page.goto("/pricing/checkout?plan=Plus&amount=1200");
	await fillCheckout(page, "1234");

	await page.getByRole("button", { name: /Complete Purchase/ }).click();

	await expect(page).toHaveURL(/\/pricing\/checkout/);
	await expect(
		page.getByRole("textbox", { name: "Card Number (8 digits only)" }),
	).toHaveJSProperty("validity.valid", false);
});

// These tests charge the payment provider. `endform.config.ts` limits how many
// of them run at the same time.
test.describe("upgrading", { tag: "@payments" }, () => {
	test.use({ account: "new" });

	test("upgrading to Base starts a subscription", async ({ page }) => {
		await purchase(page, "Base");

		await expect(page.getByText("Current Plan: Base")).toBeVisible();
		await expect(page.getByText("Billed monthly")).toBeVisible();
	});

	test("upgrading to Plus records exactly one payment", async ({ page }) => {
		await purchase(page, "Plus");

		await expect(page.getByText("Current Plan: Plus")).toBeVisible();
		const payments = await (await page.request.get("/api/payment")).json();
		expect(payments).toHaveLength(1);
		expect(payments[0]).toMatchObject({ planName: "Plus", amount: 1200 });
	});

	test("switching from Base to Plus records both payments", async ({
		page,
	}) => {
		await purchase(page, "Base");
		await purchase(page, "Plus");

		await expect(page.getByText("Current Plan: Plus")).toBeVisible();
		const payments = await (await page.request.get("/api/payment")).json();
		expect(payments).toHaveLength(2);
	});
});
