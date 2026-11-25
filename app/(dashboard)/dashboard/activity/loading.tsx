import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityPageSkeleton() {
	return (
		<section>
			<PageHeader
				title="Activity Log"
				description="Your sign-ins, bookings and account changes."
			/>
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent className="min-h-[88px]" />
			</Card>
		</section>
	);
}
