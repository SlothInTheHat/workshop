# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build production bundle
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run check:watch  # Type-check in watch mode
npm run lint         # Prettier check + ESLint
npm run format       # Auto-format with Prettier
```

There is no test suite configured.

## Architecture

This is a **SvelteKit** app for Optura Workshop management. It uses:
- **Svelte 5** with TypeScript strict mode
- **Tailwind CSS** via `@tailwindcss/vite`
- **Drizzle ORM** with PostgreSQL for data persistence
- **`@optura-ai/agent-ui-kit`** — internal component library providing `Button`, `Toaster`, theme utilities

## Database Setup

The app supports both database-connected and standalone modes:

### With Database (Recommended)

```bash
DATABASE_URL=postgresql://user@localhost:5432/optura pnpm dev
```

Database connection is initialized lazily in `src/hooks.server.ts` using `initDb()` from `src/lib/db/index.ts`. This ensures `DATABASE_URL` is read from `$env/static/private` in a server context where environment variables are available.

### Without Database (Fallback)

The app runs without a database using static access codes:
- Facilitator code: `FAC123`
- Contributor code: `CON123`
- Default workshop ID: `workshop-1`

When database operations fail or `getDb()` returns `null`, the app gracefully falls back to mock data.

## Session Management

Sessions are cookie-based (see `src/lib/session.ts`):

```typescript
interface PreWorkshopSession {
  name: string;
  role: 'facilitator' | 'contributor';
  tenantId: string;
  workshopId?: string;
  facilitatorCode?: string;  // Generated codes stored in session
  contributorCode?: string;
}
```

Access codes are generated using `generateCode(prefix)` from `src/lib/codes.ts` (e.g., `FAC-X3N4PQ`, `CON-H7K2YR`).

## Workshop Flow

### 1. Create Workshop (`/workshops/new`)

**Flow:**
1. Enter facilitator name
2. Generate and display access codes (FAC-XXXXXX, CON-XXXXXX)
3. Complete 3-step wizard:
   - Step 1: Context (title, focus area, objective, data sensitivity)
   - Step 2: Participants (optional)
   - Step 3: Review & generate AI kickoff summary
4. Success screen shows codes again

**Key files:**
- `src/routes/workshops/new/+page.server.ts` — generates codes and stores in session
- `src/routes/workshops/new/+page.svelte` — wizard UI with codes display
- `src/routes/api/workshops/+server.ts` — creates workshop using codes from session

### 2. Join Workshop (`/join`)

**Flow:**
1. Enter name and access code
2. Route based on code and role:
   - **Contributors**: Always → `/workshops/[id]/contributor` (input form)
   - **Facilitators**: Route by workshop status:
     - `pre`/`draft` → `/workshops/[id]/pre`
     - `live` → `/workshop/[id]/live`
     - `completed` → `/workshops/[id]/post`

**Static code fallback:**
- `FAC123` → `/workshops/workshop-1/pre`
- `CON123` → `/workshops/workshop-1/contributor`

**Key file:**
- `src/routes/join/+page.server.ts` — queries database, falls back to static codes

### 3. Pre-Workshop Phase

**Facilitator view** (`/workshops/[id]/pre`):
- Dashboard showing participants and submission status
- Activity log and artifacts
- Can launch workshop to live phase

**Contributor view** (`/workshops/[id]/contributor`):
- Input form for submitting pre-workshop contributions
- View workshop context and objectives

**Key files:**
- `src/routes/workshops/[id]/pre/+page.server.ts` — facilitator dashboard data
- `src/routes/workshops/[id]/contributor/+page.server.ts` — contributor input form data

Both pages gracefully handle `getDb() === null` by returning mock data.

## Live Workshop Backend

### Data model (`src/lib/workshop/`)

| File | Purpose |
|---|---|
| `types.ts` | All TypeScript interfaces: `Workshop`, `BreakoutTeam`, `Participant`, `UseCase`, `Insight`, `WorkshopEvent` |
| `store.ts` | In-memory singleton Maps + all mutation functions. Seeded with one workshop (`workshop-1`) and sample data on startup. |

Key design decisions:
- Every `UseCase` created simultaneously writes an `Insight` record — they share an `insightId` and stay in sync on updates/deletes.
- Cross-team overlap is detected automatically on `createUseCase` by keyword matching against existing titles from other teams.
- All mutations call `broadcast()` which fans out a `WorkshopEvent` to all active SSE subscribers for that workshop.

### API routes (`src/routes/api/workshop/[workshopId]/`)

| Route | Methods | Purpose |
|---|---|---|
| `/` | `GET` | Workshop + teams + participants + use case count |
| `/teams` | `GET POST` | List / create breakout teams |
| `/teams/[teamId]` | `GET PATCH DELETE` | Get / rename / delete a team |
| `/teams/[teamId]/members` | `POST DELETE` | Add / remove a participant from a team |
| `/usecases` | `GET POST` | List (with `?teamId=` filter) / submit a use case (auto-populates insights) |
| `/usecases/[usecaseId]` | `GET PATCH DELETE` | Get / update / delete a use case (insight kept in sync) |
| `/usecases/[usecaseId]/upvote` | `POST` | Upvote once per `participantId`; syncs insight upvote count |
| `/insights` | `GET` | List insights; supports `?teamId=` and `?sortBy=upvotes` |
| `/insights/generate` | `POST` | Cluster all use cases by theme, detect cross-team overlap, tag insights, broadcast `insight_generated` |
| `/stream` | `GET` | SSE stream; sends all `WorkshopEvent`s in real time + 15 s heartbeat |

### Real-time (SSE)

Connect to `GET /api/workshop/:workshopId/stream`. Each event is a JSON-encoded `WorkshopEvent`:

```json
{ "type": "usecase_added", "workshopId": "workshop-1", "data": {...}, "timestamp": "..." }
```

Event types: `usecase_added | usecase_updated | usecase_upvoted | usecase_deleted | team_created | team_updated | team_deleted | insight_generated`

### Terminology (from design spec)
Use **Value** (not Impact) and **Viability** (not Feasibility) everywhere in data and UI.

## Database Schema

Key tables (see `src/lib/db/schema.ts`):

- `pre_workshops` — Workshop metadata, status, codes
- `pre_participants` — Participants and their roles
- `contributor_inputs` — Pre-workshop submissions
- `artifacts` — Generated documents and assets
- `activity_logs` — Audit trail
- `workshops` — Live workshop data
- `participants` — Live workshop participants

## Error Handling

All database operations include null checks:

```typescript
const db = getDb();
if (!db) {
  return { /* mock data */ };
}
// ... database operations
```

API routes wrap database inserts in try-catch blocks and fall back to static responses on error.

## Private registry

`@optura-ai/*` packages are served from GitHub npm registry. Requires `NPM_TOKEN` env var (configured in `.npmrc`). For Docker builds, pass `--build-arg NPM_TOKEN=...` or `GITHUB_TOKEN`.

## Deployment

Production builds use `@sveltejs/adapter-node` (outputs to `/build`). The Dockerfile does a multi-stage build and runs as a nonroot user on Chainguard Wolfi. `docker-compose.yml` maps port 3001 → 3000. `dev.yaml` configures the Optura dev platform (Kubernetes/Helm, port 5173).
