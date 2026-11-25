import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
	return (
		<div className="flex min-h-[100dvh] items-center justify-center">
			<div className="max-w-md space-y-6 p-4 text-center">
				<div className="flex justify-center">
					<LogoMark className="size-12" />
				</div>
				<h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
					Page Not Found
				</h1>
				<p className="text-base text-stone-500">
					This page took a wrong turn. It might have been moved, renamed, or
					never existed.
				</p>
				<Link
					href="/"
					className="mx-auto flex h-10 max-w-48 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
				>
					Back to Home
				</Link>
			</div>
		</div>
	);
}
