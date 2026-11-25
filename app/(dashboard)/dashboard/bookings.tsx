"use client";

import { ChevronLeft, ChevronRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/auth/middleware";
import {
	addDays,
	BIKE_TYPE_LABELS,
	BOOKING_SLOTS,
	type BikeType,
	type BookingSlot,
	formatDay,
	SLOT_LABELS,
} from "@/lib/bike-format";
import type { DayBooking } from "@/lib/bikes";
import { bookBike, cancelBooking, regenerateFleetApiKey } from "./actions";

const bikesUrl = (date: string) => `/dashboard?date=${date}`;

export function DayPicker({ date, today }: { date: string; today: string }) {
	const router = useRouter();
	// The date input only works once React is running, so keep it disabled
	// until then. Otherwise a date picked before hydration is silently lost.
	const [isHydrated, setIsHydrated] = useState(false);
	useEffect(() => setIsHydrated(true), []);

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button asChild variant="outline" size="icon">
				<Link href={bikesUrl(addDays(date, -1))} aria-label="Previous day">
					<ChevronLeft />
				</Link>
			</Button>
			<Label htmlFor="booking-date" className="sr-only">
				Date
			</Label>
			<Input
				id="booking-date"
				type="date"
				value={date}
				disabled={!isHydrated}
				onChange={(event) => {
					if (event.target.value) router.push(bikesUrl(event.target.value));
				}}
				className="w-auto"
			/>
			<Button asChild variant="outline" size="icon">
				<Link href={bikesUrl(addDays(date, 1))} aria-label="Next day">
					<ChevronRight />
				</Link>
			</Button>
			{date !== today && (
				<Button asChild variant="ghost">
					<Link href={bikesUrl(today)}>Today</Link>
				</Button>
			)}
		</div>
	);
}

function ActionMessage({ state }: { state: ActionState }) {
	if (state.error) {
		return (
			<p role="alert" className="text-red-500">
				{state.error}
			</p>
		);
	}
	if (state.success) {
		return (
			<p role="status" className="text-green-600">
				{state.success}
			</p>
		);
	}
	return null;
}

type BookingGridProps = {
	bikes: { id: number; name: string; type: BikeType }[];
	bookings: DayBooking[];
	date: string;
	isPast: boolean;
	currentUserId: number;
	isOwner: boolean;
};

export function BookingGrid({
	bikes,
	bookings,
	date,
	isPast,
	currentUserId,
	isOwner,
}: BookingGridProps) {
	// One state for both actions, so only the latest result is shown.
	const [state, action, isPending] = useActionState<ActionState, FormData>(
		(previous, formData) =>
			formData.has("bookingId")
				? cancelBooking(previous, formData)
				: bookBike(previous, formData),
		{},
	);

	const bookingFor = (bikeId: number, slot: BookingSlot) =>
		bookings.find(
			(booking) => booking.bikeId === bikeId && booking.slot === slot,
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{formatDay(date)}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Above the table, so it's in view without scrolling. */}
				<ActionMessage state={isPending ? {} : state} />
				{bikes.length === 0 ? (
					<div className="py-8 text-center space-y-1">
						<p className="font-medium">Your office has no bikes yet.</p>
						<p className="text-sm text-muted-foreground">
							{isOwner
								? "Add your bikes with the Fleet API, using the API key below."
								: "Ask a team owner to set up the fleet."}
						</p>
					</div>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-muted-foreground">
								<th className="py-2 font-medium">Bike</th>
								<th className="py-2 font-medium">Type</th>
								{BOOKING_SLOTS.map((slot) => (
									<th key={slot} className="py-2 font-medium">
										{SLOT_LABELS[slot]}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{bikes.map((bike) => (
								<tr key={bike.id} className="border-t">
									<th scope="row" className="py-3 pr-4 text-left font-medium">
										{bike.name}
									</th>
									<td className="py-3 pr-4 text-muted-foreground">
										{BIKE_TYPE_LABELS[bike.type]}
									</td>
									{BOOKING_SLOTS.map((slot) => {
										const booking = bookingFor(bike.id, slot);
										const slotName = `${bike.name} ${SLOT_LABELS[slot].toLowerCase()}`;

										if (booking) {
											const isMine = booking.userId === currentUserId;
											return (
												<td key={slot} className="py-3 pr-4">
													<div className="flex items-center gap-2">
														<span>
															{isMine
																? "Booked by you"
																: `Booked by ${booking.userName || booking.userEmail}`}
														</span>
														{(isMine || isOwner) && !isPast && (
															<form action={action}>
																<input
																	type="hidden"
																	name="bookingId"
																	value={booking.id}
																/>
																<Button
																	type="submit"
																	variant="ghost"
																	size="sm"
																	disabled={isPending}
																	aria-label={`Cancel ${slotName}`}
																>
																	Cancel
																</Button>
															</form>
														)}
													</div>
												</td>
											);
										}

										return (
											<td key={slot} className="py-3 pr-4">
												{isPast ? (
													<span className="text-muted-foreground">—</span>
												) : (
													<form action={action}>
														<input
															type="hidden"
															name="bikeId"
															value={bike.id}
														/>
														<input type="hidden" name="date" value={date} />
														<input type="hidden" name="slot" value={slot} />
														<Button
															type="submit"
															variant="outline"
															size="sm"
															disabled={isPending}
															aria-label={`Book ${slotName}`}
														>
															Book
														</Button>
													</form>
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</CardContent>
		</Card>
	);
}

type UpcomingBooking = {
	id: number;
	date: string;
	slot: BookingSlot;
	bikeName: string;
	bikeType: BikeType;
};

export function UpcomingBookings({
	bookings,
}: {
	bookings: UpcomingBooking[];
}) {
	const [cancelState, cancelAction, isCancelling] = useActionState<
		ActionState,
		FormData
	>(cancelBooking, {});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your upcoming bookings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{bookings.length === 0 ? (
					<p className="text-muted-foreground">No upcoming bookings.</p>
				) : (
					<ul aria-label="Your upcoming bookings" className="divide-y">
						{bookings.map((booking) => {
							const name = `${booking.bikeName}, ${formatDay(booking.date)}, ${SLOT_LABELS[booking.slot].toLowerCase()}`;
							return (
								<li
									key={booking.id}
									className="flex items-center justify-between py-2"
								>
									<Link
										href={bikesUrl(booking.date)}
										className="hover:underline"
									>
										{name}
									</Link>
									<form action={cancelAction}>
										<input type="hidden" name="bookingId" value={booking.id} />
										<Button
											type="submit"
											variant="outline"
											size="sm"
											disabled={isCancelling}
											aria-label={`Cancel ${name}`}
										>
											Cancel
										</Button>
									</form>
								</li>
							);
						})}
					</ul>
				)}
				<ActionMessage state={isCancelling ? {} : cancelState} />
			</CardContent>
		</Card>
	);
}

export function FleetApiKey({ apiKey }: { apiKey: string | null }) {
	const [state, action, isPending] = useActionState<ActionState, FormData>(
		regenerateFleetApiKey,
		{},
	);
	const [origin, setOrigin] = useState("");
	useEffect(() => setOrigin(window.location.origin), []);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Fleet API</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Add, rename and remove bikes from your own tools. Send the list of
					bikes you want, and the fleet is updated to match it.
				</p>
				<div>
					<Label htmlFor="fleet-api-key" className="mb-2">
						API key
					</Label>
					<Input
						id="fleet-api-key"
						readOnly
						value={apiKey ?? ""}
						placeholder="No API key yet"
						className="font-mono"
					/>
				</div>
				<pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">
					{`curl -X PUT ${origin}/api/fleet \\
  -H "Authorization: Bearer ${apiKey ?? "<api key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"bikes": [{"name": "Road 1", "type": "road"}]}'`}
				</pre>
				<p className="text-sm text-muted-foreground">
					Bike types are <code>road</code>, <code>city</code>,{" "}
					<code>e-city</code> and <code>cargo</code>.
				</p>
				<form action={action}>
					<Button type="submit" variant="outline" disabled={isPending}>
						<KeyRound />
						{apiKey ? "Generate a new key" : "Generate a key"}
					</Button>
				</form>
				<ActionMessage state={isPending ? {} : state} />
			</CardContent>
		</Card>
	);
}
