import { redirect } from "next/navigation";
import {
	getApiKey,
	getBookingsForDay,
	getFleet,
	getUpcomingBookings,
	isValidDate,
	today,
} from "@/lib/bikes";
import { getUser, getUserWithTeam } from "@/lib/db/queries";
import {
	BookingGrid,
	DayPicker,
	FleetApiKey,
	UpcomingBookings,
} from "./bookings";

export default async function BikesPage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	const user = await getUser();
	if (!user) redirect("/sign-in");

	const { teamId, teamRole } = await getUserWithTeam(user.id);
	if (!teamId) redirect("/dashboard/team");
	const isOwner = teamRole === "owner";

	const { date: requestedDate } = await searchParams;
	const date =
		requestedDate && isValidDate(requestedDate) ? requestedDate : today();

	const [fleet, dayBookings, upcoming, apiKey] = await Promise.all([
		getFleet(teamId),
		getBookingsForDay(teamId, date),
		getUpcomingBookings(user.id, today()),
		isOwner ? getApiKey(teamId) : null,
	]);

	return (
		<section className="flex-1 p-4 lg:p-8 space-y-8">
			<h1 className="text-lg lg:text-2xl font-medium">Bikes</h1>
			<DayPicker date={date} today={today()} />
			<BookingGrid
				key={date}
				bikes={fleet}
				bookings={dayBookings}
				date={date}
				isPast={date < today()}
				currentUserId={user.id}
				isOwner={isOwner}
			/>
			<UpcomingBookings bookings={upcoming} />
			{isOwner && <FleetApiKey apiKey={apiKey} />}
		</section>
	);
}
