import { expect, test } from "playwright-intent";
import { addOfficeFleet, nextWeek, PASSWORD, uniqueEmail } from "./helpers";

test("an invited teammate can book from the team's bikes", async ({
	page,
	ai,
}) => {
	const ownerEmail = uniqueEmail("owner");
	const teammateEmail = uniqueEmail("teammate");

	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email: ownerEmail,
		password: PASSWORD,
	});
	await addOfficeFleet(page);

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

	// The teammate sees the owner's bikes and can book one.
	await page.goto(`/dashboard?date=${nextWeek()}`);
	await page.getByRole("button", { name: "Book City 1 morning" }).click();
	await expect(page.getByRole("status")).toContainText("Booked City 1");
});

test("users can upgrade from Free to the Plus plan", async ({ page, ai }) => {
	await page.goto("/sign-up");
	await ai.do("sign up with email {email} and password {password}", {
		email: uniqueEmail(),
		password: PASSWORD,
	});
	await page.getByRole("link", { name: "Team" }).click();
	await expect(page.getByText("Current Plan: Free")).toBeVisible();

	await ai.do("choose the Plus plan and complete checkout with a valid card");

	await expect(page).toHaveURL("/dashboard/team?payment=success");
	await expect(page.getByText("Current Plan: Plus")).toBeVisible();
});
