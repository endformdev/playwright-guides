# Bugs found by end-to-end tests

The app started as the [Next.js SaaS Starter](https://github.com/nextjs/saas-starter). When we wrote the [scaled suite](../../suites/03-scaled-suite) against it, the tests found five real bugs. Nobody had noticed them, because each one only shows up on a path that a quick manual check skips.

Each example below gives the symptom, the cause, the test that caught it and the diff that fixed it. They are meant as material for guides, posts and talks about what end-to-end tests catch. The diffs leave out unrelated changes made in the same commits, such as the demo-profile hooks.

| #   | Bug                                                                                         | Kind                      | Caught by                    |
| --- | ------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------- |
| 1   | [Signing up with a registered email crashes](#1-signing-up-with-a-registered-email-crashes) | Unhandled error path      | `signed-out/sign-up.spec.ts` |
| 2   | [Any team member can invite people](#2-any-team-member-can-invite-people)                   | Authorization             | `signed-in/team.spec.ts`     |
| 3   | [Removing a team member never works](#3-removing-a-team-member-never-works)                 | Form data types, stale UI | `signed-in/team.spec.ts`     |
| 4   | [The settings form drops typed input](#4-the-settings-form-drops-typed-input)               | Loading-state race        | `signed-in/general.spec.ts`  |
| 5   | [`/api/user` returns the password hash](#5-apiuser-returns-the-password-hash)               | Data exposure             | `signed-in/api.spec.ts`      |

Common threads:

- **Error paths.** Bugs 1 and 3 live in code that only runs when something goes wrong or is rarely used. A happy-path click-through never reaches it.
- **The UI isn't the security boundary.** In bugs 2 and 5 the page looked right, but the server allowed or returned more than it should. Tests that sign in as a second user, or call the API directly, find this.
- **Tests are faster than people.** Bug 4 needs input before the data has loaded. A person never types that fast, but Playwright does, and so does a user on a slow connection.

---

## 1. Signing up with a registered email crashes

**Symptom.** Signing up with an email that already has an account shows a server error page, not a "Failed to create user" message.

**Cause.** `signup()` returns `{ error }` when the email is taken, but the `signUp` action passed that straight to `setSession()` as if it were a user. `setSession()` throws because the object has no `id`.

**Caught by** [`signed-out/sign-up.spec.ts`](../../suites/03-scaled-suite/tests/signed-out/sign-up.spec.ts):

```ts
test("an email that is already registered is rejected", async ({
	page,
	existingUser,
	authForm,
}) => {
	await authForm.signUp(existingUser.email, PASSWORD);

	await expect(
		page.getByText("Failed to create user. Please try again."),
	).toBeVisible();
	await expect(page).toHaveURL("/sign-up");
});
```

**Fix** in `app/(login)/actions.ts`:

```diff
 	const createdUser = await signup(email, password, inviteId);
+	if ("error" in createdUser) {
+		return createdUser;
+	}

 	await setSession(createdUser as NewUser);
```

The `as NewUser` cast is what hid this from TypeScript. Without it, the compiler would have flagged the union type.

---

## 2. Any team member can invite people

**Symptom.** Someone who joined a team as a _member_ can still invite new people.

**Cause.** There are two roles: `users.role` on the user, and `team_members.role` on their membership. Every new user gets `users.role = "owner"` by default, including users who join a team through an invitation as a member. The invite form checked `users.role`, so it was enabled for everyone. The `inviteTeamMember` server action did no role check at all, so even with the button disabled, the request would have gone through. The same gap applied to removing members.

**Caught by** [`signed-in/team.spec.ts`](../../suites/03-scaled-suite/tests/signed-in/team.spec.ts). An owner invites someone, and the test then signs in as that person:

```ts
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
```

**Fix.** Load the team role with the user (`lib/db/queries.ts`):

```diff
 		.select({
 			user: users,
 			teamId: teamMembers.teamId,
+			teamRole: teamMembers.role,
 		})
```

Enforce it in the server actions (`app/(login)/actions.ts`):

```diff
 export const inviteTeamMember = validatedActionWithUser(
 	...
 		if (!userWithTeam?.teamId) {
 			return { error: "User is not part of a team" };
 		}
+		if (userWithTeam.teamRole !== "owner") {
+			return { error: "Only team owners can invite new members" };
+		}
```

```diff
 export const removeTeamMember = validatedActionWithUser(
 	...
 		if (!userWithTeam?.teamId) {
 			return { error: "User is not part of a team" };
 		}
+		if (userWithTeam.teamRole !== "owner") {
+			return { error: "Only team owners can remove members" };
+		}
```

Base the UI on the same role (`app/(dashboard)/dashboard/team/page.tsx`):

```diff
+function useIsTeamOwner() {
+	const { data: user } = useSWR<User>("/api/user", fetcher);
+	const { data: teamData } = useSWR<TeamDataWithMembers>("/api/team", fetcher);
+	const role = teamData?.teamMembers.find(
+		(member) => member.user.id === user?.id,
+	)?.role;
+	return { user, isOwner: role === "owner" };
+}
```

```diff
 function InviteTeamMember() {
-	const { data: user } = useSWR<User>("/api/user", fetcher);
-	const isOwner = user?.role === "owner";
+	const { isOwner } = useIsTeamOwner();
```

The test only checks the UI. The server-side check is what actually fixes the bug; the disabled button is just a convenience. Adding a test that posts the invite as a member would pin down the server check.

---

## 3. Removing a team member never works

**Symptom.** Clicking **Remove** next to a team member does nothing, and the member stays in the list. The button was also only shown from the third member onward, so a team of two could never remove anyone.

**Cause.** Three separate problems:

1. The form sends `memberId` from a hidden input, and form values are always strings. The schema used `z.number()`, so validation failed on every request and the action returned an error nothing displayed.
2. The button was shown for `index > 1`, a placeholder rule from the starter, not for "owners, for anyone but themselves".
3. Even after a successful removal, the team list kept showing the cached data until a reload.

**Caught by** [`signed-in/team.spec.ts`](../../suites/03-scaled-suite/tests/signed-in/team.spec.ts):

```ts
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
```

**Fix** in `app/(login)/actions.ts`:

```diff
 const removeTeamMemberSchema = z.object({
-	memberId: z.number(),
+	memberId: z.coerce.number(),
 });
```

And in `app/(dashboard)/dashboard/team/page.tsx`:

```diff
 function TeamMembers() {
 	const { data: teamData } = useSWR<TeamDataWithMembers>("/api/team", fetcher);
+	const { user, isOwner } = useIsTeamOwner();
 	const [removeState, removeAction, isRemovePending] = useActionState<
 		ActionState,
 		FormData
 	>(removeTeamMember, {});

+	useEffect(() => {
+		if (removeState?.success) mutate("/api/team");
+	}, [removeState]);
```

```diff
-							{index > 1 ? (
+							{isOwner && member.user.id !== user?.id ? (
 								<form action={removeAction}>
 									<input type="hidden" name="memberId" value={member.id} />
```

A unit test of the action with `{ memberId: 3 }` would have passed. Only sending the form the way the browser does shows the string/number mismatch.

---

## 4. The settings form drops typed input

**Symptom.** On **Settings → General**, typing a new name right after the page opens sometimes loses it: the field flips back to the saved name and **Save** keeps the old value. With an empty saved name, the `required` field blocks the submit instead.

**Cause.** The form loads the user with `useSWR` inside a `<Suspense>` boundary. The Suspense fallback was the _same editable form_ with empty values. Anything typed into the fallback was thrown away when the loaded form replaced it. A person rarely types that fast; a test or a user on a slow connection does.

**Caught by** [`signed-in/general.spec.ts`](../../suites/03-scaled-suite/tests/signed-in/general.spec.ts). The test fills the name as soon as the field is there:

```ts
test("a new name is shown in the team list", async ({ page }) => {
	await page.goto("/dashboard/general");

	await page.getByRole("textbox", { name: "Name" }).fill("Grace Hopper");
	await page.getByRole("button", { name: "Save Changes" }).click();
	await expect(page.getByText("Account updated successfully.")).toBeVisible();

	await page.getByRole("link", { name: "Team" }).click();
	await expect(page.getByTestId("team-member-name")).toHaveText(
		"Grace Hopper",
	);
});
```

**Fix** in `app/(dashboard)/dashboard/general/page.tsx`: disable the fallback form, so nothing can be typed until the real one is there. Playwright's `fill()` waits for the field to be enabled, so the test now waits for the data without any extra code.

```diff
 function AccountForm({
 	state,
 	nameValue = "",
 	emailValue = "",
+	disabled = false,
 }: AccountFormProps) {
```

```diff
 					defaultValue={state.name || nameValue}
+					disabled={disabled}
 					required
```

```diff
-						<Suspense fallback={<AccountForm state={state} />}>
+						<Suspense fallback={<AccountForm state={state} disabled />}>
 							<AccountFormWithData state={state} />
 						</Suspense>
```

The `flaky` demo profile deliberately brings back a version of this race (the form re-syncs over typed input), which the [flake lab](../../suites/05-flake-lab) uses as one of its flaky tests.

---

## 5. `/api/user` returns the password hash

**Symptom.** `GET /api/user` returns the whole user row, including `passwordHash`, to the browser.

**Cause.** The route returned the database row as is. The page only shows the name and email, so nothing on screen hinted at it.

**Caught by** [`signed-in/api.spec.ts`](../../suites/03-scaled-suite/tests/signed-in/api.spec.ts), which calls the API with the signed-in user's cookies through Playwright's `request` fixture:

```ts
test("returns the signed-in user", async ({ request, user }) => {
	const body = await (await request.get("/api/user")).json();

	expect(body).toMatchObject({ email: user.email, role: "owner" });
	expect(body).not.toHaveProperty("passwordHash");
});
```

**Fix** in `app/api/user/route.ts`:

```diff
 export async function GET() {
 	const user = await getUser();
-	return Response.json(user);
+	if (!user) return Response.json(null);
+
+	const { passwordHash: _, ...publicUser } = user;
+	return Response.json(publicUser);
 }
```

The `/api/team` route builds its member list with explicit column selections, so it never had this problem. Choosing the fields to return, as that route does, is the more robust fix.
