import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkoutAction } from "@/lib/payments/actions";
import { SubmitButton } from "./submit-button";

const PLANS = [
	{
		name: "Base",
		price: 800, // $8.00 in cents
		interval: "month",
		trialDays: 7,
		features: ["Unlimited bookings", "Unlimited team members", "Email support"],
	},
	{
		name: "Plus",
		price: 1200, // $12.00 in cents
		interval: "month",
		trialDays: 7,
		features: [
			"Everything in Base, and:",
			"Early access to new features",
			"24/7 support + Slack access",
		],
	},
];

export default function PricingPage() {
	return (
		<main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="mb-12 text-center">
				<h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
					Choose Your Plan
				</h1>
				<p className="mt-4 text-lg text-stone-600">
					Simple pricing for offices of all sizes
				</p>
				<div className="mx-auto mt-6 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
					<p className="text-sm text-amber-900">
						<strong>Demo Payment System:</strong> This uses a dummy payment
						processor for demonstration purposes only.
					</p>
				</div>
			</div>

			<div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
				{PLANS.map((plan, index) => (
					<PricingCard
						key={plan.name}
						name={plan.name}
						price={plan.price}
						interval={plan.interval}
						trialDays={plan.trialDays}
						features={plan.features}
						isFeatured={index === PLANS.length - 1}
					/>
				))}
			</div>
		</main>
	);
}

function PricingCard({
	name,
	price,
	interval,
	trialDays,
	features,
	isFeatured,
}: {
	name: string;
	price: number;
	interval: string;
	trialDays: number;
	features: string[];
	isFeatured: boolean;
}) {
	return (
		<div
			className={cn(
				"relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm",
				isFeatured
					? "border-brand-300 ring-1 ring-brand-300"
					: "border-stone-200",
			)}
		>
			{isFeatured && (
				<p className="absolute -top-3 left-8 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white">
					Most popular
				</p>
			)}
			<h2 className="text-xl font-bold text-stone-900">{name}</h2>
			<p className="mt-1 text-sm text-stone-500">
				with {trialDays} day free trial
			</p>
			<p className="mt-6 text-5xl font-extrabold tracking-tight text-stone-900">
				${price / 100}{" "}
				<span className="text-base font-medium tracking-normal text-stone-500">
					per user / {interval}
				</span>
			</p>
			<ul className="mt-8 mb-8 flex-1 space-y-3">
				{features.map((feature) => (
					<li key={feature} className="flex items-start gap-3">
						<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100">
							<Check className="size-3.5 text-brand-700" />
						</span>
						<span className="text-stone-700">{feature}</span>
					</li>
				))}
			</ul>
			<form action={checkoutAction}>
				<input type="hidden" name="planName" value={name} />
				<input type="hidden" name="amount" value={price} />
				<SubmitButton isFeatured={isFeatured} />
			</form>
		</div>
	);
}
