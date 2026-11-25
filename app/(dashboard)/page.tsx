import { ArrowRight, CalendarCheck, Code, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
	{
		icon: CalendarCheck,
		title: "Book in two clicks",
		text: "Pick a day, pick a bike, and it's yours for the morning or the afternoon. Nobody can book it from under you.",
	},
	{
		icon: Users,
		title: "Built for the whole office",
		text: "Invite your coworkers, see who has which bike, and let team owners sort out the odd clash.",
	},
	{
		icon: Code,
		title: "A fleet that manages itself",
		text: "Keep your bikes in sync from your own tools with the Fleet API. Road, city, electric or cargo.",
	},
];

export default function HomePage() {
	return (
		<main>
			<section className="py-20">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
						The office bike pool,
						<span className="block text-orange-500">
							without the spreadsheet
						</span>
					</h1>
					<p className="mt-5 text-lg text-gray-500 sm:text-xl">
						BikeBook lets everyone in the office book the shared bikes for a
						morning or an afternoon, and see at a glance which ones are free.
					</p>
					<div className="mt-8 flex justify-center gap-4">
						<Button asChild size="lg" className="text-lg rounded-full">
							<Link href="/sign-up">
								Start booking
								<ArrowRight className="ml-2 h-5 w-5" />
							</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="text-lg rounded-full"
						>
							<Link href="/pricing">See pricing</Link>
						</Button>
					</div>
				</div>
			</section>

			<section className="py-16 bg-white w-full">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-3 lg:gap-8">
					{FEATURES.map(({ icon: Icon, title, text }) => (
						<div key={title} className="mt-10 lg:mt-0">
							<div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
								<Icon className="h-6 w-6" />
							</div>
							<h2 className="mt-5 text-lg font-medium text-gray-900">
								{title}
							</h2>
							<p className="mt-2 text-base text-gray-500">{text}</p>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
