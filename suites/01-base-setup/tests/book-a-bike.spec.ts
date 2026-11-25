import { expect, test } from "playwright-intent";

test("a new user can sign up and book a bike", async ({ page, ai }) => {
	const email = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: "testpassword123",
	});

	// New BikeBook offices start with an empty fleet, so add a bike via the API.
	const apiKey = await page
		.getByRole("textbox", { name: "API key" })
		.inputValue();
	const response = await page.request.put("/api/fleet", {
		headers: { authorization: `Bearer ${apiKey}` },
		data: { bikes: [{ name: "Road 1", type: "road" }] },
	});
	expect(response.ok()).toBe(true);
	await page.reload();

	await ai.do("book Road 1 for the morning");

	await expect(page.getByRole("status")).toContainText("Booked Road 1");
	await expect(
		page.getByRole("listitem").filter({ hasText: "Road 1" }),
	).toContainText("morning");
});
