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

## Architecture

This is a **SvelteKit** app scaffolded from the Optura `opx` scaffold. It uses:
- **Svelte 5** with TypeScript strict mode
- **Tailwind CSS** via `@tailwindcss/vite`
- **`@optura-ai/agent-ui-kit`** — internal component library providing `Button`, `Toaster`, theme utilities, and `createAuthHandle()` for auth

### Request lifecycle

1. `hooks.server.ts` — runs `createAuthHandle()` from agent-ui-kit on every request; populates `locals.user` (AuthUser) and `locals.accessToken` (string)
2. `src/routes/+layout.server.ts` — passes authenticated user data to the layout
3. `src/routes/+layout.svelte` — root layout; initializes dark/light theme on mount, renders header and `<Toaster>`
4. Route pages/endpoints handle business logic from there

### Routes

- `/` — home page (`+page.svelte`)
- `/api/health` — health check (`GET` returns `{status: 'ok'}`)
- Error boundary: `+error.svelte`

### Private registry

`@optura-ai/*` packages are served from GitHub npm registry. Requires `NPM_TOKEN` env var (configured in `.npmrc`). For Docker builds, pass `--build-arg NPM_TOKEN=...` or `GITHUB_TOKEN`.

### Deployment

Production builds use `@sveltejs/adapter-node` (outputs to `/build`). The Dockerfile does a multi-stage build and runs as a nonroot user on Chainguard Wolfi. `docker-compose.yml` maps port 3001 → 3000. `dev.yaml` configures the Optura dev platform (Kubernetes/Helm, port 5173).
