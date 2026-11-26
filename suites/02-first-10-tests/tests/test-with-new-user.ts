import type { APIRequestContext } from "@playwright/test";
import { test as base } from "playwright-intent";

export const PASSWORD = "testpassword123";

// Internal test endpoint disabled in production and gated behind a shared token.
const INTERNAL_API_HEADERS = { authorization: "Bearer VerySecretDummyToken" };

export type User = { email: string; password: string; session: string };

export const testWithNewUser = base.extend<{ newUser: User }>({
	newUser: [
		async ({ request, context, baseURL }, use) => {
			const user = await createUser(request);
			await context.addCookies([
				sessionCookie(user.session, baseURL as string),
			]);
			await use(user);
			await deleteUser(request, user.email);
		},
		{ auto: true },
	],
});

export { expect } from "@playwright/test";

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function createUser(
	request: APIRequestContext,
	email = uniqueEmail(),
): Promise<User> {
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
