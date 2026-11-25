import { test as base, expect, type Page } from "@playwright/test";
import {
	type Account,
	createUser,
	deleteUser,
	OFFICE_FLEET,
	PASSWORD,
	sessionCookie,
	setFleet,
	uniqueEmail,
} from "./api";

/**
 * The cookie consent dialog can cover the page at any moment after it loads.
 * A locator handler dismisses it whenever it gets in the way of an action,
 * however late it shows up.
 */
export async function dismissCookieConsentWhenItAppears(page: Page) {
	await page.addLocatorHandler(
		page.getByRole("dialog", { name: "We value your privacy" }),
		async (dialog) => {
			await dialog.getByRole("button", { name: "Accept all" }).click();
		},
	);
}

export const test = base.extend<{ user: Account }>({
	page: async ({ page }, use) => {
		await dismissCookieConsentWhenItAppears(page);
		await use(page);
	},
	user: async ({ request, context, baseURL }, use) => {
		const user = await createUser(request);
		await context.addCookies([sessionCookie(user.session, baseURL as string)]);
		await use({
			email: user.email,
			password: user.password,
			apiKey: user.apiKey,
		});
		await deleteUser(request, user.email);
	},
});

export { expect, OFFICE_FLEET, PASSWORD, setFleet, uniqueEmail };
