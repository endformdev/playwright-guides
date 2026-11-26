import { expect, test } from "../../support/fixtures";

test("the current user is empty when signed out", async ({ request }) => {
	const response = await request.get("/api/user");

	expect(response.ok()).toBe(true);
	expect(await response.json()).toBeNull();
});

test("payments require signing in", async ({ request }) => {
	const response = await request.get("/api/payment");

	expect(response.status()).toBe(401);
});

test("the internal user API requires its token", async ({ request }) => {
	const response = await request.post("/api/internal/user", {
		data: { email: "someone@example.com", password: "testpassword123" },
	});

	expect(response.status()).toBe(401);
});

test("unknown pages show a not found page", async ({ page }) => {
	const response = await page.goto("/this-page-does-not-exist");

	expect(response?.status()).toBe(404);
	await expect(
		page.getByRole("heading", { name: "Page Not Found" }),
	).toBeVisible();
});

test("submitting a checkout while signed out asks you to sign in", async ({
	page,
	ai,
}) => {
	await page.goto("/pricing");
	await ai.do("choose the Pro plan and submit checkout with a valid card");

	await expect(page).toHaveURL(/\/sign-in/);
});
