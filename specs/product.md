# FinTrackr MVP Product Specification

Status: Accepted for implementation  
Version: 1.0.0

## Objective

FinTrackr helps an individual record financial activity and understand current
cash flow, spending, and budget usage. The MVP is a portfolio system operated
with synthetic data; it is not a bank, payment processor, or financial adviser.

## Primary user journey

1. Register and sign in.
2. Create an account and income or expense categories.
3. Create, review, edit, filter, and delete transactions.
4. Create a monthly budget for an expense category.
5. Review balances, monthly cash flow, category spending, and budget usage.
6. Import a CSV file without creating duplicates when the same file is retried.

## MVP scope

- Email/password authentication and user profile retrieval.
- User-owned accounts, categories, transactions, and monthly budgets.
- Cursor-paginated transaction history with account, category, type, and date
  filters.
- Dashboard overview, monthly trend, category spending, and budget utilization.
- Streaming CSV import with validation, batching, and idempotency.
- OpenAPI-described HTTP API and generated frontend API types.
- Docker-based local development and automated cloud deployment.

## Explicit exclusions

- Connections to banks, brokerages, or payment networks.
- Transfers, recurring transactions, multi-currency conversion, and tax advice.
- AI-generated advice or forecasting.
- Email verification, password reset, and social login.
- Native mobile applications and microservices.
- Admin user interface. Existing admin APIs may remain but are not an MVP user
  journey.

## Product requirements

### Authentication

- Email addresses are normalized and unique.
- Passwords contain at least eight characters and are stored only as hashes.
- Protected endpoints reject missing, invalid, or expired credentials.

### Data ownership

- Every account, category, transaction, and budget belongs to exactly one user.
- An authenticated user cannot read or mutate another user's resources, even
  when supplied with a valid resource UUID.

### Financial behavior

- Transaction amounts are positive decimal values. The transaction type
  determines whether an amount contributes to income or expense.
- Account balances and budget usage are derived from transactions so stored
  summaries cannot drift from source records.
- Dashboard calculations use UTC boundaries and an explicit reporting period.

### Import behavior

- Imports accept the documented CSV schema and report accepted and rejected row
  counts.
- Rows are inserted in bounded batches.
- Repeating an import with the same idempotency key produces no duplicates.

## Non-functional requirements

- The application builds and runs on Node.js 22 LTS.
- API validation failures use a consistent error envelope.
- PostgreSQL schema changes are applied through versioned migrations.
- Logs include a request ID and never include passwords, tokens, or raw secrets.
- CI validates specifications, types, tests, coverage, and production builds.
- The performance suite uses 100,000 deterministic synthetic transactions and
  records its dataset, environment, command, and raw results.

## Success criteria

- All scenarios in `acceptance.md` pass against the deployed application.
- Backend coverage meets the configured threshold using production modules.
- A clean database can be created entirely from migrations.
- A reproducible report demonstrates 100,000-row import and analytics behavior.
- The deployment exposes a healthy frontend and API without committed secrets.

