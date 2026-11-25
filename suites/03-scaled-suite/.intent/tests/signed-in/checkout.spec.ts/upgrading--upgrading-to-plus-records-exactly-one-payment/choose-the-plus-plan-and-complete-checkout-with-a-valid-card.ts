// intent: "choose the Plus plan and complete checkout with a valid card"
// test: "upgrading > upgrading to Plus records exactly one payment"
import type { StepContext } from "playwright-intent";

export default async function ({
	page,
	context,
	request,
	expect,
	vars,
}: StepContext): Promise<void> {
	await page.getByRole("button", { name: "Get Started" }).nth(1).click();
	await expect(page).toHaveURL(/\/pricing\/checkout/);
	await page
		.getByRole("textbox", { name: "Card Holder Name" })
		.fill("Ada Lovelace");
	await page
		.getByRole("textbox", { name: "Card Number (8 digits only)" })
		.fill("12345678");
	await page.getByRole("textbox", { name: "Expiry Date" }).fill("12/30");
	await page.getByRole("textbox", { name: "CVV" }).fill("123");
	await page
		.getByRole("textbox", { name: "Street Address" })
		.fill("1 Analytical Engine Way");
	await page.getByRole("textbox", { name: "City" }).fill("London");
	await page.getByRole("textbox", { name: "State" }).fill("Greater London");
	await page.getByRole("textbox", { name: "ZIP Code" }).fill("N1 9GU");
	await page.getByRole("textbox", { name: "Country" }).fill("United Kingdom");
	await page.getByRole("button", { name: /Complete Purchase/ }).click();
	await expect(page).toHaveURL("/dashboard/team?payment=success");
}
