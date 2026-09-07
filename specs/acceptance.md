# FinTrackr MVP Acceptance Scenarios

Status: Accepted for implementation  
Version: 1.0.0

Each scenario must be automated at the lowest level that proves the behavior.
The primary user journey must also pass as a browser-level Playwright test.

## Authentication

### Register and sign in

Given no user exists for `alex@example.com`, when Alex registers with valid
details, then the API creates one user and returns an access token. When Alex
uses those credentials to sign in, the profile endpoint returns Alex without a
password field.

### Reject invalid authentication

Missing, malformed, expired, or incorrectly signed credentials receive `401`
and do not execute protected business logic.

## Ownership

### Isolate user data

Given Alex and Sam each own an account and transaction, when Alex supplies
Sam's valid resource UUID to a read, update, or delete endpoint, then the API
returns `404` and Sam's data remains unchanged.

## Transaction workflow

### Manage a transaction

Given Alex owns an active checking account and an expense category, when Alex
creates a `42.50` expense, then it appears in transaction history and reduces
the calculated balance by `42.50`. Updating it to `40.00` changes the balance by
exactly `2.50`; deleting it restores the original balance.

### Paginate deterministically

Given more transactions exist than the requested page size, consecutive cursor
requests return each transaction exactly once in descending `(date, id)` order.

## Budgets and dashboard

### Calculate monthly financials

Given a known set of completed income and expense transactions, the dashboard
returns the exact total balance, monthly income, monthly expenses, net income,
category spending, and budget utilization for the requested UTC month. Pending
and cancelled transactions do not affect completed totals. Total balance is an
as-of value that includes completed transactions before the requested month's
exclusive end. Monthly trends contain six UTC months ending with the requested
month and include zero-valued months.

## CSV import

### Import valid and invalid rows

Given a CSV containing valid rows and malformed rows, the import creates only
valid transactions and returns accepted and rejected counts with row-level
validation reasons.

### Retry safely

Given an import completed for an idempotency key, retrying the same request with
that key returns the original result and creates zero additional transactions.

## Deployment

### Release a healthy revision

Given `main` passes specification, type, test, coverage, and build checks, the
pipeline applies migrations, deploys immutable frontend and API artifacts, and
verifies health, readiness, authentication, and frontend availability. A failed
smoke check does not receive production traffic.
