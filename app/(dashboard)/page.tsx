import {
	ArrowRight,
	Bike,
	CalendarCheck,
	Check,
	Code,
	Package,
	Plus,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const PREVIEW_ROWS = [
	{
		name: "Road 1",
		icon: Bike,
		tone: "bg-sky-50 text-sky-700",
		am: "you",
		pm: null,
	},
	{
		name: "City 2",
		icon: Bike,
		tone: "bg-amber-50 text-amber-700",
		am: null,
		pm: "Maya",
	},
	{
		name: "E-City 1",
		icon: Zap,
		tone: "bg-violet-50 text-violet-700",
		am: "Sam",
		pm: "you",
	},
	{
		name: "Cargo",
		icon: Package,
		tone: "bg-orange-50 text-orange-700",
		am: null,
		pm: null,
	},
];

function PreviewSlot({ who }: { who: string | null }) {
	if (!who) {
		return (
			<div className="flex h-8 items-center gap-1.5 rounded-md border border-dashed border-stone-300 px-2 text-xs text-stone-400">
				<Plus className="size-3" />
				Book
			</div>
		);
	}
	const isMine = who === "you";
	return (
		<div
			className={cn(
				"flex h-8 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium",
				isMine ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-700",
			)}
		>
			<span
				className={cn(
					"flex size-5 items-center justify-center rounded text-[10px] font-bold",
					isMine ? "bg-white/20" : "bg-white text-stone-600",
				)}
			>
				{isMine ? <Check className="size-3" /> : who[0]}
			</span>
			<span className="truncate">{isMine ? "You" : who}</span>
		</div>
	);
}

/** A picture of the booking grid. Decorative, so hidden from assistive tech. */
function BookingPreview() {
	return (
		<div aria-hidden="true" className="relative mx-auto w-full max-w-md">
			<div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/70 via-brand-100/40 to-transparent blur-2xl" />
			<div className="rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
				<div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
					<div className="flex items-center gap-2 text-sm font-semibold">
						Thu 27 Nov
						<span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-800">
							Today
						</span>
					</div>
					<span className="text-xs text-stone-500">
						<span className="font-semibold text-stone-900">4</span> of 8 free
					</span>
				</div>
				<div className="grid grid-cols-[1fr_1fr_1fr] gap-x-2 px-4 pt-3 pb-1 text-[10px] font-medium tracking-wide text-stone-400 uppercase">
					<span>Bike</span>
					<span>Morning</span>
					<span>Afternoon</span>
				</div>
				<div className="divide-y divide-stone-100 px-4 pb-2">
					{PREVIEW_ROWS.map((row) => (
						<div
							key={row.name}
							className="grid grid-cols-[1fr_1fr_1fr] items-center gap-x-2 py-2"
						>
							<div className="flex items-center gap-2 text-sm font-semibold">
								<span
									className={cn(
										"flex size-6 items-center justify-center rounded-md",
										row.tone,
									)}
								>
									<row.icon className="size-3.5" />
								</span>
								{row.name}
							</div>
							<PreviewSlot who={row.am} />
							<PreviewSlot who={row.pm} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	return (
		<main className="flex-1">
			<section className="relative overflow-hidden">
				<div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:px-8">
					<div className="text-center lg:text-left">
						<p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
							<Bike className="size-3.5" aria-hidden="true" />
							For offices with a shared bike pool
						</p>
						<h1 className="mt-6 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
							The office bike pool,
							<span className="block text-brand-700">
								without the spreadsheet
							</span>
						</h1>
						<p className="mx-auto mt-6 max-w-xl text-lg text-stone-600 lg:mx-0">
							BikeBook lets everyone in the office book the shared bikes for a
							morning or an afternoon, and see at a glance which ones are free.
						</p>
						<div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
							<Button
								asChild
								size="lg"
								className="h-12 rounded-full px-7 text-base"
							>
								<Link href="/sign-up">
									Start booking
									<ArrowRight className="size-5" />
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="h-12 rounded-full px-7 text-base"
							>
								<Link href="/pricing">See pricing</Link>
							</Button>
						</div>
					</div>
					<BookingPreview />
				</div>
			</section>

			<section className="border-t border-stone-200 bg-white">
				<div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
					{FEATURES.map(({ icon: Icon, title, text }) => (
						<div
							key={title}
							className="rounded-2xl border border-stone-200 bg-stone-50/60 p-6"
						>
							<div className="flex size-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
								<Icon className="size-5" />
							</div>
							<h2 className="mt-5 text-lg font-bold text-stone-900">{title}</h2>
							<p className="mt-2 text-stone-600">{text}</p>
						</div>
					))}
				</div>
			</section>

			<footer className="border-t border-stone-200 bg-white">
				<p className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-500 sm:px-6 lg:px-8">
					BikeBook is the demo app behind Endform's Playwright guides.
				</p>
			</footer>
		</main>
	);
}
