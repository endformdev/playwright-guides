import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./support/global-setup";

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./support/global-setup.ts",
	globalTeardown: "./support/global-teardown.ts",
	// Every test can run at the same time as any other.
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: "html",
	use: {
		baseURL:
			process.env.BASE_URL ||
			"https://endform-playwright-guides-slow.vercel.app",
		// Tests that only read data share one signed-in user.
		storageState: STORAGE_STATE,
		trace: "retain-on-failure",
		...devices["Desktop Chrome"],
	},
});
