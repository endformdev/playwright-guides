// intent: "choose the Pro plan and complete checkout with a valid card"
// test: "users can upgrade from Free to the Pro plan"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("link", { name: "Change Plan" }).click();
	await expect(page).toHaveURL(/\/pricing$/);
	await page.getByRole("button", { name: "Get Started" }).nth(1).click();
	await expect(page).toHaveURL(/\/pricing\/checkout\?plan=Pro/);
	await page
		.getByRole("textbox", { name: "Card Holder Name" })
		.fill("Test User");
	await page
		.getByRole("textbox", { name: "Card Number (8 digits only)" })
		.fill("12345678");
	await page.getByRole("textbox", { name: "Expiry Date" }).fill("12/30");
	await page.getByRole("textbox", { name: "CVV" }).fill("123");
	await page
		.getByRole("textbox", { name: "Street Address" })
		.fill("123 Main Street");
	await page.getByRole("textbox", { name: "City" }).fill("New York");
	await page.getByRole("textbox", { name: "State" }).fill("NY");
	await page.getByRole("textbox", { name: "ZIP Code" }).fill("10001");
	await page.getByRole("textbox", { name: "Country" }).fill("United States");
	await page
		.getByRole("button", { name: "Complete Purchase - $15/month" })
		.click();
	await expect(page).toHaveURL(/\/dashboard\/team\?payment=success$/);
	await expect(page.getByText("Current Plan: Pro")).toBeVisible();
}
