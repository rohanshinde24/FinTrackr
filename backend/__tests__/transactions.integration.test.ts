import request from "supertest";
import "./database";
import { createApp } from "../src/app";
import { createTestAccount, createTestCategory, registerTestUser } from "./helpers";

const app = createApp();

const createTransaction = (
  token: string,
  accountId: string,
  categoryId: string,
  overrides: Record<string, unknown> = {}
) =>
  request(app)
    .post("/api/v1/transactions")
    .set("authorization", `Bearer ${token}`)
    .send({
      accountId,
      categoryId,
      description: "Groceries",
      type: "EXPENSE",
      amount: "42.50",
      date: "2026-09-01",
      ...overrides,
    });

describe("v1 transactions", () => {
  it("creates, reads, updates, and deletes a transaction with derived balances", async () => {
    const { token } = await registerTestUser(app, "transactions@example.com");
    const accountId = await createTestAccount(app, token, {
      openingBalance: "100.00",
    });
    const categoryId = await createTestCategory(app, token);

    const created = await createTransaction(token, accountId, categoryId);
    expect(created.status).toBe(201);
    expect(created.body.data.transaction).toMatchObject({
      accountId,
      categoryId,
      type: "EXPENSE",
      status: "COMPLETED",
      amount: "42.50",
      date: "2026-09-01",
    });

    const transactionId = created.body.data.transaction.id;
    const fetched = await request(app)
      .get(`/api/v1/transactions/${transactionId}`)
      .set("authorization", `Bearer ${token}`);
    expect(fetched.status).toBe(200);

    const afterCreate = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(afterCreate.body.data.account.currentBalance).toBe("57.50");

    const updated = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ amount: "40.00", notes: "Weekly shop" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.transaction).toMatchObject({
      amount: "40.00",
      notes: "Weekly shop",
    });

    const afterUpdate = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(afterUpdate.body.data.account.currentBalance).toBe("60.00");

    const deleted = await request(app)
      .delete(`/api/v1/transactions/${transactionId}`)
      .set("authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(afterDelete.body.data.account.currentBalance).toBe("100.00");
  });

  it("enforces active-account, ownership, and category-type invariants", async () => {
    const alex = await registerTestUser(app, "transaction-rules@example.com");
    const sam = await registerTestUser(app, "transaction-owner@example.com");
    const accountId = await createTestAccount(app, alex.token);
    const expenseCategoryId = await createTestCategory(app, alex.token);
    const samAccountId = await createTestAccount(app, sam.token);

    await request(app)
      .patch(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${alex.token}`)
      .send({ status: "INACTIVE" });

    const inactive = await createTransaction(alex.token, accountId, expenseCategoryId);
    expect(inactive.status).toBe(409);
    expect(inactive.body.error.code).toBe("ACCOUNT_NOT_ACTIVE");

    const otherAccount = await createTransaction(
      alex.token,
      samAccountId,
      expenseCategoryId
    );
    expect(otherAccount.status).toBe(404);
    expect(otherAccount.body.error.code).toBe("ACCOUNT_NOT_FOUND");

    const activeAccountId = await createTestAccount(app, alex.token, {
      name: "Active checking",
    });
    const mismatch = await createTransaction(
      alex.token,
      activeAccountId,
      expenseCategoryId,
      { type: "INCOME" }
    );
    expect(mismatch.status).toBe(409);
    expect(mismatch.body.error.code).toBe("CATEGORY_TYPE_MISMATCH");
  });

  it("hides another user's valid transaction UUID", async () => {
    const alex = await registerTestUser(app, "transaction-alex@example.com");
    const sam = await registerTestUser(app, "transaction-sam@example.com");
    const accountId = await createTestAccount(app, sam.token);
    const categoryId = await createTestCategory(app, sam.token);
    const created = await createTransaction(sam.token, accountId, categoryId);
    const transactionId = created.body.data.transaction.id;

    for (const operation of [
      request(app).get(`/api/v1/transactions/${transactionId}`),
      request(app).patch(`/api/v1/transactions/${transactionId}`).send({
        amount: "1.00",
      }),
      request(app).delete(`/api/v1/transactions/${transactionId}`),
    ]) {
      const response = await operation.set("authorization", `Bearer ${alex.token}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("TRANSACTION_NOT_FOUND");
    }
  });

  it("paginates deterministically and applies transaction filters", async () => {
    const { token } = await registerTestUser(app, "transaction-pages@example.com");
    const accountId = await createTestAccount(app, token);
    const expenseCategoryId = await createTestCategory(app, token);
    const incomeCategoryId = await createTestCategory(app, token, {
      name: "Salary",
      type: "INCOME",
    });

    for (const input of [
      { date: "2026-01-05", amount: "10.00" },
      {
        date: "2026-01-04",
        amount: "20.00",
        type: "INCOME",
        categoryId: incomeCategoryId,
      },
      { date: "2026-01-03", amount: "30.00" },
      { date: "2026-01-02", amount: "40.00" },
      {
        date: "2026-01-01",
        amount: "50.00",
        type: "INCOME",
        categoryId: incomeCategoryId,
      },
    ]) {
      const response = await createTransaction(
        token,
        accountId,
        (input.categoryId as string | undefined) ?? expenseCategoryId,
        input
      );
      expect(response.status).toBe(201);
    }

    const ids = new Set<string>();
    const dates: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await request(app)
        .get(`/api/v1/transactions?limit=2${cursor ? `&cursor=${cursor}` : ""}`)
        .set("authorization", `Bearer ${token}`);
      expect(page.status).toBe(200);
      for (const transaction of page.body.data.items) {
        ids.add(transaction.id);
        dates.push(transaction.date);
      }
      cursor = page.body.data.nextCursor;
    } while (cursor);

    expect(ids.size).toBe(5);
    expect(dates).toEqual([
      "2026-01-05",
      "2026-01-04",
      "2026-01-03",
      "2026-01-02",
      "2026-01-01",
    ]);

    const filtered = await request(app)
      .get(
        `/api/v1/transactions?type=EXPENSE&categoryId=${expenseCategoryId}` +
          "&from=2026-01-02&to=2026-01-05"
      )
      .set("authorization", `Bearer ${token}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.items.map((item: { date: string }) => item.date)).toEqual([
      "2026-01-05",
      "2026-01-03",
      "2026-01-02",
    ]);

    const invalidCursor = await request(app)
      .get("/api/v1/transactions?cursor=not-a-cursor")
      .set("authorization", `Bearer ${token}`);
    expect(invalidCursor.status).toBe(400);
    expect(invalidCursor.body.error.code).toBe("INVALID_CURSOR");

    const zeroAmount = await createTransaction(token, accountId, expenseCategoryId, {
      amount: "0.00",
    });
    expect(zeroAmount.status).toBe(400);
    expect(zeroAmount.body.error.code).toBe("VALIDATION_ERROR");
  });
});
