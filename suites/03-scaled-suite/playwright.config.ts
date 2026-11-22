import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./support/global-setup";

export const baseURL =
	process.env.BASE_URL || "https://endform-playwright-guides.vercel.app";

// Preview deployments on Vercel are protected. CI exports a bypass token so
// the tests can reach them.
const extraHTTPHeaders: Record<string, string> = process.env.VERCEL_BYPASS_TOKEN
	? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_TOKEN }
	: {};

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./support/global-setup.ts",
	globalTeardown: "./support/global-teardown.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "html",
	use: {
		baseURL,
		extraHTTPHeaders,
		trace: "retain-on-failure",
		...devices["Desktop Chrome"],
	},
	projects: [
		{
			name: "signed-out",
			testDir: "./tests/signed-out",
		},
		{
			name: "signed-in",
			testDir: "./tests/signed-in",
			use: { storageState: STORAGE_STATE },
		},
	],
});
