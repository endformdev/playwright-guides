import { expect, test } from "playwright-intent";

test("a new user can sign up, add a bike, and book it", async ({
	page,
	ai,
}) => {
	const email = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: "testpassword123",
	});
	await ai.do("add a road bike named Road 1 to the fleet");
	await ai.do("book Road 1 for the morning");

	await expect(page.getByRole("status")).toContainText("Booked Road 1");
	await expect(
		page.getByRole("listitem").filter({ hasText: "Road 1" }),
	).toContainText("morning");
});
