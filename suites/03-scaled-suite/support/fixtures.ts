import { test as base } from "playwright-intent";
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
	 * Which user the page is signed in as in the `signed-in` project:
	 *
	 * - `"shared"` (default): the user from `global-setup.ts`, shared by every
	 *   test. Only use it in tests that don't change the account or book bikes.
	 * - `"new"`: a brand new user for this test, deleted afterwards. Use it in
	 *   tests that change data, so they can't affect each other.
	 */
	account: "shared" | "new";
	/** The bikes a `"new"` account's team starts with. */
	fleet: Bike[];
};

type Fixtures = {
	/** The user the page is signed in as. */
	user: Account;
	/** A user that exists but isn't signed in to the page. */
	existingUser: Account;
	/** The Fleet API key of the user's team. Needs `account: "new"`. */
	apiKey: string;
};

type NewAccount = Account & { apiKey: string };

export const test = base.extend<
	Options & Fixtures & { newAccount: NewAccount | undefined }
>({
	account: ["shared", { option: true }],
	fleet: [OFFICE_FLEET, { option: true }],
	// Runs for every test, so `account: "new"` takes effect even in tests that
	// don't use the `user` fixture.
	newAccount: [
		async ({ account, fleet, request, context, baseURL }, use) => {
			if (account !== "new") return use(undefined);

			const user = await createUser(request);
			if (fleet.length > 0) await setFleet(request, user.apiKey, fleet);
			await context.addCookies([
				sessionCookie(user.session, baseURL as string),
			]);
			await use(user);
			await deleteUser(request, user.email);
		},
		{ auto: true },
	],
	user: async ({ newAccount, request }, use) => {
		if (newAccount) return use(newAccount);

		// `request` is signed in with the same storage state as the page.
		const user = await (await request.get("/api/user")).json();
		await use({ email: user.email, password: PASSWORD });
	},
	apiKey: async ({ newAccount }, use) => {
		if (!newAccount) {
			throw new Error('The apiKey fixture needs test.use({ account: "new" })');
		}
		await use(newAccount.apiKey);
	},
	existingUser: async ({ request }, use) => {
		const user = await createUser(request);
		await use(user);
		await deleteUser(request, user.email);
	},
});

export { expect, type Page } from "@playwright/test";
