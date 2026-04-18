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

When database operations fail or `getDb()` returns `null`, the app gracefully falls back to mock data or in-memory storage.

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

## Workshop Lifecycle

The workshop has three distinct phases:

### 1. Pre-Workshop Phase

**Purpose:** Collect context, define objectives, and gather participant inputs before the live workshop.

#### Create Workshop (`/workshops/new`)

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

**Database tables:**
- `pre_workshops` — Workshop metadata, status, codes
- `pre_participants` — Participants and their roles

#### Join Workshop (`/join`)

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

#### Pre-Workshop Views

**Facilitator view** (`/workshops/[id]/pre`):
- Dashboard showing participants and submission status
- Activity log and artifacts
- Can launch workshop to live phase

**Contributor view** (`/workshops/[id]/contributor`):
- Input form for submitting pre-workshop contributions
- View workshop context and objectives
- Auto-creates participant record on first visit

**Key files:**
- `src/routes/workshops/[id]/pre/+page.server.ts` — facilitator dashboard data
- `src/routes/workshops/[id]/contributor/+page.server.ts` — contributor input form data

**Database tables:**
- `contributor_inputs` — Pre-workshop submissions with status tracking
- `artifacts` — Generated documents and assets
- `activity_logs` — Audit trail

Both pages gracefully handle `getDb() === null` by returning mock data.

### 2. Live Workshop Phase

**Purpose:** Facilitate real-time collaborative ideation with breakout teams, use case submission, and cross-team insights.

#### Data Model (`src/lib/workshop/`)

| File | Purpose |
|---|---|
| `types.ts` | All TypeScript interfaces: `Workshop`, `BreakoutTeam`, `Participant`, `UseCase`, `Insight`, `WorkshopEvent` |
| `store.ts` | In-memory singleton Maps + all mutation functions. Seeded with one workshop (`workshop-1`) and sample data on startup. |

**Key design decisions:**
- Every `UseCase` created simultaneously writes an `Insight` record — they share an `insightId` and stay in sync on updates/deletes.
- Cross-team overlap is detected automatically on `createUseCase` by keyword matching against existing titles from other teams.
- All mutations call `broadcast()` which fans out a `WorkshopEvent` to all active SSE subscribers for that workshop.
- Supports both database mode and in-memory fallback.

#### API Routes (`src/routes/api/workshop/[workshopId]/`)

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
| `/stackrank` | `GET` | Calculate and return ranked use cases with final scores |

**Database tables (if connected):**
- `workshops` — Live workshop data
- `participants` — Live workshop participants
- `teams` — Breakout teams
- `use_cases` — Submitted use cases with value/viability/visibility
- `insights` — AI-generated insights and themes
- `scores` — Participant scoring data (impact, feasibility, alignment, executive weight)

#### Real-time (SSE)

Connect to `GET /api/workshop/:workshopId/stream`. Each event is a JSON-encoded `WorkshopEvent`:

```json
{ "type": "usecase_added", "workshopId": "workshop-1", "data": {...}, "timestamp": "..." }
```

Event types: `usecase_added | usecase_updated | usecase_upvoted | usecase_deleted | team_created | team_updated | team_deleted | insight_generated`

#### Terminology (from design spec)

Use **Value** (not Impact) and **Viability** (not Feasibility) everywhere in data and UI.

### 3. Post-Workshop Phase

**Purpose:** Review workshop outcomes, generate AI summaries, analyze ranked use cases, and export artifacts.

#### Post-Workshop Views

**Facilitator view** (`/workshops/[workshopId]/post`):
- Workshop summary with AI-generated insights
- Stack-ranked use cases with final scores
- Generate comprehensive summary using Claude
- Export and share workshop outcomes

**Contributor view** (`/workshops/[workshopId]/post/contributor`):
- Read-only view of workshop results
- See all use cases and teams
- View final rankings and insights

**Key files:**
- `src/routes/workshops/[workshopId]/post/+page.server.ts` — facilitator post-workshop data
- `src/routes/workshops/[workshopId]/post/contributor/+page.server.ts` — contributor post-workshop data

#### AI Summary Generation

**Endpoint:** `POST /api/workshop/[workshopId]/summary`

**Requirements:**
- `ANTHROPIC_API_KEY` environment variable must be configured
- Workshop must have at least one use case
- Uses Claude Sonnet 4.5 model

**Summary structure:**
```typescript
{
  overview: string;                    // 2-3 sentence executive summary
  keyBottlenecks: string;              // Main bottlenecks identified
  aiSuggestedThemes: string;           // Comma-separated list of 3-5 themes
  crossWorkshopSignals: string;        // Enterprise-wide patterns
  recommendedFocusAreas: string;       // Top 3-5 prioritized recommendations
  fullSummary: string;                 // Complete narrative (4-5 paragraphs)
  perUseCaseInsights: Array<{
    useCaseId: string;
    whyItMatters: string;              // Business impact explanation
  }>;
}
```

**Key file:**
- `src/routes/api/workshop/[workshopId]/summary/+server.ts` — AI summary generation

**Database table:**
- `workshop_summaries` — Stores generated summaries with structured content

#### Stack Ranking

**Endpoint:** `GET /api/workshop/[workshopId]/stackrank`

**Ranking formula:**
```typescript
finalScore = impactAvg * feasibilityAvg + 2 * upvotes + executiveWeightAvg
```

**Returned data:**
```typescript
{
  ...useCase,
  finalScore: number;
  impactAvg: number;
  feasibilityAvg: number;
  alignmentAvg: number;
  executiveWeightAvg: number;
  scoreCount: number;
}
```

**Key file:**
- `src/routes/api/workshop/[workshopId]/stackrank/+server.ts` — Stack ranking calculation

## Database Schema

Key tables (see `src/lib/db/schema.ts`):

### Pre-Workshop Tables
- `pre_workshops` — Workshop metadata, status, facilitator/contributor codes
- `pre_participants` — Participants and their roles
- `contributor_inputs` — Pre-workshop submissions with completion status
- `artifacts` — Generated documents and assets with visibility control
- `activity_logs` — Audit trail for workshop activities

### Live Workshop Tables
- `workshops` — Live workshop data (title, client, objectives, strategic pillars)
- `participants` — Live workshop participants
- `teams` — Breakout teams
- `use_cases` — Submitted use cases with value/viability/visibility metrics
- `insights` — AI-generated insights and themes
- `scores` — Multi-dimensional scoring (impact, feasibility, alignment, executive weight)

### Post-Workshop Tables
- `workshop_summaries` — AI-generated comprehensive summaries with structured insights

## Error Handling

All database operations include null checks:

```typescript
const db = getDb();
if (!db) {
  return { /* mock data */ };
}
// ... database operations
```

API routes wrap database inserts in try-catch blocks and fall back to:
- **Pre-workshop**: Static responses with mock workshop data
- **Live workshop**: In-memory storage (`src/lib/workshop/store.ts`)
- **Post-workshop**: In-memory summary generation and storage

## Private registry

`@optura-ai/*` packages are served from GitHub npm registry. Requires `NPM_TOKEN` env var (configured in `.npmrc`). For Docker builds, pass `--build-arg NPM_TOKEN=...` or `GITHUB_TOKEN`.

## Deployment

Production builds use `@sveltejs/adapter-node` (outputs to `/build`). The Dockerfile does a multi-stage build and runs as a nonroot user on Chainguard Wolfi. `docker-compose.yml` maps port 3001 → 3000. `dev.yaml` configures the Optura dev platform (Kubernetes/Helm, port 5173).
