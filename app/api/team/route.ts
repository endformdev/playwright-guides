import { connection } from "next/server";
import { getTeamForUser } from "@/lib/db/queries";
import { hasTransientUpstreamFailure } from "@/lib/demo-profile";

export async function GET() {
	await connection();
	if (hasTransientUpstreamFailure("teamApi")) {
		return Response.json(
			{ error: "Service temporarily unavailable" },
			{ status: 503 },
		);
	}

	const team = await getTeamForUser();
	return Response.json(team);
}
