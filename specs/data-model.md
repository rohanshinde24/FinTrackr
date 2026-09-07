# FinTrackr Data Model Specification

Status: Accepted for implementation  
Version: 1.0.0

## Relationships

```text
User 1---* Account 1---* Transaction *---0..1 Category
  |                         |
  +---* Category            +---* ImportBatch
  |
  +---* Budget *---1 Category
```

All user-owned foreign keys are indexed. Deleting a user removes dependent
portfolio data inside a database transaction. Deleting an account with existing
transactions is rejected. Deleting a referenced category archives it rather
than invalidating transaction history.

## Entities

### User

- `id`: UUID primary key
- `email`: normalized unique email
- `passwordHash`: bcrypt hash
- `firstName`, `lastName`
- `role`: `USER | ADMIN | SUPER_ADMIN`
- `defaultCurrency`: ISO 4217 code; `USD` by default
- timestamps

### Account

- `id`, `userId`
- `name`, optional institution
- `type`: `CHECKING | SAVINGS | CREDIT_CARD | INVESTMENT | LOAN | OTHER`
- `openingBalance`: `numeric(15,2)`
- `currency`
- `status`: `ACTIVE | INACTIVE | CLOSED`
- timestamps

Current balance is `openingBalance + income - expense` for completed
transactions. Transfers are excluded from the MVP.

### Category

- `id`, `userId`
- `name`
- `type`: `INCOME | EXPENSE`
- presentation metadata and archive timestamp
- timestamps

`(userId, type, lower(name))` is unique among active categories.

### Transaction

- `id`, `userId`, `accountId`, optional `categoryId`
- `description`
- `type`: `INCOME | EXPENSE`
- `status`: `PENDING | COMPLETED | CANCELLED`
- positive `amount`: `numeric(15,2)`
- transaction date, optional notes, timestamps
- optional `importBatchId` and deterministic `importFingerprint`

Indexes support `(userId, date, id)`, `(accountId, date, id)`, and
`(userId, categoryId, date)`. An optional unique import fingerprint prevents a
retried import from creating duplicate user transactions.

### Budget

- `id`, `userId`, `categoryId`
- `name`
- positive limit amount
- month represented by an inclusive UTC start and exclusive UTC end
- warning threshold
- timestamps

Spent and remaining amounts are query results, not mutable stored fields.

### ImportBatch

- `id`, `userId`, idempotency key
- original filename and status
- accepted, rejected, and duplicate counts
- start/completion timestamps and sanitized error summary

`(userId, idempotencyKey)` is unique.

## Cross-entity invariants

- Related entities must share the same `userId`.
- A budget category must be an expense category.
- A transaction category type must match its transaction type.
- An inactive or closed account cannot receive new transactions.
- API money values are decimal strings with at most two fractional digits.

