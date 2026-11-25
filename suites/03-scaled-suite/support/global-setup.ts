import fs from "node:fs";
import path from "node:path";
import { type FullConfig, request } from "@playwright/test";
import { createUser, sessionCookie, setFleet } from "./api";

// Anchored to the suite folder, so they resolve the same wherever the tests run.
const AUTH_DIR = path.join(__dirname, "..", ".auth");
export const STORAGE_STATE = path.join(AUTH_DIR, "user.json");
export const ACCOUNT_FILE = path.join(AUTH_DIR, "user-account.json");

/**
 * Creates one shared user, with the office's bikes, for the tests in the
 * `signed-in` project that only read data. Tests that change the account get their own user instead, see
 * the `account` option in `fixtures.ts`.
 */
export default async function globalSetup(config: FullConfig) {
	const { baseURL, extraHTTPHeaders } = config.projects[0].use;
	if (!baseURL) throw new Error("baseURL must be set");

	const api = await request.newContext({ baseURL, extraHTTPHeaders });
	const user = await createUser(api);
	await setFleet(api, user.apiKey);
	await api.dispose();

	fs.mkdirSync(AUTH_DIR, { recursive: true });
	fs.writeFileSync(
		STORAGE_STATE,
		JSON.stringify({
			cookies: [sessionCookie(user.session, baseURL)],
			origins: [],
		}),
	);
	fs.writeFileSync(ACCOUNT_FILE, JSON.stringify({ email: user.email }));
}
