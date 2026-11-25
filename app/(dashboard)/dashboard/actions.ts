"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/auth/activity";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import {
	addBike as insertBike,
	describeBooking,
	getBike,
	getBooking,
	getFleet,
	isUniqueViolation,
	isValidDate,
	removeBike as deleteBike,
	today,
} from "@/lib/bikes";
import { db } from "@/lib/db/drizzle";
import { getUserWithTeam } from "@/lib/db/queries";
import {
	ActivityType,
	BIKE_TYPES,
	BOOKING_SLOTS,
	bookings,
} from "@/lib/db/schema";
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

const addBikeSchema = z.object({
	name: z.string().trim().min(1, "Enter a bike name").max(40),
	type: z.enum(BIKE_TYPES),
});

export const addBike = validatedActionWithUser(
	addBikeSchema,
	async ({ name, type }, _, user) => {
		const { teamId, teamRole } = await getUserWithTeam(user.id);
		if (!teamId || teamRole !== "owner") {
			return { error: "Only team owners can manage the fleet" };
		}

		const fleet = await getFleet(teamId);
		if (fleet.length >= 50) {
			return { error: "Your fleet can have at most 50 bikes" };
		}

		try {
			await insertBike(teamId, { name, type });
		} catch (error) {
			if (!isUniqueViolation(error)) throw error;
			return { error: `A bike named ${name} is already in your fleet` };
		}

		revalidatePath(BIKES_PATH);
		return { success: `Added ${name}` };
	},
);

const removeBikeSchema = z.object({
	bikeId: z.coerce.number().int(),
});

export const removeBike = validatedActionWithUser(
	removeBikeSchema,
	async ({ bikeId }, _, user) => {
		const { teamId, teamRole } = await getUserWithTeam(user.id);
		if (!teamId || teamRole !== "owner") {
			return { error: "Only team owners can manage the fleet" };
		}

		const removed = await deleteBike(teamId, bikeId);
		if (!removed) {
			revalidatePath(BIKES_PATH);
			return { error: "That bike is no longer in your fleet" };
		}

		revalidatePath(BIKES_PATH);
		return { success: `Removed ${removed.name}` };
	},
);
