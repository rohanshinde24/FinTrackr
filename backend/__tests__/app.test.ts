import request from "supertest";
import { createApp } from "../src/app";

describe("operational endpoints", () => {
  it("reports process health without checking dependencies", async () => {
    const readinessCheck = jest.fn();
    const response = await request(createApp({ readinessCheck })).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(readinessCheck).not.toHaveBeenCalled();
  });

  it("reports readiness after the database check succeeds", async () => {
    const readinessCheck = jest.fn().mockResolvedValue(undefined);
    const response = await request(createApp({ readinessCheck })).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(readinessCheck).toHaveBeenCalledTimes(1);
  });

  it("returns a correlated error when the database is unavailable", async () => {
    const readinessCheck = jest.fn().mockRejectedValue(new Error("connection refused"));
    const response = await request(createApp({ readinessCheck }))
      .get("/ready")
      .set("x-request-id", "readiness-test");

    expect(response.status).toBe(503);
    expect(response.headers["x-request-id"]).toBe("readiness-test");
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database is not ready",
        requestId: "readiness-test",
      },
    });
  });

  it("returns the standard error envelope for unknown routes", async () => {
    const response = await request(createApp()).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route /does-not-exist not found",
        requestId: response.headers["x-request-id"],
      },
    });
  });
});
