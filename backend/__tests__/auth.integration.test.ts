import request from "supertest";
import "./database";
import { createApp } from "../src/app";

const app = createApp();
const validRegistration = {
  email: "alex@example.com",
  password: "correct-horse-battery-staple",
  firstName: "Alex",
  lastName: "Morgan",
};

describe("v1 authentication", () => {
  it("registers, signs in, and returns a password-free profile", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send(validRegistration);

    expect(registration.status).toBe(201);
    expect(registration.body.data.user).toMatchObject({
      email: "alex@example.com",
      firstName: "Alex",
      lastName: "Morgan",
      role: "USER",
      defaultCurrency: "USD",
    });
    expect(registration.body.data.user).not.toHaveProperty("password");
    expect(registration.body.data.token).toEqual(expect.any(String));

    const login = await request(app).post("/api/v1/auth/login").send({
      email: validRegistration.email,
      password: validRegistration.password,
    });

    expect(login.status).toBe(200);
    const profile = await request(app)
      .get("/api/v1/auth/profile")
      .set("authorization", `Bearer ${login.body.data.token}`);

    expect(profile.status).toBe(200);
    expect(profile.body.data.user.email).toBe(validRegistration.email);
    expect(profile.body.data.user).not.toHaveProperty("password");
  });

  it("returns the standard validation error envelope", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "not-an-email",
      password: "short",
      firstName: "",
      lastName: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        requestId: response.headers["x-request-id"],
      },
    });
    expect(response.body.error.details).toHaveLength(4);
  });

  it("does not reveal whether an email exists during login", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "missing@example.com",
      password: "not-the-right-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
      requestId: response.headers["x-request-id"],
    });
  });

  it("rejects requests without a bearer token", async () => {
    const response = await request(app).get("/api/v1/auth/profile");

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
      message: "A valid bearer token is required",
      requestId: response.headers["x-request-id"],
    });
  });
});
