import { expect, test } from "../../support/fixtures";

const plans = [
	{ name: "Base", price: "$8", amount: 800, index: 0 },
	{ name: "Plus", price: "$12", amount: 1200, index: 1 },
];

test.beforeEach(async ({ page }) => {
	await page.goto("/pricing");
});

for (const plan of plans) {
	test(`shows the ${plan.name} plan with its price and trial`, async ({
		page,
	}) => {
		const card = page
			.locator("div")
			.filter({ has: page.getByRole("heading", { name: plan.name }) })
			.last();

		await expect(
			card.getByText(`${plan.price} per user / month`),
		).toBeVisible();
		await expect(card.getByText("with 7 day free trial")).toBeVisible();
	});

	test(`starting the ${plan.name} plan opens its checkout`, async ({
		page,
	}) => {
		await page
			.getByRole("button", { name: "Get Started" })
			.nth(plan.index)
			.click();

		await expect(page).toHaveURL(
			`/pricing/checkout?plan=${plan.name}&amount=${plan.amount}`,
		);
	});
}

test("Plus includes everything in Base", async ({ page }) => {
	await expect(page.getByText("Everything in Base, and:")).toBeVisible();
	await expect(page.getByText("24/7 Support + Slack Access")).toBeVisible();
});

test("explains that payments are a demo", async ({ page }) => {
	await expect(page.getByText("Demo Payment System:")).toBeVisible();
});
