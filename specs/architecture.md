# FinTrackr Architecture Specification

Status: Accepted for implementation  
Version: 1.0.0

## System context

```text
Browser
  |
  +-- React/Vite static application -- Firebase Hosting
  |
  +-- HTTPS /api/v1 ----------------- Node.js/Express on Cloud Run
                                             |
                                             +-- PostgreSQL on Neon
```

Local development uses Docker Compose for the API and PostgreSQL. The frontend
runs through Vite with `/api` proxied to the local API.

## Architectural style

The backend is a modular monolith. Routes translate HTTP requests, services own
business rules, and repositories or TypeORM query builders own persistence.
This keeps deployment simple while preserving boundaries that can be split only
if measured scaling or ownership needs justify it.

```text
route -> validation/authentication -> service -> persistence -> PostgreSQL
```

Routes must not accept a client-provided `userId` for user-owned operations.
The authenticated identity is the sole source of ownership.

## API contract

- The versioned API prefix is `/api/v1`.
- `specs/openapi.yaml` is the public contract and precedes implementation.
- The frontend consumes types generated from the contract.
- Errors use `{ "success": false, "error": { "code", "message", "details?" } }`.
- Collection responses expose `items` and a nullable `nextCursor`.

## Data design

- PostgreSQL is the system of record.
- TypeORM migrations are authoritative; automatic schema synchronization is
  disabled outside tests.
- UUIDs are public identifiers.
- Money is stored as `numeric(15,2)` and serialized through the API as decimal
  strings to avoid binary floating-point ambiguity.
- Aggregates are calculated from transactions. Denormalized summaries require a
  measured need and a documented consistency strategy.

## Security boundaries

- Password authentication issues a signed bearer token for the MVP.
- Every user-owned query includes the authenticated user's ID.
- Role middleware protects administrative functions independently of UI access.
- Rate limits, request-size limits, CORS, and secure headers are configured at
  the API boundary.
- Runtime secrets come from the deployment secret store, never source control.

## Delivery architecture

GitHub Actions performs specification validation, type checking, tests, builds,
container publishing, database migration, deployment, and smoke verification.
GitHub authenticates to Google Cloud with short-lived OIDC credentials. Cloud
Run deployments create immutable revisions and retain an earlier healthy
revision for rollback.

## Operational behavior

- `/health` reports process liveness without requiring a database query.
- `/ready` verifies database readiness.
- The process handles termination signals, stops accepting traffic, and closes
  the database pool.
- Structured logs include timestamp, level, request ID, route, status, and
  duration.
- Deployment succeeds only after migrations and smoke checks pass.

