import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BikesPageSkeleton() {
	return (
		<section className="flex-1 p-4 lg:p-8 space-y-8">
			<h1 className="text-lg lg:text-2xl font-medium">Bikes</h1>
			<div className="h-9" />
			<Card>
				<CardHeader>
					<CardTitle>Fleet</CardTitle>
				</CardHeader>
				<CardContent className="min-h-[200px]" />
			</Card>
		</section>
	);
}
