import { expect, type Page, testWithNewUser } from "../../support/fixtures";

const VALID_PAYMENT = {
	cardHolderName: "Ada Lovelace",
	cardNumber: "12345678",
	expiryDate: "12/30",
	cvv: "123",
	billingAddress: "1 Analytical Engine Way",
	city: "London",
	state: "Greater London",
	zipCode: "N1 9GU",
	country: "United Kingdom",
} as const;

const PAYMENT_LABELS: Record<keyof typeof VALID_PAYMENT, string> = {
	cardHolderName: "Card Holder Name",
	cardNumber: "Card Number (8 digits only)",
	expiryDate: "Expiry Date",
	cvv: "CVV",
	billingAddress: "Street Address",
	city: "City",
	state: "State",
	zipCode: "ZIP Code",
	country: "Country",
};

async function openCheckout(page: Page, plan: "Base" | "Plus") {
	await page.goto("/pricing");
	await page
		.getByRole("button", { name: "Get Started" })
		.nth(plan === "Base" ? 0 : 1)
		.click();
	await expect(page).toHaveURL(/\/pricing\/checkout/);
}

async function fillCheckout(
	page: Page,
	overrides: Partial<Record<keyof typeof VALID_PAYMENT, string>> = {},
) {
	const values = { ...VALID_PAYMENT, ...overrides };
	for (const [field, label] of Object.entries(PAYMENT_LABELS)) {
		await page
			.getByRole("textbox", { name: label })
			.fill(values[field as keyof typeof VALID_PAYMENT]);
	}
}

for (const { plan, price } of [
	{ plan: "Base", price: "$8/month" },
	{ plan: "Plus", price: "$12/month" },
] as const) {
	testWithNewUser(`checkout summarises the ${plan} plan`, async ({ page }) => {
		await openCheckout(page, plan);

		await expect(
			page.getByText(`You are purchasing: ${plan} for ${price}`),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Complete Purchase/ }),
		).toHaveText(`Complete Purchase - ${price}`);
	});
}

testWithNewUser.describe("upgrading", () => {
	testWithNewUser(
		"upgrading to Base starts a monthly subscription",
		async ({ page, ai }) => {
			await page.goto("/pricing");
			await ai.do(
				"choose the Base plan and complete checkout with a valid card",
			);

			await expect(page).toHaveURL("/dashboard/team?payment=success");
			await expect(page.getByText("Current Plan: Base")).toBeVisible();
			await expect(page.getByText("Billed monthly")).toBeVisible();
		},
	);

	testWithNewUser(
		"upgrading to Plus records exactly one payment",
		async ({ page, ai }) => {
			await page.goto("/pricing");
			await ai.do(
				"choose the Plus plan and complete checkout with a valid card",
			);

			await expect(page).toHaveURL("/dashboard/team?payment=success");
			const payments = await (await page.request.get("/api/payment")).json();
			expect(payments).toHaveLength(1);
			expect(payments[0]).toMatchObject({
				planName: "Plus",
				amount: 1200,
				currency: "USD",
			});
		},
	);
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
	testWithNewUser(
		`a ${field} that is ${reason} can't be submitted`,
		async ({ page }) => {
			await openCheckout(page, "Plus");
			await fillCheckout(page, { [field]: value });

			await page.getByRole("button", { name: /Complete Purchase/ }).click();

			await expect(
				page.getByRole("textbox", { name: PAYMENT_LABELS[field] }),
			).toHaveJSProperty("validity.valid", false);
			await expect(page).toHaveURL(/\/pricing\/checkout/);
		},
	);
}
