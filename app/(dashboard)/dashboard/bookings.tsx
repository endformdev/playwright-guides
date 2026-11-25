"use client";

import {
	Bike,
	CalendarDays,
	Check,
	ChevronLeft,
	ChevronRight,
	CircleAlert,
	Copy,
	KeyRound,
	type LucideIcon,
	Package,
	Plus,
	Sun,
	Sunrise,
	X,
	Zap,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { bookBike, cancelBooking, regenerateFleetApiKey } from "./actions";

const bikesUrl = (date: string) => `/dashboard?date=${date}`;

const BIKE_TYPE_STYLES: Record<BikeType, { icon: LucideIcon; tone: string }> = {
	road: { icon: Bike, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
	city: { icon: Bike, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
	"e-city": { icon: Zap, tone: "bg-violet-50 text-violet-700 ring-violet-200" },
	cargo: {
		icon: Package,
		tone: "bg-orange-50 text-orange-700 ring-orange-200",
	},
};

const SLOT_ICONS: Record<BookingSlot, LucideIcon> = { am: Sunrise, pm: Sun };

export function DayPicker({ date, today }: { date: string; today: string }) {
	const router = useRouter();
	// The date input only works once React is running, so keep it disabled
	// until then. Otherwise a date picked before hydration is silently lost.
	const [isHydrated, setIsHydrated] = useState(false);
	useEffect(() => setIsHydrated(true), []);

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center rounded-full border border-stone-200 bg-white p-1 shadow-xs">
				<Button
					asChild
					variant="ghost"
					size="icon"
					className="size-8 rounded-full"
				>
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
					className="h-8 w-auto border-0 bg-transparent px-2 text-center font-medium shadow-none focus-visible:ring-0"
				/>
				<Button
					asChild
					variant="ghost"
					size="icon"
					className="size-8 rounded-full"
				>
					<Link href={bikesUrl(addDays(date, 1))} aria-label="Next day">
						<ChevronRight />
					</Link>
				</Button>
			</div>
			{date !== today && (
				<Button asChild variant="outline" className="rounded-full">
					<Link href={bikesUrl(today)}>Today</Link>
				</Button>
			)}
		</div>
	);
}

function ActionMessage({ state }: { state: ActionState }) {
	if (state.error) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
				<CircleAlert className="size-4 shrink-0" aria-hidden="true" />
				<p role="alert">{state.error}</p>
			</div>
		);
	}
	if (state.success) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
				<Check className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
				<p role="status">{state.success}</p>
			</div>
		);
	}
	return null;
}

function BikeTypeBadge({ type }: { type: BikeType }) {
	const { icon: Icon, tone } = BIKE_TYPE_STYLES[type];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
				tone,
			)}
		>
			<Icon className="size-3.5" aria-hidden="true" />
			{BIKE_TYPE_LABELS[type]}
		</span>
	);
}

function DayBadge({ date, today }: { date: string; today: string }) {
	if (date === today) {
		return (
			<span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
				Today
			</span>
		);
	}
	if (date < today) {
		return (
			<span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
				Past day
			</span>
		);
	}
	return null;
}

type BookingGridProps = {
	bikes: { id: number; name: string; type: BikeType }[];
	bookings: DayBooking[];
	date: string;
	today: string;
	currentUserId: number;
	isOwner: boolean;
};

export function BookingGrid({
	bikes,
	bookings,
	date,
	today,
	currentUserId,
	isOwner,
}: BookingGridProps) {
	const isPast = date < today;
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
	const totalSlots = bikes.length * BOOKING_SLOTS.length;
	const freeSlots = totalSlots - bookings.length;

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
				<div className="flex items-center gap-2.5">
					<CalendarDays className="size-5 text-stone-400" aria-hidden="true" />
					<p className="text-base font-semibold">{formatDay(date)}</p>
					<DayBadge date={date} today={today} />
				</div>
				{bikes.length > 0 &&
					(isPast ? (
						<p className="text-sm text-stone-500">Past days can't be booked.</p>
					) : (
						<p className="text-sm text-stone-500">
							<span className="font-semibold text-stone-900">{freeSlots}</span>{" "}
							of {totalSlots} slots free
						</p>
					))}
			</div>

			{/* Above the table, so it's in view without scrolling. */}
			{(state.error || state.success) && !isPending && (
				<div className="px-5 pt-4">
					<ActionMessage state={state} />
				</div>
			)}

			{bikes.length === 0 ? (
				<div className="flex flex-col items-center px-5 py-14 text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
						<Bike className="size-6" aria-hidden="true" />
					</div>
					<p className="font-semibold">Your office has no bikes yet.</p>
					<p className="mt-1 max-w-sm text-sm text-stone-500">
						{isOwner
							? "Add your bikes with the Fleet API, using the API key below."
							: "Ask a team owner to set up the fleet."}
					</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					{/* Fixed columns, so a long name is cut short instead of widening its slot. */}
					<table className="w-full table-fixed text-sm">
						<thead>
							<tr className="text-left text-xs font-medium tracking-wide text-stone-500 uppercase">
								<th className="w-28 px-5 py-3 font-medium sm:w-32">Bike</th>
								<th className="hidden w-44 px-3 py-3 font-medium sm:table-cell">
									Type
								</th>
								{BOOKING_SLOTS.map((slot) => {
									const Icon = SLOT_ICONS[slot];
									return (
										<th key={slot} className="px-3 py-3 font-medium">
											<span className="inline-flex items-center gap-1.5">
												<Icon className="size-3.5" aria-hidden="true" />
												{SLOT_LABELS[slot]}
											</span>
										</th>
									);
								})}
							</tr>
						</thead>
						<tbody>
							{bikes.map((bike) => (
								<tr
									key={bike.id}
									className="border-t border-stone-100 transition-colors hover:bg-stone-50/60"
								>
									<th
										scope="row"
										className="px-5 py-3 text-left font-semibold whitespace-nowrap text-stone-900"
									>
										{bike.name}
									</th>
									<td className="hidden px-3 py-3 sm:table-cell">
										<BikeTypeBadge type={bike.type} />
									</td>
									{BOOKING_SLOTS.map((slot) => (
										<td key={slot} className="px-3 py-2.5 pr-5">
											<SlotCell
												bikeId={bike.id}
												slot={slot}
												slotName={`${bike.name} ${SLOT_LABELS[slot].toLowerCase()}`}
												date={date}
												booking={bookingFor(bike.id, slot)}
												isPast={isPast}
												isPending={isPending}
												currentUserId={currentUserId}
												isOwner={isOwner}
												action={action}
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
}

function SlotCell({
	bikeId,
	slot,
	slotName,
	date,
	booking,
	isPast,
	isPending,
	currentUserId,
	isOwner,
	action,
}: {
	bikeId: number;
	slot: BookingSlot;
	slotName: string;
	date: string;
	booking: DayBooking | undefined;
	isPast: boolean;
	isPending: boolean;
	currentUserId: number;
	isOwner: boolean;
	action: (formData: FormData) => void;
}) {
	if (booking) {
		const isMine = booking.userId === currentUserId;
		const bookedBy = booking.userName || booking.userEmail;
		return (
			<div
				className={cn(
					"flex h-9 min-w-0 items-center gap-2 rounded-lg pr-1 pl-1.5 text-sm",
					isMine
						? "bg-brand-700 text-white"
						: "bg-stone-100 text-stone-700 ring-1 ring-stone-200 ring-inset",
				)}
			>
				<span
					aria-hidden="true"
					className={cn(
						"flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
						isMine ? "bg-white/20" : "bg-white text-stone-600",
					)}
				>
					{isMine ? <Check className="size-3.5" /> : bookedBy[0].toUpperCase()}
				</span>
				<span className="min-w-0 flex-1 truncate font-medium" title={bookedBy}>
					{isMine ? "Booked by you" : `Booked by ${bookedBy}`}
				</span>
				{(isMine || isOwner) && !isPast && (
					<form action={action} className="shrink-0">
						<input type="hidden" name="bookingId" value={booking.id} />
						<Button
							type="submit"
							variant="ghost"
							size="icon"
							disabled={isPending}
							aria-label={`Cancel ${slotName}`}
							title="Cancel booking"
							className={cn(
								"size-7 rounded-md",
								isMine
									? "text-white/80 hover:bg-white/15 hover:text-white"
									: "text-stone-500 hover:bg-white hover:text-stone-900",
							)}
						>
							<X />
						</Button>
					</form>
				)}
			</div>
		);
	}

	if (isPast) {
		return <span className="flex h-9 items-center px-2 text-stone-300">—</span>;
	}

	return (
		<form action={action}>
			<input type="hidden" name="bikeId" value={bikeId} />
			<input type="hidden" name="date" value={date} />
			<input type="hidden" name="slot" value={slot} />
			<Button
				type="submit"
				variant="outline"
				disabled={isPending}
				aria-label={`Book ${slotName}`}
				className="h-9 w-full justify-start rounded-lg border-dashed border-stone-300 bg-transparent text-stone-500 shadow-none hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
			>
				<Plus />
				Book
			</Button>
		</form>
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
		<Card className="gap-4">
			<CardHeader>
				<CardTitle>Your upcoming bookings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{bookings.length === 0 ? (
					<p className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">
						No upcoming bookings.
					</p>
				) : (
					<ul
						aria-label="Your upcoming bookings"
						className="grid gap-2 sm:grid-cols-2"
					>
						{bookings.map((booking) => {
							const day = formatDay(booking.date);
							const slot = SLOT_LABELS[booking.slot].toLowerCase();
							const name = `${booking.bikeName}, ${day}, ${slot}`;
							const { icon: Icon, tone } = BIKE_TYPE_STYLES[booking.bikeType];
							return (
								<li
									key={booking.id}
									className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5 pr-2 transition-colors hover:border-stone-300"
								>
									<span
										aria-hidden="true"
										className={cn(
											"flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
											tone,
										)}
									>
										<Icon className="size-5" />
									</span>
									<Link
										href={bikesUrl(booking.date)}
										aria-label={name}
										className="min-w-0 flex-1 rounded-sm"
									>
										<span className="block truncate font-semibold text-stone-900 group-hover:text-brand-800">
											{booking.bikeName}
											{/* Keeps the item's text "Road 1, Thu 27 Nov, morning". */}
											<span className="sr-only">, </span>
										</span>
										<span className="block truncate text-sm text-stone-500">
											{day}, {slot}
										</span>
									</Link>
									<form action={cancelAction}>
										<input type="hidden" name="bookingId" value={booking.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											disabled={isCancelling}
											aria-label={`Cancel ${name}`}
											title="Cancel booking"
											className="size-8 text-stone-400 hover:text-stone-900"
										>
											<X />
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
	const [isCopied, setIsCopied] = useState(false);
	useEffect(() => setOrigin(window.location.origin), []);

	async function copyKey() {
		if (!apiKey) return;
		await navigator.clipboard.writeText(apiKey);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 1500);
	}

	return (
		<Card className="gap-4">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="size-4 text-stone-400" aria-hidden="true" />
					Fleet API
				</CardTitle>
				<p className="text-sm text-stone-500">
					Add, rename and remove bikes from your own tools. Send the list of
					bikes you want, and the fleet is updated to match it.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor="fleet-api-key" className="mb-2">
						API key
					</Label>
					<div className="flex gap-2">
						<Input
							id="fleet-api-key"
							readOnly
							value={apiKey ?? ""}
							placeholder="No API key yet"
							className="bg-stone-50 font-mono text-xs"
						/>
						{apiKey && (
							<Button
								type="button"
								variant="outline"
								onClick={copyKey}
								className="shrink-0"
							>
								{isCopied ? <Check /> : <Copy />}
								{isCopied ? "Copied" : "Copy"}
							</Button>
						)}
					</div>
				</div>
				<pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 font-mono text-xs leading-relaxed text-stone-100">
					{`curl -X PUT ${origin}/api/fleet \\
  -H "Authorization: Bearer ${apiKey ?? "<api key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"bikes": [{"name": "Road 1", "type": "road"}]}'`}
				</pre>
				<p className="text-sm text-stone-500">
					Bike types are <Code>road</Code>, <Code>city</Code>,{" "}
					<Code>e-city</Code> and <Code>cargo</Code>.
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<form action={action}>
						<Button type="submit" variant="outline" disabled={isPending}>
							<KeyRound />
							{apiKey ? "Generate a new key" : "Generate a key"}
						</Button>
					</form>
					<ActionMessage state={isPending ? {} : state} />
				</div>
			</CardContent>
		</Card>
	);
}

function Code({ children }: { children: React.ReactNode }) {
	return (
		<code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-800">
			{children}
		</code>
	);
}
