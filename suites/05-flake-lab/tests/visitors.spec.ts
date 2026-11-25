import { expect, PASSWORD, test, uniqueEmail } from "../support/fixtures";

test("a visitor compares the plans", async ({ page }) => {
	await test.step("Open the pricing page", async () => {
		await page.goto("/pricing");
	});

	await test.step("See both plans with their monthly price", async () => {
		await expect(page.getByText("$8 per user / month")).toBeVisible();
		await expect(page.getByText("$12 per user / month")).toBeVisible();
	});
});

test("a visitor signs up and lands on the bikes page", async ({ page }) => {
	const email = uniqueEmail();

	await test.step("Fill in the sign up form", async () => {
		await page.goto("/sign-up");
		await page.getByRole("textbox", { name: "Email" }).fill(email);
		await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
		await page.getByRole("button", { name: "Sign up" }).click();
	});

	await test.step("See the bikes page of a new office without bikes", async () => {
		await expect(page).toHaveURL("/dashboard");
		await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
		await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();
	});
});

test("a signed-out visitor is asked to sign in", async ({ page }) => {
	await test.step("Try to open the dashboard", async () => {
		await page.goto("/dashboard");
	});

	await test.step("End up on the sign in page", async () => {
		await expect(page).toHaveURL("/sign-in");
		await expect(
			page.getByRole("heading", { name: "Sign in to your account" }),
		).toBeVisible();
	});
});
