import { expect, PASSWORD, test, uniqueEmail } from "./fixtures";
import { addBike, nextWeek } from "./helpers";

test("new visitors can sign up and land on their office's bikes", async ({
	page,
	ai,
}) => {
	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
	await expect(page.getByText("Your office has no bikes yet.")).toBeVisible();
});

test("users can sign in and sign out", async ({ page, existingUser, ai }) => {
	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email: existingUser.email,
		password: existingUser.password,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();

	await ai.do("sign out from the user menu");
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
});

test("signing in with the wrong password shows an error", async ({
	page,
	existingUser,
	ai,
}) => {
	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email: existingUser.email,
		password: "not-the-password",
	});

	await expect(
		page.getByText("Invalid email or password. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-in");
});

test.describe("team invites", () => {
	test.use({ signedIn: true });

	test("an invited teammate can join the team and book a bike", async ({
		page,
		ai,
	}) => {
		const teammateEmail = uniqueEmail("teammate");

		await page.goto("/dashboard");
		await addBike(page, "City 1", "city");

		await page.getByRole("link", { name: "Team" }).click();
		await ai.do("invite {email} to the team as a member", {
			email: teammateEmail,
		});
		const inviteHref = await page
			.getByRole("link", { name: /inviteId=/ })
			.getAttribute("href");
		expect(inviteHref).toMatch(/^\/sign-up\?inviteId=\d+$/);

		await ai.do("sign out from the user menu");
		await page.goto(inviteHref as string);
		await ai.do(
			"accept the invitation and sign up with email {email} and password {password}",
			{ email: teammateEmail, password: PASSWORD },
		);

		await page.goto(`/dashboard?date=${nextWeek()}`);
		await page.getByRole("button", { name: "Book City 1 morning" }).click();
		await expect(page.getByRole("status")).toContainText("Booked City 1");
	});
});
