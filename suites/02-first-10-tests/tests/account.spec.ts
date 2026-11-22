import { expect, test } from "@playwright/test";
import { PASSWORD, signIn, signOut, signUp } from "./helpers";

test("users can change their name", async ({ page }) => {
	await signUp(page);

	await page.getByRole("link", { name: "General" }).click();
	await page.getByRole("textbox", { name: "Name" }).fill("Ada Lovelace");
	await page.getByRole("button", { name: "Save Changes" }).click();
	await expect(page.getByText("Account updated successfully.")).toBeVisible();

	await page.getByRole("link", { name: "Team" }).click();
	await expect(page.getByTestId("team-member-name")).toHaveText("Ada Lovelace");
});

test("users can change their password", async ({ page }) => {
	const { email } = await signUp(page);
	const newPassword = "a-brand-new-password";

	await page.getByRole("link", { name: "Security" }).click();
	await page.getByRole("textbox", { name: "Current Password" }).fill(PASSWORD);
	await page
		.getByRole("textbox", { name: "New Password", exact: true })
		.fill(newPassword);
	await page
		.getByRole("textbox", { name: "Confirm New Password" })
		.fill(newPassword);
	await page.getByRole("button", { name: "Update Password" }).click();
	await expect(page.getByText("Password updated successfully.")).toBeVisible();

	await signOut(page);
	await signIn(page, email, newPassword);
	await expect(page).toHaveURL("/dashboard");
});

test("owners can invite a team member", async ({ page }) => {
	await signUp(page);

	await page
		.getByRole("textbox", { name: "Email" })
		.fill(`teammate-${Date.now()}@example.com`);
	await page.getByRole("button", { name: "Invite Member" }).click();

	await expect(page.getByText("Invitation sent successfully")).toBeVisible();
	await expect(page.getByRole("link", { name: /inviteId=/ })).toBeVisible();
});

test("users can upgrade to the Plus plan", async ({ page }) => {
	await signUp(page);
	await expect(page.getByText("Current Plan: Free")).toBeVisible();

	await page.getByRole("link", { name: "Change Plan" }).click();
	await page.getByRole("button", { name: "Get Started" }).nth(1).click();
	await expect(page.getByText("You are purchasing: Plus")).toBeVisible();

	await page
		.getByRole("textbox", { name: "Card Holder Name" })
		.fill("Ada Lovelace");
	await page
		.getByRole("textbox", { name: "Card Number (8 digits only)" })
		.fill("12345678");
	await page.getByRole("textbox", { name: "Expiry Date" }).fill("12/30");
	await page.getByRole("textbox", { name: "CVV" }).fill("123");
	await page
		.getByRole("textbox", { name: "Street Address" })
		.fill("1 Analytical Engine Way");
	await page.getByRole("textbox", { name: "City" }).fill("London");
	await page.getByRole("textbox", { name: "State" }).fill("Greater London");
	await page.getByRole("textbox", { name: "ZIP Code" }).fill("N1 9GU");
	await page.getByRole("textbox", { name: "Country" }).fill("United Kingdom");
	await page.getByRole("button", { name: "Complete Purchase" }).click();

	await expect(page).toHaveURL("/dashboard?payment=success");
	await expect(page.getByText("Current Plan: Plus")).toBeVisible();
});
