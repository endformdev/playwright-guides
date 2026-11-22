# Playwright guides example app

The example SaaS application behind [Endform](https://endform.dev)'s Playwright guides.

It is a small but realistic SaaS app (sign up, teams, invitations, a pricing and checkout flow, and an activity log) that the guides write Playwright suites against. It runs with zero setup: no database or auth environment variables are needed.

## Getting started

```bash
git clone https://github.com/endformdev/playwright-guides
cd playwright-guides
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

By default the app connects to a shared demo SQLite database through an HTTP proxy backed by a Cloudflare Durable Object (see [`cf/`](cf)). That database is public and wiped on a schedule, so it is only meant for quick starts and testing.

To use your own local SQLite file instead, create `.env` and run the migrations, then optionally seed it:

```bash
pnpm db:setup
pnpm db:seed
```

## Features

- Marketing landing page (`/`) with an animated terminal
- Pricing page (`/pricing`) with a dummy checkout flow
- Dashboard pages for managing your account and team
- Basic RBAC with Owner and Member roles
- Email/password authentication with JWTs stored in cookies
- Global middleware to protect logged-in routes, and local middleware to protect Server Actions and validate Zod schemas
- Activity logging for user events
- An internal API (`/api/internal/user`) for creating and deleting users from test setup code
- Optional OpenTelemetry tracing, enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is set

### Dummy payments

The checkout flow stores payments in the database but never processes real ones:

- **Card number**: any 8-digit number (e.g. `12345678`)
- **Expiration**: any future date in MM/YY format
- **CVV**: any 3-digit number
- **Billing address**: anything

## Tech stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [SQLite](https://www.sqlite.org/) via a shared Cloudflare Durable Object proxy by default, with optional local file SQLite and [Turso](https://turso.tech/) support
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/)

The app is based on the [Next.js SaaS Starter](https://github.com/nextjs/saas-starter), modified to use SQLite instead of Postgres and a dummy payment system instead of Stripe.

## Environment variables

All of these are optional:

| Variable              | Purpose                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Unset: the shared Durable Object proxy. Otherwise a local SQLite path, your own proxy URL, or a Turso URL (`libsql://…`). |
| `DATABASE_AUTH_TOKEN` | Required when `DATABASE_URL` is a Turso URL.                                                                              |
| `AUTH_SECRET`         | Falls back to a built-in demo secret. Set it to a random string (`openssl rand -base64 32`) for any non-demo deployment.  |
| `BASE_URL`            | The app's public URL.                                                                                                     |
