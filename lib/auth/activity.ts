import { db } from "@/lib/db/drizzle";
import {
	type ActivityType,
	activityLogs,
	type NewActivityLog,
} from "@/lib/db/schema";

export async function logActivity(
	teamId: number | null | undefined,
	userId: number,
	type: ActivityType,
	ipAddress?: string,
	detail?: string,
) {
	if (teamId === null || teamId === undefined) {
		return;
	}
	const newActivity: NewActivityLog = {
		teamId,
		userId,
		action: type,
		ipAddress: ipAddress || "",
		detail,
	};
	await db.insert(activityLogs).values(newActivity);
}
