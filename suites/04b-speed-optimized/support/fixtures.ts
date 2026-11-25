import { test as base, expect, type Page } from "@playwright/test";
import {
	type Account,
	type Bike,
	createUser,
	deleteUser,
	OFFICE_FLEET,
	PASSWORD,
	sessionCookie,
	setFleet,
} from "./api";

type Options = {
	/**
	 * `"shared"` (default) signs the page in as the user from
	 * `global-setup.ts`. `"new"` creates a user for this test through the API,
	 * which is much faster than signing up through the form.
	 */
	account: "shared" | "new";
	/**
	 * The bikes a `"new"` account's team starts with, set through the Fleet
	 * API. Defaults to the office fleet; `[]` leaves the team without bikes.
	 */
	fleet: readonly Bike[];
};

export const test = base.extend<
	Options & { user: Account; newAccount: Account | undefined }
>({
	account: ["shared", { option: true }],
	fleet: [OFFICE_FLEET, { option: true }],
	newAccount: [
		async ({ account, fleet, request, context, baseURL }, use) => {
			if (account !== "new") return use(undefined);

			const user = await createUser(request);
			if (fleet.length > 0) await setFleet(request, user.apiKey, fleet);
			await context.addCookies([
				sessionCookie(user.session, baseURL as string),
			]);
			await use({ email: user.email, password: user.password });
			await deleteUser(request, user.email);
		},
		{ auto: true },
	],
	user: async ({ newAccount, request }, use) => {
		if (newAccount) return use(newAccount);
		const user = await (await request.get("/api/user")).json();
		await use({ email: user.email, password: PASSWORD });
	},
});

export { expect };

export async function signOut(page: Page) {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}
