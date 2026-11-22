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
 * Forms render placeholder inputs while their data loads, then swap in the
 * real inputs. The placeholders are disabled so nothing typed into them is
 * lost. Under the `flaky` profile they stay editable: whatever is typed
 * before the data arrives is silently replaced, a classic hydration race.
 */
export function usePlaceholderInputsAreEditable() {
	return useContext(DemoProfileContext) === "flaky";
}
