import request from "supertest";
import "./database";
import { createApp } from "../src/app";
import { createTestAccount, createTestCategory, registerTestUser } from "./helpers";

const app = createApp();

const createBudget = (
  token: string,
  categoryId: string,
  overrides: Record<string, unknown> = {}
) =>
  request(app)
    .post("/api/v1/budgets")
    .set("authorization", `Bearer ${token}`)
    .send({
      categoryId,
      name: "Food budget",
      amount: "200.00",
      month: "2026-09",
      ...overrides,
    });

describe("v1 budgets", () => {
  it("creates, calculates, updates, and deletes a monthly budget", async () => {
    const { token } = await registerTestUser(app, "budgets@example.com");
    const accountId = await createTestAccount(app, token);
    const categoryId = await createTestCategory(app, token);
    const created = await createBudget(token, categoryId);

    expect(created.status).toBe(201);
    expect(created.body.data.budget).toMatchObject({
      categoryId,
      amount: "200.00",
      month: "2026-09",
      spent: "0.00",
      remaining: "200.00",
      percentage: 0,
    });

    await request(app)
      .post("/api/v1/transactions")
      .set("authorization", `Bearer ${token}`)
      .send({
        accountId,
        categoryId,
        description: "Groceries",
        type: "EXPENSE",
        amount: "50.00",
        date: "2026-09-10",
      });

    const pending = await request(app)
      .post("/api/v1/transactions")
      .set("authorization", `Bearer ${token}`)
      .send({
        accountId,
        categoryId,
        description: "Pending groceries",
        type: "EXPENSE",
        amount: "100.00",
        date: "2026-09-11",
      });
    await request(app)
      .patch(`/api/v1/transactions/${pending.body.data.transaction.id}`)
      .set("authorization", `Bearer ${token}`)
      .send({ status: "PENDING" });

    const listed = await request(app)
      .get("/api/v1/budgets?month=2026-09")
      .set("authorization", `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data.items[0]).toMatchObject({
      spent: "50.00",
      remaining: "150.00",
      percentage: 25,
    });

    const budgetId = created.body.data.budget.id;
    const updated = await request(app)
      .patch(`/api/v1/budgets/${budgetId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "Groceries budget", amount: "100.00" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.budget).toMatchObject({
      name: "Groceries budget",
      amount: "100.00",
      spent: "50.00",
      remaining: "50.00",
      percentage: 50,
    });

    const deleted = await request(app)
      .delete(`/api/v1/budgets/${budgetId}`)
      .set("authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const empty = await request(app)
      .get("/api/v1/budgets?month=2026-09")
      .set("authorization", `Bearer ${token}`);
    expect(empty.body.data.items).toEqual([]);
  });

  it("requires an owned expense category and one budget per category-month", async () => {
    const alex = await registerTestUser(app, "budget-rules@example.com");
    const sam = await registerTestUser(app, "budget-owner@example.com");
    const expenseCategoryId = await createTestCategory(app, alex.token);
    const incomeCategoryId = await createTestCategory(app, alex.token, {
      name: "Salary",
      type: "INCOME",
    });
    const samCategoryId = await createTestCategory(app, sam.token);

    const incomeBudget = await createBudget(alex.token, incomeCategoryId);
    expect(incomeBudget.status).toBe(409);
    expect(incomeBudget.body.error.code).toBe("BUDGET_REQUIRES_EXPENSE_CATEGORY");

    const otherUser = await createBudget(alex.token, samCategoryId);
    expect(otherUser.status).toBe(404);
    expect(otherUser.body.error.code).toBe("CATEGORY_NOT_FOUND");

    expect((await createBudget(alex.token, expenseCategoryId)).status).toBe(201);
    const duplicate = await createBudget(alex.token, expenseCategoryId);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("BUDGET_ALREADY_EXISTS");

    const nextMonth = await createBudget(alex.token, expenseCategoryId, {
      month: "2026-10",
    });
    expect(nextMonth.status).toBe(201);
  });

  it("hides another user's valid budget UUID", async () => {
    const alex = await registerTestUser(app, "budget-alex@example.com");
    const sam = await registerTestUser(app, "budget-sam@example.com");
    const categoryId = await createTestCategory(app, sam.token);
    const created = await createBudget(sam.token, categoryId);
    const budgetId = created.body.data.budget.id;

    for (const operation of [
      request(app).patch(`/api/v1/budgets/${budgetId}`).send({ amount: "10.00" }),
      request(app).delete(`/api/v1/budgets/${budgetId}`),
    ]) {
      const response = await operation.set("authorization", `Bearer ${alex.token}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("BUDGET_NOT_FOUND");
    }
  });

  it("rejects invalid month, amount, and threshold values", async () => {
    const { token } = await registerTestUser(app, "budget-validation@example.com");
    const categoryId = await createTestCategory(app, token);

    for (const input of [
      { amount: "0.00" },
      { month: "2026-13" },
      { warningThreshold: 101 },
    ]) {
      const response = await createBudget(token, categoryId, input);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }
  });
});
