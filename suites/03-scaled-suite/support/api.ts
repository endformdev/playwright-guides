import type { APIRequestContext } from "@playwright/test";

export const PASSWORD = "testpassword123";

// The app exposes an internal API for creating and deleting users from test
// code, protected by a shared token.
const INTERNAL_API_HEADERS = { authorization: "Bearer VerySecretDummyToken" };

export type Account = { email: string; password: string };

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function createUser(
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

export async function deleteUser(request: APIRequestContext, email: string) {
	await request.delete("/api/internal/user", {
		headers: INTERNAL_API_HEADERS,
		data: { email },
	});
}

export function sessionCookie(session: string, baseURL: string) {
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
