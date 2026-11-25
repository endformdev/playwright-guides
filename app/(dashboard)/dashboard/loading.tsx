import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default function BikesPageSkeleton() {
	return (
		<section className="space-y-6">
			<PageHeader
				title="Bikes"
				description="Book a bike from the office pool for the morning or the afternoon."
			>
				<div className="h-10 w-64 rounded-full bg-stone-200/60" />
			</PageHeader>
			<Card className="gap-0 overflow-hidden py-0">
				<div className="h-[57px] border-b border-stone-100" />
				<div className="animate-pulse space-y-3 p-5">
					{Array.from({ length: 5 }, (_, i) => (
						<div key={i} className="h-9 rounded-lg bg-stone-100" />
					))}
				</div>
			</Card>
		</section>
	);
}
