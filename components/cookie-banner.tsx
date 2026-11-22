"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "cookie-consent";

type CookieBannerTiming = {
	usualDelayMs: [number, number];
	slowDelayMs: [number, number];
	slowRate: number;
};

export function CookieBanner({ timing }: { timing: CookieBannerTiming }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (document.cookie.includes(`${CONSENT_COOKIE}=`)) return;

		const [min, max] =
			Math.random() < timing.slowRate
				? timing.slowDelayMs
				: timing.usualDelayMs;
		const timer = setTimeout(
			() => setVisible(true),
			min + Math.random() * (max - min),
		);
		return () => clearTimeout(timer);
	}, [timing]);

	if (!visible) return null;

	function choose(value: "all" | "essential") {
		document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
		setVisible(false);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="cookie-consent-title"
				className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
			>
				<h2 id="cookie-consent-title" className="text-lg font-medium">
					We value your privacy
				</h2>
				<p className="mt-2 text-sm text-gray-700">
					We use cookies to understand how ACME is used and to improve it.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<Button variant="outline" onClick={() => choose("essential")}>
						Essential only
					</Button>
					<Button onClick={() => choose("all")}>Accept all</Button>
				</div>
			</div>
		</div>
	);
}
