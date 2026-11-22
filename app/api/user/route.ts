import { getUser } from "@/lib/db/queries";
import { simulateSlowUserRead } from "@/lib/demo-profile";

export async function GET() {
	await simulateSlowUserRead();

	const user = await getUser();
	if (!user) return Response.json(null);

	const { passwordHash: _, ...publicUser } = user;
	return Response.json(publicUser);
}
