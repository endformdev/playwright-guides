"use client";

import { Activity, Bike, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ href: "/dashboard", icon: Bike, label: "Bikes" },
	{ href: "/dashboard/team", icon: Users, label: "Team" },
	{ href: "/dashboard/general", icon: Settings, label: "General" },
	{ href: "/dashboard/activity", icon: Activity, label: "Activity" },
	{ href: "/dashboard/security", icon: Shield, label: "Security" },
];

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
			{/* One nav: a scrolling tab bar on small screens, a sidebar on large. */}
			<nav
				aria-label="Dashboard"
				className="flex shrink-0 gap-1 overflow-x-auto border-b border-stone-200 bg-white px-4 py-2 lg:sticky lg:top-24 lg:w-52 lg:flex-col lg:self-start lg:border-0 lg:bg-transparent lg:p-0"
			>
				{NAV_ITEMS.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-brand-50 text-brand-800 lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-stone-200"
									: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
							)}
						>
							<item.icon
								className={cn(
									"size-4",
									isActive ? "text-brand-700" : "text-stone-400",
								)}
							/>
							{item.label}
						</Link>
					);
				})}
			</nav>

			<main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
				{children}
			</main>
		</div>
	);
}
