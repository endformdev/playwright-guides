import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 60_000,
	// Tests in a file run one after another.
	fullyParallel: false,
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
