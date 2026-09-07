import request from "supertest";
import "./database";
import { createApp } from "../src/app";
import { AppDataSource } from "../src/config/database";
import { Transaction, TransactionStatus, TransactionType } from "../src/models/Transaction";
import { registerTestUser } from "./helpers";

const app = createApp();
const accountInput = {
  name: "Primary checking",
  institution: "Example Credit Union",
  type: "CHECKING",
  openingBalance: "1000.00",
  currency: "USD",
};

describe("v1 accounts", () => {
  it("creates, lists, reads, and updates an owned account", async () => {
    const { token } = await registerTestUser(app, "alex@example.com");

    const created = await request(app)
      .post("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`)
      .send(accountInput);

    expect(created.status).toBe(201);
    expect(created.body.data.account).toMatchObject({
      ...accountInput,
      status: "ACTIVE",
      currentBalance: "1000.00",
    });

    const accountId = created.body.data.account.id;
    const listed = await request(app)
      .get("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`);
    expect(listed.body.data.items).toHaveLength(1);

    const fetched = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.account.id).toBe(accountId);

    const updated = await request(app)
      .patch(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "Household checking", status: "INACTIVE" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.account).toMatchObject({
      id: accountId,
      name: "Household checking",
      status: "INACTIVE",
    });

    const deleted = await request(app)
      .delete(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const emptyList = await request(app)
      .get("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`);
    expect(emptyList.body.data.items).toEqual([]);
  });

  it("derives current balance from completed transactions", async () => {
    const { token, userId } = await registerTestUser(app, "balance@example.com");
    const created = await request(app)
      .post("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`)
      .send(accountInput);
    const accountId = created.body.data.account.id;

    const transactionRepository = AppDataSource.getRepository(Transaction);
    await transactionRepository.save([
      transactionRepository.create({
        userId,
        accountId,
        description: "Paycheck",
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        amount: "500.00",
        date: new Date("2026-09-01"),
      }),
      transactionRepository.create({
        userId,
        accountId,
        description: "Groceries",
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        amount: "1625.25",
        date: new Date("2026-09-02"),
      }),
      transactionRepository.create({
        userId,
        accountId,
        description: "Pending purchase",
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        amount: "900.00",
        date: new Date("2026-09-03"),
      }),
    ]);

    const response = await request(app)
      .get(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.account.currentBalance).toBe("-125.25");
  });

  it("hides another user's valid account UUID", async () => {
    const alex = await registerTestUser(app, "alex@example.com");
    const sam = await registerTestUser(app, "sam@example.com");
    const created = await request(app)
      .post("/api/v1/accounts")
      .set("authorization", `Bearer ${sam.token}`)
      .send(accountInput);
    const samAccountId = created.body.data.account.id;

    for (const operation of [
      request(app).get(`/api/v1/accounts/${samAccountId}`),
      request(app).patch(`/api/v1/accounts/${samAccountId}`).send({ name: "Stolen" }),
      request(app).delete(`/api/v1/accounts/${samAccountId}`),
    ]) {
      const response = await operation.set("authorization", `Bearer ${alex.token}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("ACCOUNT_NOT_FOUND");
    }
  });

  it("rejects invalid input and deletion of an account with history", async () => {
    const { token, userId } = await registerTestUser(app, "history@example.com");
    const invalid = await request(app)
      .post("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`)
      .send({ ...accountInput, currency: "US", openingBalance: "12.345" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");

    const created = await request(app)
      .post("/api/v1/accounts")
      .set("authorization", `Bearer ${token}`)
      .send(accountInput);
    const accountId = created.body.data.account.id;
    await AppDataSource.getRepository(Transaction).save({
      userId,
      accountId,
      description: "History",
      type: TransactionType.EXPENSE,
      amount: "1.00",
      date: new Date("2026-09-01"),
    });

    const response = await request(app)
      .delete(`/api/v1/accounts/${accountId}`)
      .set("authorization", `Bearer ${token}`);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ACCOUNT_HAS_TRANSACTIONS");
  });
});
