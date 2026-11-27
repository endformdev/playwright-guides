import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	// Every test can run at the same time as any other.
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: "html",
	use: {
		baseURL:
			process.env.BASE_URL ||
			"https://endform-playwright-guides-slow.vercel.app",
		trace: "retain-on-failure",
		...devices["Desktop Chrome"],
	},
});
