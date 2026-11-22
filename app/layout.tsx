import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SWRConfig } from "swr";
import { CookieBanner } from "@/components/cookie-banner";
import { DemoProfileProvider } from "@/components/demo-profile-provider";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import {
	getCookieBannerDelayRangeMs,
	getDemoProfile,
} from "@/lib/demo-profile";

export const metadata: Metadata = {
	title: "ACME",
	description:
		"A demo SaaS application used throughout Endform's Playwright guides.",
};

export const viewport: Viewport = {
	maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieBannerDelayRangeMs = getCookieBannerDelayRangeMs();

	return (
		<html
			lang="en"
			className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
		>
			<body className="min-h-[100dvh] bg-gray-50">
				<DemoProfileProvider profile={getDemoProfile()}>
					<SWRConfig
						value={{
							fallback: {
								// We do NOT await here
								// Only components that read this data will suspend
								"/api/user": getUser(),
								"/api/team": getTeamForUser(),
							},
						}}
					>
						{children}
					</SWRConfig>
				</DemoProfileProvider>
				{cookieBannerDelayRangeMs && (
					<CookieBanner delayRangeMs={cookieBannerDelayRangeMs} />
				)}
			</body>
		</html>
	);
}
