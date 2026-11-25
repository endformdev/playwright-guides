// Bike constants and display and date helpers, shared by the server and the
// browser. Kept free of database imports so client components can use them.

export const BIKE_TYPES = ["road", "city", "e-city", "cargo"] as const;
export type BikeType = (typeof BIKE_TYPES)[number];

export const BOOKING_SLOTS = ["am", "pm"] as const;
export type BookingSlot = (typeof BOOKING_SLOTS)[number];

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
	road: "Road bike",
	city: "City bike",
	"e-city": "Electric city bike",
	cargo: "Cargo bike",
};

export const SLOT_LABELS: Record<BookingSlot, string> = {
	am: "Morning",
	pm: "Afternoon",
};

/** Today's date as YYYY-MM-DD, in UTC like every date in the app. */
export function today() {
	return new Date().toISOString().slice(0, 10);
}

export function isValidDate(date: string) {
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(date) &&
		new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
	);
}

export function addDays(date: string, days: number) {
	const day = new Date(`${date}T00:00:00Z`);
	day.setUTCDate(day.getUTCDate() + days);
	return day.toISOString().slice(0, 10);
}

/** "Thu 27 Nov" */
export function formatDay(date: string) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	}).format(new Date(`${date}T00:00:00Z`));
}

/** "Road 1, Thu 27 Nov, morning" */
export function describeBooking(
	bike: { name: string },
	date: string,
	slot: BookingSlot,
) {
	return `${bike.name}, ${formatDay(date)}, ${SLOT_LABELS[slot].toLowerCase()}`;
}
