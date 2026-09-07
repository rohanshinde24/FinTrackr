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
