import type { APIRequestContext } from "@playwright/test";

export const PASSWORD = "testpassword123";

// The app exposes an internal API for creating and deleting users from test
// code, protected by a shared token.
const INTERNAL_API_HEADERS = { authorization: "Bearer VerySecretDummyToken" };

export type Account = { email: string; password: string; apiKey: string };

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

	const { session, team } = await response.json();
	return { email, password: PASSWORD, session, apiKey: team.apiKey };
}

/** The bikes most tests give their team: a typical small office's pool. */
export const OFFICE_FLEET = [
	{ name: "Road 1", type: "road" },
	{ name: "Road 2", type: "road" },
	{ name: "City 1", type: "city" },
	{ name: "City 2", type: "city" },
	{ name: "E-City 1", type: "e-city" },
	{ name: "E-City 2", type: "e-city" },
	{ name: "E-City 3", type: "e-city" },
	{ name: "Cargo", type: "cargo" },
] as const;

export type Bike = {
	name: string;
	type: "road" | "city" | "e-city" | "cargo";
};

/**
 * New teams have no bikes. Tests give a team its fleet through the Fleet API,
 * authenticated with the team's API key.
 */
export async function setFleet(
	request: APIRequestContext,
	apiKey: string,
	bikes: readonly Bike[] = OFFICE_FLEET,
) {
	const response = await request.put("/api/fleet", {
		headers: { authorization: `Bearer ${apiKey}` },
		data: { bikes },
	});
	if (!response.ok()) {
		throw new Error(
			`Setting the fleet failed (${response.status()}): ${await response.text()}`,
		);
	}
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
