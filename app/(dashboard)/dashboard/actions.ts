"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/auth/activity";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import {
	describeBooking,
	getBike,
	getBooking,
	isUniqueViolation,
	isValidDate,
	regenerateApiKey,
	today,
} from "@/lib/bikes";
import { db } from "@/lib/db/drizzle";
import { getUserWithTeam } from "@/lib/db/queries";
import { ActivityType, BOOKING_SLOTS, bookings } from "@/lib/db/schema";
import { simulateLatency } from "@/lib/demo-profile";

const BIKES_PATH = "/dashboard";

const bookBikeSchema = z.object({
	bikeId: z.coerce.number().int(),
	date: z.string().refine(isValidDate, "Pick a valid date"),
	slot: z.enum(BOOKING_SLOTS),
});

export const bookBike = validatedActionWithUser(
	bookBikeSchema,
	async ({ bikeId, date, slot }, _, user) => {
		const { teamId } = await getUserWithTeam(user.id);
		if (!teamId) return { error: "You're not part of a team" };

		const bike = await getBike(teamId, bikeId);
		if (!bike) return { error: "That bike isn't in your fleet" };
		if (date < today()) return { error: "You can't book a bike in the past" };

		const description = describeBooking(bike, date, slot);
		await simulateLatency("booking");

		try {
			await db
				.insert(bookings)
				.values({ teamId, bikeId, userId: user.id, date, slot });
		} catch (error) {
			if (!isUniqueViolation(error)) throw error;
			revalidatePath(BIKES_PATH);
			return { error: `${description} is already booked` };
		}

		await logActivity(
			teamId,
			user.id,
			ActivityType.BOOK_BIKE,
			undefined,
			description,
		);
		revalidatePath(BIKES_PATH);
		return { success: `Booked ${description}` };
	},
);

const cancelBookingSchema = z.object({
	bookingId: z.coerce.number().int(),
});

export const cancelBooking = validatedActionWithUser(
	cancelBookingSchema,
	async ({ bookingId }, _, user) => {
		const { teamId, teamRole } = await getUserWithTeam(user.id);
		if (!teamId) return { error: "You're not part of a team" };

		const booking = await getBooking(teamId, bookingId);
		if (!booking) {
			revalidatePath(BIKES_PATH);
			return { error: "That booking no longer exists" };
		}
		if (booking.userId !== user.id && teamRole !== "owner") {
			return { error: "Only team owners can cancel other people's bookings" };
		}

		await db.delete(bookings).where(eq(bookings.id, booking.id));

		const description = describeBooking(
			{ name: booking.bikeName },
			booking.date,
			booking.slot,
		);
		await logActivity(
			teamId,
			user.id,
			ActivityType.CANCEL_BOOKING,
			undefined,
			description,
		);
		revalidatePath(BIKES_PATH);
		return { success: `Cancelled ${description}` };
	},
);

export const regenerateFleetApiKey = validatedActionWithUser(
	z.object({}),
	async (_data, _, user) => {
		const { teamId, teamRole } = await getUserWithTeam(user.id);
		if (!teamId || teamRole !== "owner") {
			return { error: "Only team owners can manage the API key" };
		}

		await regenerateApiKey(teamId);
		revalidatePath(BIKES_PATH);
		return { success: "Generated a new API key. The old one no longer works." };
	},
);
