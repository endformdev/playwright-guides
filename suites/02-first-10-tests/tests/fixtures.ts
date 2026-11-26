import type { APIRequestContext } from "@playwright/test";
import { test as base } from "playwright-intent";

export const PASSWORD = "testpassword123";

// Internal test endpoint disabled in production and gated behind a shared token.
const INTERNAL_API_HEADERS = { authorization: "Bearer VerySecretDummyToken" };

export type Account = { email: string; password: string };

type Options = {
	/**
	 * When true, each test starts with a fresh isolated user already signed in
	 * via a session cookie, and deletes the user after the test finishes.
	 */
	signedIn: boolean;
};

type Fixtures = {
	/** A fresh user created via the API, without signing the browser in. */
	existingUser: Account;
};

export const test = base.extend<Options & Fixtures & { signedInSession: void }>(
	{
		signedIn: [false, { option: true }],
		signedInSession: [
			async ({ signedIn, request, context, baseURL }, use) => {
				if (!signedIn) return use();

				const { email, session } = await createUser(request);
				await context.addCookies([sessionCookie(session, baseURL as string)]);
				await use();
				await deleteUser(request, email);
			},
			{ auto: true },
		],
		existingUser: async ({ request }, use) => {
			const user = await createUser(request);
			await use({ email: user.email, password: user.password });
			await deleteUser(request, user.email);
		},
	},
);

export { expect } from "@playwright/test";

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function createUser(
	request: APIRequestContext,
	email = uniqueEmail(),
): Promise<Account & { session: string }> {
	const response = await request.post("/api/internal/user", {
		headers: INTERNAL_API_HEADERS,
		data: { email, password: PASSWORD },
	});
	if (!response.ok()) {
		throw new Error(
			`Creating ${email} failed (${response.status()}): ${await response.text()}`,
		);
	}

	const { session } = await response.json();
	return { email, password: PASSWORD, session };
}

async function deleteUser(request: APIRequestContext, email: string) {
	await request.delete("/api/internal/user", {
		headers: INTERNAL_API_HEADERS,
		data: { email },
	});
}

function sessionCookie(session: string, baseURL: string) {
	return {
		name: "session",
		value: session,
		domain: new URL(baseURL).hostname,
		path: "/",
		expires: -1,
		httpOnly: true,
		secure: true,
		sameSite: "Lax" as const,
	};
}
