import { devices } from "@playwright/test";
import {
	defineConfig,
	type IntentOptions,
	type IntentUseOptions,
} from "playwright-intent";
import { allow, fileStore, refuse } from "playwright-intent/file-store";

export const baseURL =
	process.env.BASE_URL || "https://endform-playwright-guides.vercel.app";

// Preview deployments on Vercel are protected. CI exports a bypass token so
// the tests can reach them.
const extraHTTPHeaders: Record<string, string> = process.env.VERCEL_BYPASS_TOKEN
	? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_TOKEN }
	: {};

const intent = {
	model: "openai/gpt-6-luna",
	store: fileStore({ updates: { local: allow(), ci: refuse() } }),
} satisfies IntentOptions;

export default defineConfig<IntentUseOptions>({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [["list"], ["html"], ["playwright-intent/reporter", intent]],
	use: {
		baseURL,
		extraHTTPHeaders,
		trace: "retain-on-failure",
		intent,
		...devices["Desktop Chrome"],
	},
});
