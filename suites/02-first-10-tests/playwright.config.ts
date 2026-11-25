import { devices } from "@playwright/test";
import {
	defineConfig,
	type IntentOptions,
	type IntentUseOptions,
} from "playwright-intent";
import { allow, fileStore, refuse } from "playwright-intent/file-store";

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
		baseURL:
			process.env.BASE_URL || "https://endform-playwright-guides.vercel.app",
		trace: "retain-on-failure",
		intent,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
