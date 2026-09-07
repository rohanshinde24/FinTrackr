import { Express } from "express";
import request from "supertest";

export const registerTestUser = async (
  app: Express,
  email: string
): Promise<{ token: string; userId: string }> => {
  const response = await request(app).post("/api/v1/auth/register").send({
    email,
    password: "correct-horse-battery-staple",
    firstName: "Test",
    lastName: "User",
  });

  if (response.status !== 201) {
    throw new Error(`Test user registration failed with ${response.status}`);
  }

  return {
    token: response.body.data.token,
    userId: response.body.data.user.id,
  };
};

export const createTestAccount = async (
  app: Express,
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> => {
  const response = await request(app)
    .post("/api/v1/accounts")
    .set("authorization", `Bearer ${token}`)
    .send({
      name: "Test checking",
      type: "CHECKING",
      openingBalance: "0.00",
      currency: "USD",
      ...overrides,
    });

  if (response.status !== 201) {
    throw new Error(`Test account creation failed with ${response.status}`);
  }

  return response.body.data.account.id;
};

export const createTestCategory = async (
  app: Express,
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> => {
  const response = await request(app)
    .post("/api/v1/categories")
    .set("authorization", `Bearer ${token}`)
    .send({
      name: "Test expense",
      type: "EXPENSE",
      ...overrides,
    });

  if (response.status !== 201) {
    throw new Error(`Test category creation failed with ${response.status}`);
  }

  return response.body.data.category.id;
};
