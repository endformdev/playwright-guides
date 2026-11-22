import { getTeamForUser } from "@/lib/db/queries";
import { hasTransientUpstreamFailure } from "@/lib/demo-profile";

export async function GET() {
	if (hasTransientUpstreamFailure("teamApi")) {
		return Response.json(
			{ error: "Service temporarily unavailable" },
			{ status: 503 },
		);
	}

	const team = await getTeamForUser();
	return Response.json(team);
}
