// intent: "book Road 1 for the morning"
// test: "a new user can sign up and book a bike"
import type { StepContext } from "playwright-intent";

export default async function ({ page, context, request, expect, vars }: StepContext): Promise<void> {
	await page.getByRole('button', { name: 'Book Road 1 morning' }).click();
	await expect(page.getByRole('status')).toContainText('Booked Road 1');
}
