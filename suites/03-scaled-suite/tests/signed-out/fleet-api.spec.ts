import type { APIRequestContext } from "@playwright/test";
import { createUser, deleteUser, OFFICE_FLEET } from "../../support/api";
import { expect, test } from "../../support/fixtures";

// The Fleet API is authenticated with a team's API key rather than a session,
// so these tests only need a team, not a signed-in browser.
const owner = test.extend<{ apiKey: string }>({
	apiKey: async ({ request }, use) => {
		const user = await createUser(request);
		await use(user.apiKey);
		await deleteUser(request, user.email);
	},
});

function fleetApi(request: APIRequestContext, apiKey: string) {
	const headers = { authorization: `Bearer ${apiKey}` };
	return {
		get: () => request.get("/api/fleet", { headers }),
		put: (data: unknown) => request.put("/api/fleet", { headers, data }),
	};
}

test("requests without an API key are rejected", async ({ request }) => {
	const response = await request.get("/api/fleet");

	expect(response.status()).toBe(401);
	expect(await response.json()).toEqual({
		error: "Missing or invalid API key",
	});
});

test("requests with an unknown API key are rejected", async ({ request }) => {
	const response = await request.put("/api/fleet", {
		headers: { authorization: "Bearer bb_not-a-real-key" },
		data: { bikes: OFFICE_FLEET },
	});

	expect(response.status()).toBe(401);
});

owner("a new team starts without bikes", async ({ request, apiKey }) => {
	const response = await fleetApi(request, apiKey).get();

	expect(await response.json()).toEqual({ bikes: [] });
});

owner(
	"setting the fleet returns the bikes in order",
	async ({ request, apiKey }) => {
		const response = await fleetApi(request, apiKey).put({
			bikes: OFFICE_FLEET,
		});

		expect(response.status()).toBe(200);
		const { bikes } = await response.json();
		expect(
			bikes.map(({ name, type }: { name: string; type: string }) => ({
				name,
				type,
			})),
		).toEqual(OFFICE_FLEET);
		expect(await (await fleetApi(request, apiKey).get()).json()).toEqual({
			bikes,
		});
	},
);

owner("bikes are matched by name", async ({ request, apiKey }) => {
	const api = fleetApi(request, apiKey);
	const first = (await (await api.put({ bikes: OFFICE_FLEET })).json()).bikes;

	const { bikes } = await (
		await api.put({
			bikes: [
				{ name: "Road 1", type: "city" },
				{ name: "Tandem", type: "city" },
			],
		})
	).json();

	// Road 1 is the same bike with a new type; the rest are gone.
	expect(bikes).toEqual([
		{ id: first[0].id, name: "Road 1", type: "city" },
		{ id: expect.any(Number), name: "Tandem", type: "city" },
	]);
});

owner("an empty list removes every bike", async ({ request, apiKey }) => {
	const api = fleetApi(request, apiKey);
	await api.put({ bikes: OFFICE_FLEET });

	const response = await api.put({ bikes: [] });

	expect(await response.json()).toEqual({ bikes: [] });
});

for (const { problem, body, error } of [
	{
		problem: "an unknown bike type",
		body: { bikes: [{ name: "Daisy", type: "tandem" }] },
		error: /^bikes\.0\.type: /,
	},
	{
		problem: "duplicate names",
		body: {
			bikes: [
				{ name: "Road 1", type: "road" },
				{ name: "Road 1", type: "city" },
			],
		},
		error: "bikes: Bike names must be unique",
	},
	{
		problem: "an empty name",
		body: { bikes: [{ name: " ", type: "road" }] },
		error: /^bikes\.0\.name: /,
	},
	{ problem: "a missing bike list", body: {}, error: /^bikes: / },
]) {
	owner(`a fleet with ${problem} is rejected`, async ({ request, apiKey }) => {
		const response = await fleetApi(request, apiKey).put(body);

		expect(response.status()).toBe(400);
		expect((await response.json()).error).toMatch(error);
	});
}
