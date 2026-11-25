import type { APIRequestContext } from "@playwright/test";

export const PASSWORD = "testpassword123";

// The app exposes an internal API for creating and deleting users from test
// code, protected by a shared token.
const INTERNAL_API_HEADERS = { authorization: "Bearer VerySecretDummyToken" };

export type Account = { email: string; password: string };

/** The bikes the tests' offices have, unless a test asks for an empty one. */
export const OFFICE_FLEET = [
	{ name: "Road 1", type: "road" },
	{ name: "Road 2", type: "road" },
	{ name: "City 1", type: "city" },
	{ name: "City 2", type: "city" },
	{ name: "E-City 1", type: "e-city" },
	{ name: "E-City 2", type: "e-city" },
	{ name: "E-City 3", type: "e-city" },
	{ name: "Cargo", type: "cargo" },
];

export type Bike = { name: string; type: string };

export function uniqueEmail(prefix = "user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function createUser(
	request: APIRequestContext,
	email = uniqueEmail(),
): Promise<Account & { session: string; apiKey: string }> {
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

/**
 * New teams start without bikes. This sets a team's fleet with the Fleet API,
 * authenticated with the team's API key.
 */
export async function setFleet(
	request: APIRequestContext,
	apiKey: string,
	bikes: Bike[] = OFFICE_FLEET,
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
	return (await response.json()).bikes as (Bike & { id: number })[];
}

/** A day `days` from today, as YYYY-MM-DD in UTC like the app's dates. */
export function daysFromNow(days: number) {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + days);
	return day.toISOString().slice(0, 10);
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
