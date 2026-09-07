# FinTrackr

FinTrackr is a portfolio-grade personal finance application for managing
accounts, income, expenses, categories, and monthly budgets. It is being built
contract-first as a modular monolith: a React/Vite client, a Node.js/Express
API, and PostgreSQL as the system of record.

The repository is under active implementation. The specifications describe the
accepted MVP; the status table below distinguishes implemented behavior from
planned behavior.

## Current status

| Capability | Status | Evidence |
| --- | --- | --- |
| Product, architecture, data, and acceptance specs | Complete | [`specs/`](specs) |
| OpenAPI 3.1 contract and linting | Complete | [`specs/openapi.yaml`](specs/openapi.yaml) |
| Node 22 runtime and production API image | Complete | [`.nvmrc`](.nvmrc), [`backend/Dockerfile`](backend/Dockerfile) |
| Versioned API, health, readiness, and graceful shutdown | Complete | [`backend/src/app.ts`](backend/src/app.ts) |
| Registration, login, profile, and correlated auth errors | Complete | PostgreSQL integration tests |
| Versioned PostgreSQL schema migrations | Complete | [`backend/src/migrations/`](backend/src/migrations) |
| Authenticated React shell and live dashboard | Complete | Sign-up, sign-in, session restoration, logout, and real finance metrics are covered by 31 tests |
| Account, category, transaction, and budget APIs | Complete | PostgreSQL integration tests cover CRUD, invariants, and tenant isolation |
| Calculated dashboard analytics | Complete | Reconciliation test covers balances, cash flow, categories, budgets, and trends |
| Account, transaction, and budget management UI workflows | Not implemented | The live dashboard links to honest placeholders for the next frontend slice |
| Idempotent streaming CSV import and 100K benchmark | Not implemented | Planned after transaction workflow |
| Cloud Run, Firebase Hosting, and Neon release workflow | Not configured | CI gates are ready; cloud resources and credentials remain |

Current measured coverage is 77.07% statements for the backend and 98.32%
statements for the frontend. CI enforces the backend baseline so it cannot
silently regress. The backend target remains at least 90% meaningful coverage
after the remaining import and operational behavior is implemented.

## Architecture

```text
Browser
  +-- React/Vite static application -- Firebase Hosting
  +-- HTTPS /api/v1 ----------------- Express API on Cloud Run
                                             |
                                             +-- PostgreSQL on Neon
```

The backend is a modular monolith. HTTP routes own transport concerns,
services own business rules, and TypeORM owns persistence. Every user-owned
query must derive `userId` from the verified bearer token; a client-supplied
owner ID is never trusted.

Balances, spending totals, and budget progress are derived from completed
transactions. They are not independently mutable values. Money is stored as
`numeric(15,2)` and returned as decimal strings, avoiding binary floating-point
rounding in the API contract.

See [`specs/architecture.md`](specs/architecture.md) and
[`specs/data-model.md`](specs/data-model.md) for the decisions and invariants.

## Local development

Prerequisites:

- Node.js 22
- Docker Desktop with Compose, or PostgreSQL 16 for a manual setup

Start the complete local stack:

```bash
docker compose up --build
```

Compose waits for PostgreSQL, applies pending migrations, then starts the API
and Vite development servers:

- frontend: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- liveness: `http://localhost:3001/health`
- readiness: `http://localhost:3001/ready`

For a manual setup, create `backend/.env` from the example and provide a local
PostgreSQL database:

```bash
cd backend
cp .env.example .env
npm ci
npm run db:migrate
npm run dev
```

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

## Verification

Backend checks require a disposable PostgreSQL database configured through the
`DB_*` variables:

```bash
cd backend
npm run lint:openapi
npm run typecheck
npm run db:migrate
npm run test:coverage
npm run build
```

Frontend checks are self-contained:

```bash
cd frontend
npm run typecheck
npm run test:coverage
npm run build
```

GitHub Actions runs these checks on pull requests and additionally builds the
production API image. Production dependency audits fail on high or critical
advisories.

## Spec-driven workflow

Each feature follows the same reviewable sequence:

1. Confirm the business rule in `specs/product.md` or `specs/data-model.md`.
2. Update the OpenAPI contract before changing HTTP behavior.
3. Add or refine an acceptance scenario.
4. Write a failing test against the real application boundary.
5. Implement the smallest route/service/persistence change that passes it.
6. Run type, test, migration, build, and audit checks.
7. Commit one measurable concern with a Conventional Commit message.

This sequence makes interview explanations concrete: the contract defines what
clients may rely on, acceptance tests prove behavior, migrations make schema
changes repeatable, and small commits show how risk was controlled.

## Deployment target

The intended low-cost production-shaped deployment is:

- Firebase Hosting for the immutable frontend bundle
- Google Cloud Run for the containerized API
- Neon PostgreSQL for managed persistence
- GitHub Actions with Google Cloud Workload Identity Federation instead of
  long-lived cloud keys

Deployment is not yet enabled. Before calling the application production-ready,
the repository still needs the remaining finance-management UI workflows, the import and
100K-transaction benchmark, cloud infrastructure configuration, secret-store
wiring, a migration release job, and post-deploy smoke checks.

## API conventions

- All public endpoints are under `/api/v1`.
- Protected routes require `Authorization: Bearer <token>`.
- Errors use a stable envelope with `code`, `message`, and `requestId`.
- Collection endpoints use deterministic cursor pagination.
- `/health` checks process liveness; `/ready` checks PostgreSQL connectivity.

The executable contract is [`specs/openapi.yaml`](specs/openapi.yaml).
