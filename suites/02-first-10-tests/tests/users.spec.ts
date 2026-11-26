import { test } from "playwright-intent";
import {
	expect,
	PASSWORD,
	testWithNewUser,
	uniqueEmail,
} from "./test-with-new-user";

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

test("users can sign in and sign out", async ({ page, ai }) => {
	const email = uniqueEmail();

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});
	await ai.do("sign out from the user menu");
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();

	await page.goto("/sign-in");
	await ai.do("sign in with email {email} and password {password}", {
		email,
		password: PASSWORD,
	});

	await expect(page).toHaveURL("/dashboard");
	await expect(page.getByRole("heading", { name: "Bikes" })).toBeVisible();
});

testWithNewUser(
	"deleting an account signs the user out and blocks signing back in",
	async ({ page, newUser, ai }) => {
		await page.goto("/dashboard/security");

		await page
			.getByRole("textbox", { name: "Confirm Password" })
			.fill(newUser.password);
		await page.getByRole("button", { name: "Delete Account" }).click();
		await expect(page).toHaveURL("/sign-in");

		await ai.do("sign in with email {email} and password {password}", {
			email: newUser.email,
			password: newUser.password,
		});
		await expect(
			page.getByText("Invalid email or password. Please try again."),
		).toBeVisible();
	},
);

testWithNewUser(
	"an invited teammate can join the team and book a bike",
	async ({ page, ai }) => {
		const teammateEmail = uniqueEmail("teammate");

		await page.goto("/dashboard");
		await ai.do("add a city bike named City 1 to the fleet");

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
	},
);

function nextWeek() {
	const day = new Date();
	day.setUTCDate(day.getUTCDate() + 7);
	return day.toISOString().slice(0, 10);
}
