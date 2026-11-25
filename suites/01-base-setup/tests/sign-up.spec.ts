import { expect, test } from "playwright-intent";

test("a new visitor can sign up and reach their office's bikes", async ({
	page,
	ai,
}) => {
	const email = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: "testpassword123",
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
	// A new team starts without bikes. Tests that book give it some first.
	await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();
});
