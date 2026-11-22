"use client";

import { createContext, useContext } from "react";

/**
 * The client side of `lib/demo-profile.ts`. See that file for what each demo
 * profile does.
 */
type DemoProfile = "clean" | "slow" | "flaky";

const DemoProfileContext = createContext<DemoProfile>("clean");

export function DemoProfileProvider({
	profile,
	children,
}: {
	profile: DemoProfile;
	children: React.ReactNode;
}) {
	return (
		<DemoProfileContext.Provider value={profile}>
			{children}
		</DemoProfileContext.Provider>
	);
}

/**
 * Under the `flaky` profile, the account form refetches the user when it
 * opens and copies the fresh details into its inputs when they arrive. When
 * that refetch is slow and finishes after someone started typing, it silently
 * overwrites what they typed, a classic race between loading data and user
 * input.
 */
export function useFormResyncsOnEveryFetch() {
	return useContext(DemoProfileContext) === "flaky";
}
