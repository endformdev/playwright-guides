"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "cookie-consent";

export function CookieBanner({
	delayRangeMs,
}: {
	delayRangeMs: [number, number];
}) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (document.cookie.includes(`${CONSENT_COOKIE}=`)) return;

		const [min, max] = delayRangeMs;
		const timer = setTimeout(
			() => setVisible(true),
			min + Math.random() * (max - min),
		);
		return () => clearTimeout(timer);
	}, [delayRangeMs]);

	if (!visible) return null;

	function choose(value: "all" | "essential") {
		document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
		setVisible(false);
	}

	return (
		<div
			role="dialog"
			aria-label="Cookie consent"
			className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg"
		>
			<div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-gray-700">
					We use cookies to understand how ACME is used and to improve it.
				</p>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => choose("essential")}>
						Essential only
					</Button>
					<Button onClick={() => choose("all")}>Accept all</Button>
				</div>
			</div>
		</div>
	);
}
