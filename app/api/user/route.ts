import { getUser } from "@/lib/db/queries";

export async function GET() {
	const user = await getUser();
	if (!user) return Response.json(null);

	const { passwordHash: _, ...publicUser } = user;
	return Response.json(publicUser);
}
