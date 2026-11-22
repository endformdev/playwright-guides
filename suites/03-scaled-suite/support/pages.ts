import { expect, type Locator, type Page } from "@playwright/test";

export class AuthForm {
	readonly email: Locator;
	readonly password: Locator;

	constructor(private readonly page: Page) {
		this.email = page.getByRole("textbox", { name: "Email" });
		this.password = page.getByRole("textbox", { name: "Password" });
	}

	async signUp(email: string, password: string) {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.page.getByRole("button", { name: "Sign up" }).click();
	}

	async signIn(email: string, password: string) {
		await this.page.goto("/sign-in");
		await this.email.fill(email);
		await this.password.fill(password);
		await this.page.getByRole("button", { name: "Sign in" }).click();
	}
}

export type PaymentDetails = {
	cardHolderName: string;
	cardNumber: string;
	expiryDate: string;
	cvv: string;
	billingAddress: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
};

export const validPayment: PaymentDetails = {
	cardHolderName: "Ada Lovelace",
	cardNumber: "12345678",
	expiryDate: "12/30",
	cvv: "123",
	billingAddress: "1 Analytical Engine Way",
	city: "London",
	state: "Greater London",
	zipCode: "N1 9GU",
	country: "United Kingdom",
};

export class CheckoutPage {
	readonly fields: Record<keyof PaymentDetails, Locator>;
	readonly submit: Locator;

	constructor(private readonly page: Page) {
		const textbox = (name: string) => page.getByRole("textbox", { name });
		this.fields = {
			cardHolderName: textbox("Card Holder Name"),
			cardNumber: textbox("Card Number (8 digits only)"),
			expiryDate: textbox("Expiry Date"),
			cvv: textbox("CVV"),
			billingAddress: textbox("Street Address"),
			city: textbox("City"),
			state: textbox("State"),
			zipCode: textbox("ZIP Code"),
			country: textbox("Country"),
		};
		this.submit = page.getByRole("button", { name: /Complete Purchase/ });
	}

	async goto(plan: "Base" | "Plus") {
		await this.page.goto("/pricing");
		await this.page
			.getByRole("button", { name: "Get Started" })
			.nth(plan === "Base" ? 0 : 1)
			.click();
		await expect(this.page).toHaveURL(/\/pricing\/checkout/);
	}

	async fill(details: Partial<PaymentDetails> = {}) {
		const values = { ...validPayment, ...details };
		for (const [field, locator] of Object.entries(this.fields)) {
			await locator.fill(values[field as keyof PaymentDetails]);
		}
	}

	async purchase(plan: "Base" | "Plus") {
		await this.goto(plan);
		await this.fill();
		await this.submit.click();
		await expect(this.page).toHaveURL("/dashboard?payment=success");
	}
}

export class TeamSettingsPage {
	readonly members: Locator;
	readonly inviteEmail: Locator;

	constructor(private readonly page: Page) {
		this.members = page.getByTestId("team-member");
		this.inviteEmail = page.getByRole("textbox", { name: "Email" });
	}

	async goto() {
		await this.page.goto("/dashboard");
		await expect(
			this.page.getByRole("heading", { name: "Team Settings" }),
		).toBeVisible();
	}

	member(nameOrEmail: string) {
		return this.members.filter({ hasText: nameOrEmail });
	}

	/** Invites someone and returns the invite link shown after sending. */
	async invite(email: string, role: "Member" | "Owner" = "Member") {
		await this.inviteEmail.fill(email);
		await this.page.getByRole("radio", { name: role }).check();
		await this.page.getByRole("button", { name: "Invite Member" }).click();

		const link = this.page
			.getByText(`Invite link for ${email}`)
			.getByRole("link");
		return (await link.getAttribute("href")) as string;
	}
}

export async function signOut(page: Page) {
	await page.getByTestId("user-menu-trigger").click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
}
