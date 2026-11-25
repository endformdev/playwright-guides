import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
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
		<section className="space-y-6">
			<PageHeader
				title="Bikes"
				description="Book a bike from the office pool for the morning or the afternoon."
			>
				<DayPicker date={date} today={today()} />
			</PageHeader>
			<BookingGrid
				key={date}
				bikes={fleet}
				bookings={dayBookings}
				date={date}
				today={today()}
				currentUserId={user.id}
				isOwner={isOwner}
			/>
			<UpcomingBookings bookings={upcoming} />
			{isOwner && <FleetApiKey apiKey={apiKey} />}
		</section>
	);
}
