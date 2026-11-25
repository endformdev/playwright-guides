"use client";

import { Bike, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR, { mutate } from "swr";
import { signOut } from "@/app/(login)/actions";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/db/schema";
import { fetcher } from "@/lib/fetcher";

function UserMenu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { data: user } = useSWR<User>("/api/user", fetcher);
	const router = useRouter();

	async function handleSignOut() {
		await signOut();
		mutate("/api/user");
		router.push("/");
	}

	if (!user) {
		return (
			<>
				<Link
					href="/pricing"
					className="rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
				>
					Pricing
				</Link>
				<Link
					href="/sign-in"
					className="rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
				>
					Sign in
				</Link>
				<Button asChild className="ml-1 rounded-full">
					<Link href="/sign-up">Sign Up</Link>
				</Button>
			</>
		);
	}

	return (
		<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
			<DropdownMenuTrigger
				data-testid="user-menu-trigger"
				className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				<Avatar className="size-9 cursor-pointer ring-1 ring-stone-200">
					<AvatarImage alt={user.name || ""} />
					<AvatarFallback className="bg-brand-100 font-semibold text-brand-800">
						{(user.name || user.email).charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<p className="truncate text-sm font-medium text-stone-900">
						{user.name || "Signed in as"}
					</p>
					<p className="truncate text-xs text-stone-500">{user.email}</p>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer" asChild>
					<Link
						href="/dashboard"
						className="flex w-full items-center"
						onClick={() => setIsMenuOpen(false)}
					>
						<Bike className="mr-2 h-4 w-4" />
						<span>Bikes</span>
					</Link>
				</DropdownMenuItem>
				<form action={handleSignOut} className="w-full">
					<button type="submit" className="flex w-full">
						<DropdownMenuItem className="w-full flex-1 cursor-pointer">
							<LogOut className="mr-2 h-4 w-4" />
							<span>Sign out</span>
						</DropdownMenuItem>
					</button>
				</form>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function Header() {
	return (
		<header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/85 backdrop-blur">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link href="/" className="rounded-md">
					<Logo />
				</Link>
				<div className="flex items-center gap-1">
					<Suspense fallback={<div className="h-9" />}>
						<UserMenu />
					</Suspense>
				</div>
			</div>
		</header>
	);
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section className="flex min-h-screen flex-col">
			<Header />
			{children}
		</section>
	);
}
