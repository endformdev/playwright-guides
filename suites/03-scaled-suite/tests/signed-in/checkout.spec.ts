import { expect, test } from "../../support/fixtures";

for (const { plan, price } of [
	{ plan: "Base", price: "$8/month" },
	{ plan: "Plus", price: "$12/month" },
] as const) {
	test(`checkout summarises the ${plan} plan`, async ({
		page,
		checkoutPage,
	}) => {
		await checkoutPage.goto(plan);

		await expect(
			page.getByText(`You are purchasing: ${plan} for ${price}`),
		).toBeVisible();
		await expect(checkoutPage.submit).toHaveText(
			`Complete Purchase - ${price}`,
		);
	});
}

test.describe("upgrading", () => {
	test.use({ account: "new" });

	test("upgrading to Base starts a monthly subscription", async ({
		page,
		checkoutPage,
	}) => {
		await checkoutPage.purchase("Base");

		await expect(page.getByText("Current Plan: Base")).toBeVisible();
		await expect(page.getByText("Billed monthly")).toBeVisible();
	});

	test("upgrading to Plus records exactly one payment", async ({
		page,
		checkoutPage,
	}) => {
		await checkoutPage.purchase("Plus");

		const payments = await (await page.request.get("/api/payment")).json();
		expect(payments).toHaveLength(1);
		expect(payments[0]).toMatchObject({
			planName: "Plus",
			amount: 1200,
			currency: "USD",
		});
	});
});

const invalidFields = [
	{ field: "cardNumber", value: "1234", reason: "too short" },
	{ field: "cardNumber", value: "abcdefgh", reason: "not digits" },
	{ field: "cardNumber", value: "1234-567", reason: "has symbols" },
	{ field: "expiryDate", value: "1230", reason: "missing slash" },
	{ field: "expiryDate", value: "12-30", reason: "wrong separator" },
	{ field: "cvv", value: "12", reason: "too short" },
	{ field: "cvv", value: "abc", reason: "not digits" },
] as const;

for (const { field, value, reason } of invalidFields) {
	test(`a ${field} that is ${reason} can't be submitted`, async ({
		page,
		checkoutPage,
	}) => {
		await checkoutPage.goto("Plus");
		await checkoutPage.fill({ [field]: value });

		await checkoutPage.submit.click();

		await expect(checkoutPage.fields[field]).toHaveJSProperty(
			"validity.valid",
			false,
		);
		await expect(page).toHaveURL(/\/pricing\/checkout/);
	});
}
