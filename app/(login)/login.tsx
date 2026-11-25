"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/auth/middleware";
import { signIn, signUp } from "./actions";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect");
	const plan = searchParams.get("plan");
	const amount = searchParams.get("amount");
	const inviteId = searchParams.get("inviteId");
	const [state, formAction, pending] = useActionState<ActionState, FormData>(
		mode === "signin" ? signIn : signUp,
		{ error: "" },
	);

	return (
		<div className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
			<div className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-100/70 to-transparent" />
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<Link href="/" className="mx-auto flex w-fit rounded-xl">
					<LogoMark className="size-12" />
					<span className="sr-only">BikeBook home</span>
				</Link>
				<h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-stone-900">
					{mode === "signin"
						? "Sign in to your account"
						: "Create your account"}
				</h2>
				<p className="mt-2 text-center text-sm text-stone-500">
					{mode === "signin"
						? "Welcome back. Your bikes are waiting."
						: "Start booking your office's bikes in a minute."}
				</p>
			</div>

			<div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-8 shadow-sm sm:mx-auto sm:w-full sm:max-w-md sm:px-8">
				<form className="space-y-5" action={formAction}>
					<input type="hidden" name="redirect" value={redirect || ""} />
					<input type="hidden" name="plan" value={plan || ""} />
					<input type="hidden" name="amount" value={amount || ""} />
					<input type="hidden" name="inviteId" value={inviteId || ""} />
					<div>
						<Label
							htmlFor="email"
							className="block text-sm font-medium text-stone-700"
						>
							Email
						</Label>
						<div className="mt-1">
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								defaultValue={state.email}
								required
								maxLength={50}
								className="h-10"
								placeholder="Enter your email"
							/>
						</div>
					</div>

					<div>
						<Label
							htmlFor="password"
							className="block text-sm font-medium text-stone-700"
						>
							Password
						</Label>
						<div className="mt-1">
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete={
									mode === "signin" ? "current-password" : "new-password"
								}
								defaultValue={state.password}
								required
								minLength={8}
								maxLength={100}
								className="h-10"
								placeholder="Enter your password"
							/>
						</div>
					</div>

					{state?.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
							{state.error}
						</div>
					)}

					<div>
						<Button type="submit" className="h-10 w-full" disabled={pending}>
							{pending ? (
								<>
									<Loader2 className="animate-spin mr-2 h-4 w-4" />
									Loading...
								</>
							) : mode === "signin" ? (
								"Sign in"
							) : (
								"Sign up"
							)}
						</Button>
					</div>
				</form>

				<div className="mt-6">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-stone-200" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-white px-2 text-stone-500">
								{mode === "signin"
									? "New to our platform?"
									: "Already have an account?"}
							</span>
						</div>
					</div>

					<div className="mt-6">
						<Link
							href={`${mode === "signin" ? "/sign-up" : "/sign-in"}${
								redirect ? `?redirect=${redirect}` : ""
							}${plan ? `&plan=${plan}` : ""}${amount ? `&amount=${amount}` : ""}`}
							className="flex h-10 w-full items-center justify-center rounded-md border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
						>
							{mode === "signin"
								? "Create an account"
								: "Sign in to existing account"}
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
