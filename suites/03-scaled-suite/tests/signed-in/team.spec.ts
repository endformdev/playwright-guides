import { PASSWORD, uniqueEmail } from "../../support/api";
import { expect, type Page, testWithNewUser } from "../../support/fixtures";

const members = (page: Page) => page.getByTestId("team-member");
const member = (page: Page, nameOrEmail: string) =>
	members(page).filter({ hasText: nameOrEmail });

testWithNewUser(
	"shows the signed-in user as the team owner",
	async ({ page, newUser }) => {
		await page.goto("/dashboard/team");

		await expect(members(page)).toHaveCount(1);
		await expect(
			member(page, newUser.email).getByTestId("team-member-role"),
		).toHaveText("owner");
	},
);

testWithNewUser("shows the current plan", async ({ page }) => {
	await page.goto("/dashboard/team");

	await expect(page.getByText("Current Plan: Free")).toBeVisible();
});

testWithNewUser(
	"links to the pricing page to change plan",
	async ({ page }) => {
		await page.goto("/dashboard/team");

		await page.getByRole("link", { name: "Change Plan" }).click();

		await expect(page).toHaveURL("/pricing");
	},
);

testWithNewUser.describe("inviting team members", () => {
	testWithNewUser(
		"owners can invite by email and get an invite link",
		async ({ page, ai }) => {
			const email = uniqueEmail("teammate");
			await page.goto("/dashboard/team");

			await ai.do("invite {email} as a Member", { email });

			const link = await page
				.getByText(`Invite link for ${email}`)
				.getByRole("link")
				.getAttribute("href");
			expect(link).toMatch(/^\/sign-up\?inviteId=\d+$/);
		},
	);

	testWithNewUser(
		"the same email can't be invited twice",
		async ({ page, ai }) => {
			const email = uniqueEmail("teammate");
			await page.goto("/dashboard/team");
			await ai.do("invite {email} as a Member", { email });

			await page.getByRole("textbox", { name: "Email" }).fill(email);
			await page.getByRole("button", { name: "Invite Member" }).click();

			await expect(
				page.getByText("An invitation has already been sent to this email"),
			).toBeVisible();
		},
	);

	testWithNewUser(
		"existing members can't be invited",
		async ({ page, newUser }) => {
			await page.goto("/dashboard/team");

			await page.getByRole("textbox", { name: "Email" }).fill(newUser.email);
			await page.getByRole("button", { name: "Invite Member" }).click();

			await expect(
				page.getByText("User is already a member of this team"),
			).toBeVisible();
		},
	);

	for (const role of ["Member", "Owner"] as const) {
		testWithNewUser(
			`an invited ${role.toLowerCase()} joins the team with that role`,
			async ({ page, newUser, ai }) => {
				const inviteeEmail = uniqueEmail("invitee");
				await page.goto("/dashboard/team");
				await ai.do("invite {email} as {role}", { email: inviteeEmail, role });
				const link = (await page
					.getByText(`Invite link for ${inviteeEmail}`)
					.getByRole("link")
					.getAttribute("href")) as string;

				await ai.do("sign out from the user menu");
				await page.goto(link);
				await ai.do("sign up with email {email} and password {password}", {
					email: inviteeEmail,
					password: PASSWORD,
				});

				await expect(page).toHaveURL("/dashboard");
				await page.getByRole("link", { name: "Team" }).click();
				await expect(members(page)).toHaveCount(2);
				await expect(member(page, newUser.email)).toContainText("owner");
				await expect(member(page, inviteeEmail)).toContainText(
					role.toLowerCase(),
				);
			},
		);
	}

	testWithNewUser("members can't invite others", async ({ page, ai }) => {
		const inviteeEmail = uniqueEmail("invitee");
		await page.goto("/dashboard/team");
		await ai.do("invite {email} as a Member", { email: inviteeEmail });
		const link = (await page
			.getByText(`Invite link for ${inviteeEmail}`)
			.getByRole("link")
			.getAttribute("href")) as string;

		await ai.do("sign out from the user menu");
		await page.goto(link);
		await ai.do("sign up with email {email} and password {password}", {
			email: inviteeEmail,
			password: PASSWORD,
		});
		await page.getByRole("link", { name: "Team" }).click();

		await expect(
			page.getByText("You must be a team owner to invite new members."),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Invite Member" }),
		).toBeDisabled();
	});

	testWithNewUser(
		"owners can remove a member",
		async ({ page, newUser, ai }) => {
			const inviteeEmail = uniqueEmail("invitee");
			await page.goto("/dashboard/team");
			await ai.do("invite {email} as a Member", { email: inviteeEmail });
			const link = (await page
				.getByText(`Invite link for ${inviteeEmail}`)
				.getByRole("link")
				.getAttribute("href")) as string;

			await ai.do("sign out from the user menu");
			await page.goto(link);
			await ai.do("sign up with email {email} and password {password}", {
				email: inviteeEmail,
				password: PASSWORD,
			});
			await ai.do("sign out as the invitee");
			await page.goto("/sign-in");
			await ai.do("sign in with email {email} and password {password}", {
				email: newUser.email,
				password: newUser.password,
			});
			await page.getByRole("link", { name: "Team" }).click();
			await expect(members(page)).toHaveCount(2);

			await member(page, inviteeEmail)
				.getByRole("button", { name: "Remove" })
				.click();

			await expect(members(page)).toHaveCount(1);
			await expect(member(page, inviteeEmail)).toHaveCount(0);
		},
	);

	testWithNewUser(
		"owners can't remove themselves",
		async ({ page, newUser }) => {
			await page.goto("/dashboard/team");

			await expect(
				member(page, newUser.email).getByRole("button", { name: "Remove" }),
			).toHaveCount(0);
		},
	);
});
