import request from "supertest";
import "./database";
import { createApp } from "../src/app";
import { registerTestUser } from "./helpers";

const app = createApp();

const createCategory = (
  token: string,
  input: Record<string, unknown> = {
    name: "Groceries",
    type: "EXPENSE",
    color: "#22C55E",
    icon: "cart",
  }
) =>
  request(app)
    .post("/api/v1/categories")
    .set("authorization", `Bearer ${token}`)
    .send(input);

describe("v1 categories", () => {
  it("creates, filters, updates, archives, and reuses an archived name", async () => {
    const { token } = await registerTestUser(app, "categories@example.com");
    const expense = await createCategory(token);
    const income = await createCategory(token, { name: "Salary", type: "INCOME" });

    expect(expense.status).toBe(201);
    expect(expense.body.data.category).toMatchObject({
      name: "Groceries",
      type: "EXPENSE",
      color: "#22C55E",
      icon: "cart",
    });
    expect(income.status).toBe(201);

    const expenseList = await request(app)
      .get("/api/v1/categories?type=EXPENSE")
      .set("authorization", `Bearer ${token}`);
    expect(expenseList.status).toBe(200);
    expect(expenseList.body.data.items).toHaveLength(1);

    const categoryId = expense.body.data.category.id;
    const updated = await request(app)
      .patch(`/api/v1/categories/${categoryId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ name: "Food", color: null });
    expect(updated.status).toBe(200);
    expect(updated.body.data.category).toMatchObject({
      id: categoryId,
      name: "Food",
      color: null,
    });

    const archived = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set("authorization", `Bearer ${token}`);
    expect(archived.status).toBe(204);

    const active = await request(app)
      .get("/api/v1/categories")
      .set("authorization", `Bearer ${token}`);
    expect(active.body.data.items.map((category: { name: string }) => category.name)).toEqual([
      "Salary",
    ]);

    const reused = await createCategory(token, { name: "Food", type: "EXPENSE" });
    expect(reused.status).toBe(201);
  });

  it("enforces active-name uniqueness within a user and category type", async () => {
    const { token } = await registerTestUser(app, "duplicates@example.com");
    await createCategory(token);

    const duplicate = await createCategory(token, {
      name: "groceries",
      type: "EXPENSE",
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("CATEGORY_ALREADY_EXISTS");

    const otherType = await createCategory(token, {
      name: "Groceries",
      type: "INCOME",
    });
    expect(otherType.status).toBe(201);
  });

  it("hides another user's valid category UUID", async () => {
    const alex = await registerTestUser(app, "category-alex@example.com");
    const sam = await registerTestUser(app, "category-sam@example.com");
    const created = await createCategory(sam.token);
    const categoryId = created.body.data.category.id;

    for (const operation of [
      request(app).patch(`/api/v1/categories/${categoryId}`).send({ name: "Stolen" }),
      request(app).delete(`/api/v1/categories/${categoryId}`),
    ]) {
      const response = await operation.set("authorization", `Bearer ${alex.token}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("CATEGORY_NOT_FOUND");
    }
  });

  it("rejects invalid and unsupported fields", async () => {
    const { token } = await registerTestUser(app, "category-validation@example.com");
    const response = await createCategory(token, {
      name: "Groceries",
      type: "EXPENSE",
      color: "green",
      userId: "not-client-controlled",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
