import "server-only";

/**
 * The same app is deployed several times, once per demo profile, so the
 * guides can show suites running against apps with different behaviour:
 *
 * - `clean` (default): a fast, well-behaved app.
 * - `slow`: realistic performance bottlenecks (slow sign-ups, a slow activity
 *   query, and a payment provider that only handles a few charges at a time).
 *   Used by the speed guides.
 * - `flaky`: realistic intermittent failure modes (transient 503s, a lagging
 *   cache, a late cookie banner, and activity entries whose order isn't
 *   stable). Used by the flaky-test guides.
 *
 * Every profile-specific behaviour lives in this file, so the rest of the app
 * reads like a normal SaaS codebase.
 */
export type DemoProfile = "clean" | "slow" | "flaky";

export function getDemoProfile(): DemoProfile {
	const profile = process.env.DEMO_PROFILE?.trim().toLowerCase();
	if (profile === "slow" || profile === "flaky") return profile;
	return "clean";
}

// --- slow ---------------------------------------------------------------

const slowLatencyMs = {
	/** A sign-up risk check against a third-party service. */
	signUp: 1500,
	/** Sign-in rate limiting / credential stuffing protection. */
	signIn: 800,
	/** The activity log query scans an unindexed table. */
	activityLog: 1200,
	/** Loading the team with all of its members. */
	team: 400,
} as const;

/** Adds the latency an operation has under the `slow` profile. */
export async function simulateLatency(operation: keyof typeof slowLatencyMs) {
	if (getDemoProfile() !== "slow") return;
	await sleep(jitter(slowLatencyMs[operation]));
}

const PAYMENT_PROVIDER_CONCURRENCY = 2;
const PAYMENT_PROVIDER_LATENCY_MS = 2000;
let paymentsInFlight = 0;
const paymentQueue: (() => void)[] = [];

/**
 * Charges a card with the (dummy) payment provider. Under the `slow` profile
 * the provider takes a couple of seconds per charge and only processes
 * {@link PAYMENT_PROVIDER_CONCURRENCY} charges at a time per server instance,
 * so concurrent checkouts queue up behind each other.
 */
export async function chargeWithPaymentProvider() {
	if (getDemoProfile() !== "slow") return;

	if (paymentsInFlight >= PAYMENT_PROVIDER_CONCURRENCY) {
		await new Promise<void>((resolve) => paymentQueue.push(resolve));
	}
	paymentsInFlight++;
	try {
		await sleep(jitter(PAYMENT_PROVIDER_LATENCY_MS));
	} finally {
		paymentsInFlight--;
		paymentQueue.shift()?.();
	}
}

// --- flaky --------------------------------------------------------------

const transientFailureRates = {
	/** The team API, backed by an occasionally overloaded service. */
	teamApi: 0.1,
	/** The email provider used to send team invitations. */
	invitationEmail: 0.06,
} as const;

/**
 * Under the `flaky` profile, a small share of calls to some upstream services
 * fail with a 503, the way an overloaded dependency occasionally does.
 */
export function hasTransientUpstreamFailure(
	service: keyof typeof transientFailureRates,
) {
	return (
		getDemoProfile() === "flaky" &&
		Math.random() < transientFailureRates[service]
	);
}

const teamCache = new Map<number, { value: unknown; expiresAt: number }>();

/** Usually a cached team expires almost at once, sometimes it lingers. */
function teamCacheTtlMs() {
	return Math.random() < 0.07
		? 1500 + Math.random() * 2000
		: Math.random() * 200;
}

/**
 * Under the `flaky` profile, team reads go through an in-memory cache with an
 * uneven expiry, like a read replica that usually keeps up but now and then
 * lags behind writes. Right after a change, the team can occasionally be
 * returned as it was before it.
 */
export async function readThroughTeamCache<T>(
	userId: number,
	load: () => Promise<T>,
): Promise<T> {
	if (getDemoProfile() !== "flaky") return load();

	const cached = teamCache.get(userId);
	if (cached && cached.expiresAt > Date.now()) return cached.value as T;

	const value = await load();
	teamCache.set(userId, {
		value,
		expiresAt: Date.now() + teamCacheTtlMs(),
	});
	return value;
}

export type CookieBannerTiming = {
	/** How long the consent script usually takes to show the banner. */
	usualDelayMs: [number, number];
	/** How long it takes when the script loads slowly. */
	slowDelayMs: [number, number];
	/** How often the script loads slowly. */
	slowRate: number;
};

/**
 * Under the `flaky` profile, a cookie consent dialog covers the page a moment
 * after it loads. Usually it appears within a second, but now and then the
 * consent script loads slowly and the dialog shows up a few seconds in.
 */
export function getCookieBannerTiming(): CookieBannerTiming | null {
	if (getDemoProfile() !== "flaky") return null;
	return {
		usualDelayMs: [300, 900],
		slowDelayMs: [1300, 2500],
		slowRate: 0.2,
	};
}

/**
 * Activity entries are stored with second precision. The `clean` and `slow`
 * profiles break ties by insertion order. Under the `flaky` profile ties
 * sometimes come back in a different order, like a query without a
 * deterministic sort key whose plan changes with the table's statistics.
 */
export function shouldShuffleActivityTies() {
	return getDemoProfile() === "flaky" && Math.random() < 0.2;
}

/**
 * Under the `flaky` profile, some requests for the current user are served by
 * a slow replica and take a second or two.
 */
export async function simulateSlowUserRead() {
	if (getDemoProfile() !== "flaky" || Math.random() >= 0.12) return;
	await sleep(700 + Math.random() * 1300);
}

// --- helpers -------------------------------------------------------------

function jitter(ms: number) {
	return ms * (0.8 + Math.random() * 0.4);
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
