import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SWRConfig } from "swr";
import { CookieBanner } from "@/components/cookie-banner";
import { DemoProfileProvider } from "@/components/demo-profile-provider";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { getCookieBannerTiming, getDemoProfile } from "@/lib/demo-profile";

export const metadata: Metadata = {
	title: "BikeBook",
	description:
		"Book bikes from your office's bike pool. The demo app behind Endform's Playwright guides.",
};

export const viewport: Viewport = {
	maximumScale: 1,
	themeColor: "#006a42",
};

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieBannerTiming = getCookieBannerTiming();

	return (
		<html lang="en" className={manrope.variable}>
			<body className="min-h-[100dvh] font-sans">
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
				{cookieBannerTiming && <CookieBanner timing={cookieBannerTiming} />}
			</body>
		</html>
	);
}
