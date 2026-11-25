import { cn } from "@/lib/utils";

/** The BikeBook mark: a bike on a green tile. Same drawing as app/icon.svg. */
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 32 32"
			aria-hidden="true"
			className={cn("size-8 shrink-0", className)}
		>
			<rect width="32" height="32" rx="9" className="fill-brand-700" />
			<g
				fill="none"
				stroke="white"
				strokeWidth="2.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="9" cy="20" r="5" />
				<circle cx="23" cy="20" r="5" />
				<path d="M9 20l4.5-8.5h7.25L23 20M13.5 11.5 16.5 20l4.25-8.5M20.75 11.5l-1-2.75h2.75M11.5 8.75h4" />
			</g>
		</svg>
	);
}

/** The mark and the BikeBook wordmark. */
export function Logo({ className }: { className?: string }) {
	return (
		<span className={cn("flex items-center gap-2.5", className)}>
			<LogoMark />
			<span className="text-lg font-bold tracking-tight text-stone-900">
				BikeBook
			</span>
		</span>
	);
}
