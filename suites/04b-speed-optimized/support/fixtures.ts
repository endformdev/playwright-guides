import { test as base, expect, type Page } from "@playwright/test";
import {
	type Account,
	type Bike,
	createUser,
	deleteUser,
	OFFICE_FLEET,
	PASSWORD,
	sessionCookie,
	setFleet,
	uniqueEmail,
} from "./api";

type NewUser = Account & { session: string; apiKey: string };

type FleetFixture = {
	/** Seeds the default eight-bike office fleet via the Fleet API. */
	seed: () => Promise<(Bike & { id: number })[]>;
	/** Replaces the team's fleet with the given bikes via the Fleet API. */
	set: (bikes: readonly Bike[]) => Promise<(Bike & { id: number })[]>;
	/** Adds one or more bikes to the team's fleet via the Fleet API. */
	add: (...bikes: Bike[]) => Promise<(Bike & { id: number })[]>;
};

type TeamFixture = {
	/** Invites a member who signs up in their own browser, cleaned up on teardown. */
	addMember: () => Promise<{ email: string; page: Page }>;
};

export const test = base;

export const testWithNewUser = base.extend<{
	newUser: NewUser;
	fleet: FleetFixture;
	team: TeamFixture;
}>({
	newUser: [
		async ({ request, context, baseURL }, use) => {
			const user = await createUser(request);
			await context.addCookies([
				sessionCookie(user.session, baseURL as string),
			]);
			await use(user);
			await deleteUser(request, user.email);
		},
		{ auto: true },
	],
	fleet: async ({ newUser, request }, use) => {
		let current: Bike[] = [];
		const set = async (bikes: readonly Bike[]) => {
			current = [...bikes];
			return setFleet(request, newUser.apiKey, current);
		};
		await use({
			seed: () => set(OFFICE_FLEET),
			set,
			add: (...bikes) => set([...current, ...bikes]),
		});
	},
	team: async ({ page, browser, request }, use) => {
		const created: Array<{ email: string; close: () => Promise<void> }> = [];

		await use({
			addMember: async () => {
				const email = uniqueEmail("member");
				await page.goto("/dashboard/team");
				await page.getByRole("textbox", { name: "Email" }).fill(email);
				await page.getByRole("button", { name: "Invite Member" }).click();
				const link = (await page
					.getByText(`Invite link for ${email}`)
					.getByRole("link")
					.getAttribute("href")) as string;

				const memberContext = await browser.newContext();
				const memberPage = await memberContext.newPage();
				await memberPage.goto(link);
				await memberPage.getByRole("textbox", { name: "Email" }).fill(email);
				await memberPage
					.getByRole("textbox", { name: "Password" })
					.fill(PASSWORD);
				await memberPage.getByRole("button", { name: "Sign up" }).click();
				await expect(memberPage).toHaveURL("/dashboard");

				created.push({ email, close: () => memberContext.close() });
				return { email, page: memberPage };
			},
		});

		for (const member of created) {
			await member.close();
			await deleteUser(request, member.email);
		}
	},
});

export { expect, type Page } from "@playwright/test";
