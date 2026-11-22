import { test as base } from "@playwright/test";
import {
	type Account,
	createUser,
	deleteUser,
	PASSWORD,
	sessionCookie,
} from "./api";
import { AuthForm, CheckoutPage, TeamSettingsPage } from "./pages";

type Options = {
	/**
	 * Which user the page is signed in as in the `signed-in` project:
	 *
	 * - `"shared"` (default): the user from `global-setup.ts`, shared by every
	 *   test. Only use it in tests that don't change the account.
	 * - `"new"`: a brand new user for this test, deleted afterwards. Use it in
	 *   tests that change the account, so they can't affect each other.
	 */
	account: "shared" | "new";
};

type Fixtures = {
	/** The user the page is signed in as. */
	user: Account;
	/** A user that exists but isn't signed in to the page. */
	existingUser: Account;
	authForm: AuthForm;
	checkoutPage: CheckoutPage;
	teamPage: TeamSettingsPage;
};

export const test = base.extend<
	Options & Fixtures & { newAccount: Account | undefined }
>({
	account: ["shared", { option: true }],
	// Runs for every test, so `account: "new"` takes effect even in tests that
	// don't use the `user` fixture.
	newAccount: [
		async ({ account, request, context, baseURL }, use) => {
			if (account !== "new") return use(undefined);

			const user = await createUser(request);
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

		// `request` is signed in with the same storage state as the page.
		const user = await (await request.get("/api/user")).json();
		await use({ email: user.email, password: PASSWORD });
	},
	existingUser: async ({ request }, use) => {
		const user = await createUser(request);
		await use({ email: user.email, password: user.password });
		await deleteUser(request, user.email);
	},
	authForm: async ({ page }, use) => use(new AuthForm(page)),
	checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
	teamPage: async ({ page }, use) => use(new TeamSettingsPage(page)),
});

export { expect, type Page } from "@playwright/test";
