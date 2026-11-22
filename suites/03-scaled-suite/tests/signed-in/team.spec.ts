import { PASSWORD, uniqueEmail } from "../../support/api";
import { expect, test } from "../../support/fixtures";
import { AuthForm, signOut } from "../../support/pages";

test("shows the signed-in user as the team owner", async ({
	teamPage,
	user,
}) => {
	await teamPage.goto();

	await expect(teamPage.members).toHaveCount(1);
	await expect(
		teamPage.member(user.email).getByTestId("team-member-role"),
	).toHaveText("owner");
});

test("shows the current plan", async ({ page, teamPage }) => {
	await teamPage.goto();

	await expect(page.getByText("Current Plan: Free")).toBeVisible();
});

test("links to the pricing page to change plan", async ({ page, teamPage }) => {
	await teamPage.goto();

	await page.getByRole("link", { name: "Change Plan" }).click();

	await expect(page).toHaveURL("/pricing");
});

test.describe("inviting team members", () => {
	test.use({ account: "new" });

	test("owners can invite by email and get an invite link", async ({
		teamPage,
	}) => {
		await teamPage.goto();

		const link = await teamPage.invite(uniqueEmail("teammate"));

		expect(link).toMatch(/^\/sign-up\?inviteId=\d+$/);
	});

	test("the same email can't be invited twice", async ({ page, teamPage }) => {
		const email = uniqueEmail("teammate");
		await teamPage.goto();
		await teamPage.invite(email);

		await teamPage.inviteEmail.fill(email);
		await page.getByRole("button", { name: "Invite Member" }).click();

		await expect(
			page.getByText("An invitation has already been sent to this email"),
		).toBeVisible();
	});

	test("existing members can't be invited", async ({
		page,
		user,
		teamPage,
	}) => {
		await teamPage.goto();

		await teamPage.inviteEmail.fill(user.email);
		await page.getByRole("button", { name: "Invite Member" }).click();

		await expect(
			page.getByText("User is already a member of this team"),
		).toBeVisible();
	});

	for (const role of ["Member", "Owner"] as const) {
		test(`an invited ${role.toLowerCase()} joins the team with that role`, async ({
			page,
			user,
			teamPage,
		}) => {
			const inviteeEmail = uniqueEmail("invitee");
			await teamPage.goto();
			const link = await teamPage.invite(inviteeEmail, role);
			await signOut(page);

			await page.goto(link);
			await new AuthForm(page).signUp(inviteeEmail, PASSWORD);

			await expect(page).toHaveURL("/dashboard");
			await expect(teamPage.members).toHaveCount(2);
			await expect(teamPage.member(user.email)).toContainText("owner");
			await expect(teamPage.member(inviteeEmail)).toContainText(
				role.toLowerCase(),
			);
		});
	}

	test("members can't invite others", async ({ page, teamPage }) => {
		const inviteeEmail = uniqueEmail("invitee");
		await teamPage.goto();
		const link = await teamPage.invite(inviteeEmail);
		await signOut(page);

		await page.goto(link);
		await new AuthForm(page).signUp(inviteeEmail, PASSWORD);

		await expect(
			page.getByText("You must be a team owner to invite new members."),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Invite Member" }),
		).toBeDisabled();
	});

	test("owners can remove a member", async ({ page, teamPage, user }) => {
		const inviteeEmail = uniqueEmail("invitee");
		const authForm = new AuthForm(page);
		await teamPage.goto();
		const link = await teamPage.invite(inviteeEmail);
		await signOut(page);
		await page.goto(link);
		await authForm.signUp(inviteeEmail, PASSWORD);
		await signOut(page);
		await authForm.signIn(user.email, user.password);
		await expect(teamPage.members).toHaveCount(2);

		await teamPage
			.member(inviteeEmail)
			.getByRole("button", { name: "Remove" })
			.click();

		await expect(teamPage.members).toHaveCount(1);
		await expect(teamPage.member(inviteeEmail)).toHaveCount(0);
	});

	test("owners can't remove themselves", async ({ teamPage, user }) => {
		await teamPage.goto();

		await expect(
			teamPage.member(user.email).getByRole("button", { name: "Remove" }),
		).toHaveCount(0);
	});
});
