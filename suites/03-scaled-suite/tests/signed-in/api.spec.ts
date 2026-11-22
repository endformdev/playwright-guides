import { expect, test } from "../../support/fixtures";

test("returns the signed-in user", async ({ request, user }) => {
	const body = await (await request.get("/api/user")).json();

	expect(body).toMatchObject({ email: user.email, role: "owner" });
	expect(body).not.toHaveProperty("passwordHash");
});

test("returns the user's team with its members", async ({ request, user }) => {
	const team = await (await request.get("/api/team")).json();

	expect(team.name).toBe(`${user.email}'s Team`);
	expect(team.teamMembers).toEqual([
		expect.objectContaining({
			role: "owner",
			user: expect.objectContaining({ email: user.email }),
		}),
	]);
});

test("a new team has no payments", async ({ request }) => {
	const payments = await (await request.get("/api/payment")).json();

	expect(payments).toEqual([]);
});
