import { test as base } from "@playwright/test";
import { createUser, deleteUser, sessionCookie } from "../support/api";
import { expect, test } from "../support/fixtures";

async function fillCheckout(page: import("@playwright/test").Page) {
	const textbox = (name: string) => page.getByRole("textbox", { name });
	await textbox("Card Holder Name").fill("Ada Lovelace");
	await textbox("Card Number (8 digits only)").fill("12345678");
	await textbox("Expiry Date").fill("12/30");
	await textbox("CVV").fill("123");
	await textbox("Street Address").fill("1 Analytical Engine Way");
	await textbox("City").fill("London");
	await textbox("State").fill("Greater London");
	await textbox("ZIP Code").fill("N1 9GU");
	await textbox("Country").fill("United Kingdom");
}

test("checkout explains which plan is being bought", async ({ page }) => {
	await test.step("Choose the Pro plan", async () => {
		await page.goto("/pricing");
		await page.getByRole("button", { name: "Get Started" }).nth(1).click();
	});

	await test.step("See the plan and its price on the checkout", async () => {
		await expect(
			page.getByText("You are purchasing: Pro for $15/month"),
		).toBeVisible();
	});
});

// This test deliberately doesn't use the shared fixtures: it handles the
// cookie consent dialog itself, by checking for it once.
base(
	"a returning customer upgrades to Base",
	async ({ page, request, context, baseURL }) => {
		const user = await createUser(request);
		await context.addCookies([sessionCookie(user.session, baseURL as string)]);

		await base.step("Open the pricing page and accept cookies", async () => {
			await page.goto("/pricing");
			await page.waitForTimeout(1000);
			const consent = page.getByRole("dialog", {
				name: "We value your privacy",
			});
			if (await consent.isVisible()) {
				await consent.getByRole("button", { name: "Accept all" }).click();
			}
		});

		await base.step("Buy the Base plan", async () => {
			await page.getByRole("button", { name: "Get Started" }).first().click();
			await fillCheckout(page);
			await page.getByRole("button", { name: /Complete Purchase/ }).click();
		});

		await base.step("See the team on the Base plan", async () => {
			await expect(page).toHaveURL("/dashboard/team?payment=success");
			await expect(page.getByText("Billed monthly")).toBeVisible();
		});

		await deleteUser(request, user.email);
	},
);
