import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import {
	type BikeType,
	type BookingSlot,
	bikes,
	bookings,
	teams,
	users,
} from "@/lib/db/schema";

export * from "./bike-format";

// --- API keys ------------------------------------------------------------

export function generateApiKey() {
	return `bb_${randomBytes(24).toString("hex")}`;
}

/** Finds the team an `Authorization: Bearer <api key>` header belongs to. */
export async function getTeamForApiKey(request: Request) {
	const [scheme, apiKey] = (request.headers.get("authorization") ?? "").split(
		" ",
	);
	if (scheme !== "Bearer" || !apiKey) return null;

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.apiKey, apiKey))
		.limit(1);
	return team ?? null;
}

export async function getApiKey(teamId: number) {
	const [team] = await db
		.select({ apiKey: teams.apiKey })
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);
	return team?.apiKey ?? null;
}

export async function regenerateApiKey(teamId: number) {
	const apiKey = generateApiKey();
	await db
		.update(teams)
		.set({ apiKey, updatedAt: new Date() })
		.where(eq(teams.id, teamId));
	return apiKey;
}

// --- Fleet ---------------------------------------------------------------

export function getFleet(teamId: number) {
	return db
		.select({ id: bikes.id, name: bikes.name, type: bikes.type })
		.from(bikes)
		.where(eq(bikes.teamId, teamId))
		.orderBy(asc(bikes.id));
}

/**
 * Makes the team's fleet match `fleet`, matching bikes by name. Bikes that
 * keep their name keep their bookings, bikes that aren't listed are removed
 * along with their bookings, and new names are added at the end. The fleet is
 * listed in the order bikes were added.
 */
export async function syncFleet(
	teamId: number,
	fleet: { name: string; type: BikeType }[],
) {
	const existing = await db
		.select()
		.from(bikes)
		.where(eq(bikes.teamId, teamId));
	const wanted = new Map(fleet.map((bike) => [bike.name, bike]));

	const removedIds = existing
		.filter((bike) => !wanted.has(bike.name))
		.map((bike) => bike.id);
	if (removedIds.length > 0) {
		await db.delete(bookings).where(inArray(bookings.bikeId, removedIds));
		await db.delete(bikes).where(inArray(bikes.id, removedIds));
	}

	for (const bike of existing) {
		const type = wanted.get(bike.name)?.type;
		if (type && type !== bike.type) {
			await db.update(bikes).set({ type }).where(eq(bikes.id, bike.id));
		}
	}

	const existingNames = new Set(existing.map((bike) => bike.name));
	const added = fleet.filter((bike) => !existingNames.has(bike.name));
	if (added.length > 0) {
		await db.insert(bikes).values(added.map((bike) => ({ ...bike, teamId })));
	}

	return getFleet(teamId);
}

export async function addBike(
	teamId: number,
	bike: { name: string; type: BikeType },
) {
	const [created] = await db
		.insert(bikes)
		.values({ teamId, name: bike.name, type: bike.type })
		.returning({ id: bikes.id, name: bikes.name, type: bikes.type });
	return created;
}

export async function removeBike(teamId: number, bikeId: number) {
	const existing = await getBike(teamId, bikeId);
	if (!existing) return null;
	await db.delete(bookings).where(eq(bookings.bikeId, existing.id));
	await db.delete(bikes).where(eq(bikes.id, existing.id));
	return existing;
}

export async function getBike(teamId: number, bikeId: number) {
	const [bike] = await db
		.select()
		.from(bikes)
		.where(and(eq(bikes.id, bikeId), eq(bikes.teamId, teamId)))
		.limit(1);
	return bike ?? null;
}

// --- Bookings ------------------------------------------------------------

export type DayBooking = {
	id: number;
	bikeId: number;
	slot: BookingSlot;
	userId: number;
	userName: string | null;
	userEmail: string;
};

export function getBookingsForDay(teamId: number, date: string) {
	return db
		.select({
			id: bookings.id,
			bikeId: bookings.bikeId,
			slot: bookings.slot,
			userId: bookings.userId,
			userName: users.name,
			userEmail: users.email,
		})
		.from(bookings)
		.innerJoin(users, eq(bookings.userId, users.id))
		.where(and(eq(bookings.teamId, teamId), eq(bookings.date, date)));
}

export function getUpcomingBookings(userId: number, fromDate: string) {
	return db
		.select({
			id: bookings.id,
			date: bookings.date,
			slot: bookings.slot,
			bikeName: bikes.name,
			bikeType: bikes.type,
		})
		.from(bookings)
		.innerJoin(bikes, eq(bookings.bikeId, bikes.id))
		.where(and(eq(bookings.userId, userId), gte(bookings.date, fromDate)))
		.orderBy(asc(bookings.date), asc(bookings.slot), asc(bikes.name));
}

export async function getBooking(teamId: number, bookingId: number) {
	const [booking] = await db
		.select({
			id: bookings.id,
			userId: bookings.userId,
			date: bookings.date,
			slot: bookings.slot,
			bikeName: bikes.name,
		})
		.from(bookings)
		.innerJoin(bikes, eq(bookings.bikeId, bikes.id))
		.where(and(eq(bookings.id, bookingId), eq(bookings.teamId, teamId)))
		.limit(1);
	return booking ?? null;
}

/** Whether a database error is a unique constraint violation. */
export function isUniqueViolation(error: unknown) {
	for (let e: unknown = error; e; e = (e as { cause?: unknown }).cause) {
		if (String((e as Error).message ?? e).includes("UNIQUE constraint")) {
			return true;
		}
	}
	return false;
}
