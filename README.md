# Campus Quest backend

Next.js 16 + TypeScript, Tiger Data/PostgreSQL, Auth0 sessions, and Gemini photo evidence checks.

## Run locally

```powershell
npm install
npm run dev
```

Open http://localhost:3000. `GET /api/health` checks database connectivity. The app routes require an Auth0 session; missing auth configuration returns `503 AUTH_NOT_CONFIGURED`, and signed-out callers get `401 UNAUTHENTICATED` once configured. There is no authentication bypass.

Use `.env.example` as the variable checklist. Keep real values in `.env.local`, which Git ignores. Do not overwrite an existing `.env.local` when copying examples.

### Auth0 setup (Emmanuel)

Create an Auth0 **Regular Web Application** and set these server-only values:

- `AUTH0_DOMAIN`: the tenant hostname, without `https://`.
- `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`: application's settings.
- `AUTH0_SECRET`: 64 random hexadecimal characters for session encryption (already generated locally).
- `APP_BASE_URL`: `http://localhost:3000` locally; deployed HTTPS origin in production.

Register `http://localhost:3000/auth/callback` in Allowed Callback URLs, and `http://localhost:3000` in Allowed Logout URLs and Allowed Web Origins. Register the deployed equivalents before deploying. [Official Auth0 setup](https://auth0.com/docs/quickstart/webapp/nextjs).

Link sign-in to `/auth/login` and sign-out to `/auth/logout`. After sign-in call `getMe()` from `lib/api.ts`: it creates/loads the UUID player using the verified Auth0 subject and grants an unplaced starter house. Pass `me.id` to the other components. University selection is self-reported for the demo, not verification of enrollment or eRaider affiliation. `updatePlayerProfile` saves name, university, major and character.

### Gemini + GPS

Set `GEMINI_API_KEY`; optionally set `GEMINI_MODEL` (default `gemini-3.5-flash`). The key is used only on the server. Campus quests complete with **device GPS near the campus pin** plus a photo Gemini can match to that place — no QR codes. The seed `Workout Evidence` quest also requires a server-timed hour before accepting a photo. For a short live demo, lower that quest's `minimum_duration_seconds` in the DB and explain the demo setting; the API cannot override it. Off-campus local testing only: set `GEO_CHECK_DISABLED=true`.

### Open-world tutorial

Set `NEXT_PUBLIC_TUTORIAL_ENABLED=true` to show the first-visit walkthrough starting in `/dashboard/world` (move, build, place, inspect), then Quests, Shop, Friends (visit Victor), Rankings, and Profile. Targets glow with a “Click …” cue; Build scales up so it is hard to miss. Progress is stored in `sessionStorage` / completion in `localStorage`; force a replay with the **Replay tutorial** button in the dashboard top bar or with `?tutorial=1` (middleware carries that flag through Auth0 login in a short-lived cookie). Voice is off by default — later toggle `NEXT_PUBLIC_TUTORIAL_VOICE` plus server-only `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` (static script lines in `lib/tutorial.ts`).

Supported photos are JPEG, PNG, WebP, at most 3 MB, sent as raw base64 (without a data-URL prefix) together with `{ latitude, longitude, accuracyMeters? }`. Images are passed to Gemini and are not stored by this app. The database retains a SHA-256 hash, verification result, and attempt metadata. Exact photo reuse by one player is blocked; edited images are not reliably detected. A photo supports scene relevance, not proof of identity or elapsed activity. GPS must fall within the configured campus radius with accuracy ≤120m. [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output).

Provider outages return a retryable 503 with no rewards. A rejected attempt is terminal; start a new attempt with new evidence. Ten verifier calls per player per hour and thirty new attempts per hour limit demo usage. Expired verification leases can be retried after 90 seconds. Limits are stored in PostgreSQL and work across app instances.

## Database migrations

```powershell
npm run db:migrate
```

For the existing, reviewed Claude schema only, the initial adoption command is `npm run db:migrate -- --baseline`. On a fresh empty database no baseline flag is needed. The migrator locks migrations, applies each in a transaction, and records checksums; don't edit already-applied migrations. Baseline adoption checks expected column presence, not every constraint: inspect the existing schema before adopting.

- `001_core.sql`: original six-table schema and canonical seeds, with an imported stray character corrected.
- `002_integrity.sql`: auth mapping, balance checks, attempts, period claims, placement/friend constraints, timestamp triggers, photo quest.
- `003_quest_hypertable.sql`: converts the event log to a TimescaleDB hypertable with a composite `(id, completed_at)` primary key. Duplicate reward enforcement lives in the regular `quest_claims` table.
- `004_photo_geofence.sql`: attaches `Workout Evidence` to `REC_CENTER` so GPS and Gemini both target the Rec Center.
- `005_photo_location_only.sql`: converts seeded campus quests from QR to GPS + photo (`PHOTO_AI`).

Daily periods reset at midnight America/Chicago. Weekly leaderboard periods start Monday at midnight in that timezone. XP is cumulative; level n starts at `50*n*(n-1)` XP. Each successful quest increments its category stat by one. Coins are spendable and never affect rank. Repeatable photo quests require an explicit attempt; retrying a completed attempt returns its original receipt. Receipts contain balances at the original completion; refresh `getMe()` for the current balance after later actions.

### TLS

The current development database presents a Timescale private CA chain. `certs/tiger-ca.pem` pins the CA observed directly from that service on 2026-09-12, following the certificate-chain collection workflow in [Tiger Data's TLS guide](https://docs.timescale.com/use-timescale/latest/security/strict-ssl/). This was a first-use pin, not independent CA identity verification. Its validity ends 2027-10-20. The local URL uses `sslmode=verify-full&sslrootcert=certs/tiger-ca.pem`; certificate and hostname checks remain enabled. Before production, verify the CA through the provider or use the service's public CA certificate. When Tiger rotates to a public CA, update the URL/trust bundle rather than disabling verification. The public certificate contains no credentials and is included in deployment tracing.

## Team integration

Import browser functions from `@/lib/api` and DTOs from `@/types/api`. See [API contract](docs/backend-api.md) for endpoint mappings, examples, and changes to Claude's original contract. Database/service modules are server code and must never be imported into client components.

World defaults: 20 by 20 grid, integer coordinates from 0 to 19, one tile per item, one owned copy per item type. Fetch `getWorldConfig()` rather than hardcoding. `WORLD_GRID_SIZE` configures the size. Objects with larger footprints or multiple copies need a coordinated contract/migration update.

## Validation

```powershell
npm run typecheck
npm test
npm run test:integration
npm run build
```

Integration tests need a development Tiger database with schema-creation privileges. They create a randomly named `cq_test_<uuid>` schema, exercise real transactions and hypertables, then remove only that test schema. They use injected photo-verifier fixtures, not Gemini charges, and test identity mapping below the Auth0 boundary. Real Auth0 login and real Gemini results require configured accounts and manual end-to-end verification.

The current runtime connection is the supplied development administrator connection. Before production, provision a dedicated app role with only the necessary table/sequence permissions, retain migrations under a separate owner, and enforce an append-only event-log policy through grants. SQL migrations and API verification do not by themselves protect data from a database administrator.
