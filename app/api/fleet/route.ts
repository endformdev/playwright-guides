import { z } from "zod";
import { getFleet, getTeamForApiKey, syncFleet } from "@/lib/bikes";
import { BIKE_TYPES } from "@/lib/db/schema";

/**
 * The Fleet API. Every request is authenticated with the team's API key:
 *
 *   Authorization: Bearer <api key>
 *
 * - `GET /api/fleet` returns the team's bikes.
 * - `PUT /api/fleet` with `{ "bikes": [{ "name": "Road 1", "type": "road" }] }`
 *   makes the fleet match the list. Bikes are matched by name: listed bikes
 *   keep their bookings, and bikes that aren't listed are removed along with
 *   theirs.
 */

const fleetSchema = z.object({
	bikes: z
		.array(
			z.object({
				name: z.string().trim().min(1).max(40),
				type: z.enum(BIKE_TYPES),
			}),
		)
		.max(50)
		.refine(
			(bikes) => new Set(bikes.map((bike) => bike.name)).size === bikes.length,
			"Bike names must be unique",
		),
});

function unauthorized() {
	return Response.json(
		{ error: "Missing or invalid API key" },
		{ status: 401 },
	);
}

export async function GET(request: Request) {
	const team = await getTeamForApiKey(request);
	if (!team) return unauthorized();

	return Response.json({ bikes: await getFleet(team.id) });
}

export async function PUT(request: Request) {
	const team = await getTeamForApiKey(request);
	if (!team) return unauthorized();

	const body = await request.json().catch(() => undefined);
	if (body === undefined) {
		return Response.json({ error: "Expected a JSON body" }, { status: 400 });
	}
	const result = fleetSchema.safeParse(body);
	if (!result.success) {
		const issue = result.error.issues[0];
		const path = issue.path.join(".");
		return Response.json(
			{ error: path ? `${path}: ${issue.message}` : issue.message },
			{ status: 400 },
		);
	}

	return Response.json({ bikes: await syncFleet(team.id, result.data.bikes) });
}
