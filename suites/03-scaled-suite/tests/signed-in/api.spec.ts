import { expect, testWithNewUser } from "../../support/fixtures";

testWithNewUser("returns the signed-in user", async ({ page, newUser }) => {
	const body = await (await page.request.get("/api/user")).json();

	expect(body).toMatchObject({ email: newUser.email, role: "owner" });
	expect(body).not.toHaveProperty("passwordHash");
});

testWithNewUser(
	"returns the user's team with its members",
	async ({ page, newUser }) => {
		const team = await (await page.request.get("/api/team")).json();

		expect(team.name).toBe(`${newUser.email}'s Team`);
		// Only owners see the Fleet API key, on the bikes page.
		expect(team).not.toHaveProperty("apiKey");
		expect(team.teamMembers).toEqual([
			expect.objectContaining({
				role: "owner",
				user: expect.objectContaining({ email: newUser.email }),
			}),
		]);
	},
);

testWithNewUser("a new team has no payments", async ({ page }) => {
	const payments = await (await page.request.get("/api/payment")).json();

	expect(payments).toEqual([]);
});
