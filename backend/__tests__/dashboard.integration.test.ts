import request from "supertest";
import "./database";
import { createApp } from "../src/app";
import { createTestAccount, createTestCategory, registerTestUser } from "./helpers";

const app = createApp();

const addTransaction = (
  token: string,
  accountId: string,
  categoryId: string,
  input: { type: "INCOME" | "EXPENSE"; amount: string; date: string; description: string }
) =>
  request(app)
    .post("/api/v1/transactions")
    .set("authorization", `Bearer ${token}`)
    .send({ accountId, categoryId, ...input });

describe("v1 dashboard overview", () => {
  it("reconciles balances, monthly totals, categories, budgets, and trends", async () => {
    const user = await registerTestUser(app, "dashboard@example.com");
    const otherUser = await registerTestUser(app, "dashboard-other@example.com");
    const checkingId = await createTestAccount(app, user.token, {
      name: "Checking",
      openingBalance: "100.00",
    });
    await createTestAccount(app, user.token, {
      name: "Savings",
      openingBalance: "50.00",
    });
    const otherAccountId = await createTestAccount(app, otherUser.token, {
      openingBalance: "9999.00",
    });

    const incomeCategoryId = await createTestCategory(app, user.token, {
      name: "Salary",
      type: "INCOME",
    });
    const foodCategoryId = await createTestCategory(app, user.token, {
      name: "Food",
    });
    const rentCategoryId = await createTestCategory(app, user.token, {
      name: "Rent",
    });
    const otherCategoryId = await createTestCategory(app, otherUser.token);

    for (const transaction of [
      {
        categoryId: incomeCategoryId,
        type: "INCOME" as const,
        amount: "1000.00",
        date: "2026-08-31",
        description: "August salary",
      },
      {
        categoryId: incomeCategoryId,
        type: "INCOME" as const,
        amount: "500.00",
        date: "2026-09-01",
        description: "September income",
      },
      {
        categoryId: foodCategoryId,
        type: "EXPENSE" as const,
        amount: "125.25",
        date: "2026-09-10",
        description: "Groceries",
      },
      {
        categoryId: rentCategoryId,
        type: "EXPENSE" as const,
        amount: "200.00",
        date: "2026-09-02",
        description: "Rent",
      },
      {
        categoryId: incomeCategoryId,
        type: "INCOME" as const,
        amount: "400.00",
        date: "2026-10-01",
        description: "Future income",
      },
    ]) {
      expect(
        (
          await addTransaction(user.token, checkingId, transaction.categoryId, transaction)
        ).status
      ).toBe(201);
    }

    const pending = await addTransaction(user.token, checkingId, foodCategoryId, {
      type: "EXPENSE",
      amount: "900.00",
      date: "2026-09-11",
      description: "Pending expense",
    });
    await request(app)
      .patch(`/api/v1/transactions/${pending.body.data.transaction.id}`)
      .set("authorization", `Bearer ${user.token}`)
      .send({ status: "PENDING" });

    await addTransaction(otherUser.token, otherAccountId, otherCategoryId, {
      type: "EXPENSE",
      amount: "5000.00",
      date: "2026-09-01",
      description: "Other user's expense",
    });

    await request(app)
      .post("/api/v1/budgets")
      .set("authorization", `Bearer ${user.token}`)
      .send({
        categoryId: foodCategoryId,
        name: "Food budget",
        amount: "200.00",
        month: "2026-09",
      });

    const response = await request(app)
      .get("/api/v1/dashboard/overview?month=2026-09")
      .set("authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      month: "2026-09",
      totalBalance: "1324.75",
      monthlyIncome: "500.00",
      monthlyExpenses: "325.25",
      netIncome: "174.75",
    });
    expect(response.body.data.categorySpending).toEqual([
      { categoryId: rentCategoryId, name: "Rent", total: "200.00" },
      { categoryId: foodCategoryId, name: "Food", total: "125.25" },
    ]);
    expect(response.body.data.budgetProgress[0]).toMatchObject({
      categoryId: foodCategoryId,
      spent: "125.25",
      remaining: "74.75",
      percentage: 62.63,
    });
    expect(response.body.data.monthlyTrend).toEqual([
      { month: "2026-04", income: "0.00", expenses: "0.00", net: "0.00" },
      { month: "2026-05", income: "0.00", expenses: "0.00", net: "0.00" },
      { month: "2026-06", income: "0.00", expenses: "0.00", net: "0.00" },
      { month: "2026-07", income: "0.00", expenses: "0.00", net: "0.00" },
      { month: "2026-08", income: "1000.00", expenses: "0.00", net: "1000.00" },
      { month: "2026-09", income: "500.00", expenses: "325.25", net: "174.75" },
    ]);
  });

  it("rejects invalid reporting months", async () => {
    const { token } = await registerTestUser(app, "dashboard-validation@example.com");
    const response = await request(app)
      .get("/api/v1/dashboard/overview?month=2026-00")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
