import fs from "node:fs";
import { type FullConfig, request } from "@playwright/test";
import { deleteUser } from "./api";
import { ACCOUNT_FILE } from "./global-setup";

export default async function globalTeardown(config: FullConfig) {
	if (!fs.existsSync(ACCOUNT_FILE)) return;

	const { baseURL, extraHTTPHeaders } = config.projects[0].use;
	const { email } = JSON.parse(fs.readFileSync(ACCOUNT_FILE, "utf8"));

	const api = await request.newContext({ baseURL, extraHTTPHeaders });
	await deleteUser(api, email);
	await api.dispose();
	fs.rmSync(ACCOUNT_FILE);
}
