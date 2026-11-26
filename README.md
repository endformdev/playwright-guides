# Playwright guides example app

The example SaaS application and Playwright suites behind [Endform](https://endform.dev)'s guides.

It is BikeBook, a small but realistic SaaS app for booking bikes from an office bike pool, with a set of progressively more advanced Playwright suites written against it. Next to the booking itself it has everything a SaaS app has: sign up, teams, invitations, a pricing and checkout flow, and an activity log. The app runs with zero setup: no database or auth environment variables are needed.

## Repository layout

```text
app/, components/, lib/   The Next.js SaaS app
lib/demo-profile.ts       Everything that differs between the clean, slow and flaky apps
suites/                   One Playwright suite per folder, each its own Endform suite
scenarios/                Patches that are kept open as demo pull requests
cf/                       The Cloudflare Durable Object that hosts the demo databases
docs/                     Notes for writing the guides, such as the bugs the suites found
```

## Getting started

```bash
git clone https://github.com/endformdev/playwright-guides
cd playwright-guides
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

By default the app connects to a shared demo SQLite database through an HTTP proxy backed by a Cloudflare Durable Object (see [`cf/`](cf)). That database is public and wiped every hour, so it is only meant for demos and tests.

To use your own local SQLite file instead, create `.env` and run the migrations, then optionally seed it:

```bash
pnpm db:setup
pnpm db:seed
```

## Bikes and the Fleet API

Each team books from its own fleet on `/dashboard`: every bike has a morning and an afternoon slot per day, and a slot can only be booked once. Members can cancel their own bookings; owners can cancel anyone's.

New teams start without bikes. Owners can add or remove bikes directly on `/dashboard`, or manage the fleet programmatically with the Fleet API:

```bash
curl -X PUT http://localhost:3000/api/fleet \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bikes": [{"name": "Road 1", "type": "road"}, {"name": "Cargo", "type": "cargo"}]}'
```

The fleet is made to match the list. Bikes are matched by name, so listed bikes keep their bookings and bikes that aren't listed are removed with theirs. Bike types are `road`, `city`, `e-city` and `cargo`. `GET /api/fleet` returns the current fleet.

In tests, `POST /api/internal/user` returns the new team's API key as `team.apiKey`, so a test can create a user and give its team a fleet without touching the UI.

## Demo profiles

The same app is deployed three times, differing only in the `DEMO_PROFILE` environment variable:

| Profile           | Behaviour                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clean` (default) | A fast, well-behaved app.                                                                                                                                                                                                                   |
| `slow`            | Slow sign-ups (a third-party risk check), slow sign-ins, a slow activity query, slow bookings, and a payment provider that takes about 2s per charge and only handles 2 charges at a time per server.                                       |
| `flaky`           | A team cache that occasionally lags behind writes, transient 503s from the team API and the invitation email provider, a settings form that re-syncs over typed input, unstable ordering of same-second activity, and a late cookie dialog. |

Every profile-specific behaviour lives in [`lib/demo-profile.ts`](lib/demo-profile.ts) and [`components/demo-profile-provider.tsx`](components/demo-profile-provider.tsx), so the rest of the app reads like a normal SaaS codebase. Run a profile locally with:

```bash
DEMO_PROFILE=flaky pnpm dev
```

## Suites

Each folder in [`suites/`](suites) is a self-contained Playwright suite and a pnpm workspace package, with its own `package.json` and `playwright.config.ts`. Endform identifies a suite by the folder of its `package.json`, so each folder is its own Endform suite. `pnpm install` at the root installs them all.

| Suite                                                   | Tests | App     | What it shows                                                                                                                                                                      |
| ------------------------------------------------------- | ----: | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-base-setup`](suites/01-base-setup)                 |     1 | `clean` | A minimal config and one smoke test: sign up and land on an empty office.                                                                                                          |
| [`02-first-10-tests`](suites/02-first-10-tests)         |    10 | `clean` | Ten tests across user management and auth, fleet management, and bookability, using a programmatic user fixture so only the two auth tests go through the sign-up or sign-in UI.   |
| [`03-scaled-suite`](suites/03-scaled-suite)             |   103 | `clean` | Every signed-in test starts from its own user (`testWithNewUser`) and adds only the bikes and teammates it needs through `fleet` and `team` fixtures, plus request-only API tests. |
| [`04a-speed-unoptimized`](suites/04a-speed-unoptimized) |    20 | `slow`  | Every test signs up through the UI and reads the Fleet API key off the page, and files run serially.                                                                               |
| [`04b-speed-optimized`](suites/04b-speed-optimized)     |    20 | `slow`  | The same tests, fully parallel, with users and bike fleets from the API, and a concurrency limit for payment tests in `endform.config.ts`.                                         |
| [`05-flake-lab`](suites/05-flake-lab)                   |    12 | `flaky` | Tests written as natural-language steps. Six are robust; six flake from the flaky app or from common flaky patterns in the test code.                                              |

Run a suite against your local app:

```bash
cd suites/03-scaled-suite
BASE_URL=http://localhost:3000 npx playwright test
```

Or on Endform:

```bash
cd suites/03-scaled-suite
BASE_URL=http://localhost:3000 npx endform@latest test
```

Without `BASE_URL`, each suite runs against the deployment of its profile.

Writing the scaled suite turned up five real bugs in the starter app. They are written up, with the tests that caught them and the fixes, in [`docs/bugs-found-by-e2e-tests`](docs/bugs-found-by-e2e-tests).

## Scenarios

Each patch in [`scenarios/`](scenarios) is kept open as a demo pull request on a `demo/<name>` branch. The [scenario workflow](.github/workflows/scenarios.yml) recreates each branch from `main` twice a week, so the patches never go stale. It pushes as the `endform-guides-scenarios` GitHub App, so each push runs the scaled suite through the normal [pull request workflow](.github/workflows/pull-requests.yml) and the result shows on the pull request.

- `checkout-regression`: a refactor that breaks every checkout. The scaled suite's upgrade tests fail.
- `pricing-flow-change`: renames the Plus plan to Pro at $15, updating the tests with it. The suite passes with changed tests.

To update a patch, apply it, make the change, and write the diff back:

```bash
git apply scenarios/checkout-regression.patch
# ...edit...
git diff > scenarios/checkout-regression.patch
git checkout .
```

## Deployments and demo organizations

| Vercel project                    | `DEMO_PROFILE` | Suites                       | Endform organization |
| --------------------------------- | -------------- | ---------------------------- | -------------------- |
| `endform-playwright-guides`       | `clean`        | 01, 02, 03 and pull requests | Flagship             |
| `endform-playwright-guides-slow`  | `slow`         | 04a, 04b                     | Flagship             |
| `endform-playwright-guides-flaky` | `flaky`        | 05                           | Flake Lab            |

The workflows in [`.github/workflows`](.github/workflows) keep the public demo organizations' runs fresh:

- [`suites-on-main.yml`](.github/workflows/suites-on-main.yml): suites 01 to 04b, on every push to `main` and daily.
- [`flake-lab.yml`](.github/workflows/flake-lab.yml): the flake lab, every 6 hours. Its failures don't fail the workflow.
- [`pull-requests.yml`](.github/workflows/pull-requests.yml): the scaled suite against each pull request's preview.
- [`scenarios.yml`](.github/workflows/scenarios.yml): refreshes the scenario pull requests.

Each suite reports to its demo organization with that organization's API key, not through the repository's Endform connection: a repository can only belong to one Endform organization, and the demo suites report to two. The workflows wait for Vercel's commit status for the deployment, then test the project's production domain on `main` or its branch URL elsewhere. They need these repository secrets:

- `ENDFORM_FLAGSHIP_API_KEY`: an API key of the Flagship organization, for the clean and slow suites.
- `ENDFORM_FLAKE_LAB_API_KEY`: an API key of the Flake Lab organization, for the flake lab.
- `SCENARIOS_APP_PRIVATE_KEY` (and the `SCENARIOS_APP_ID` variable): the GitHub App the scenario workflow pushes as. It needs read and write access to contents and pull requests on this repository.
- `VERCEL_AUTOMATION_BYPASS_SECRET`: the clean project's Vercel protection bypass for automation, so pull request runs can open preview deployments.

## Environment variables

All of these are optional:

| Variable              | Purpose                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEMO_PROFILE`        | `clean` (default), `slow` or `flaky`.                                                                                                                     |
| `DATABASE_URL`        | Unset: the shared Durable Object proxy. Otherwise a local SQLite path, a proxy URL (a path such as `/flaky` selects a separate database), or a Turso URL. |
| `DATABASE_AUTH_TOKEN` | Required when `DATABASE_URL` is a Turso URL.                                                                                                              |
| `AUTH_SECRET`         | Falls back to a built-in demo secret. Set it to a random string (`openssl rand -base64 32`) for any non-demo deployment.                                  |
| `BASE_URL`            | The app's public URL.                                                                                                                                     |

## About the app

The app is based on the [Next.js SaaS Starter](https://github.com/nextjs/saas-starter), modified to use SQLite instead of Postgres and a dummy payment system instead of Stripe. The checkout accepts any 8-digit card number (e.g. `12345678`), any future MM/YY expiry, and any 3-digit CVV, and never processes real payments.

Tech stack: [Next.js](https://nextjs.org/), [Drizzle](https://orm.drizzle.team/), SQLite (via a Cloudflare Durable Object, a local file, or [Turso](https://turso.tech/)), and [shadcn/ui](https://ui.shadcn.com/).
