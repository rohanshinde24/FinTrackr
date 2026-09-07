import { loadRuntimeEnvironment } from "../src/config/environment";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("runtime environment", () => {
  it("uses the documented default port", () => {
    delete process.env.PORT;
    process.env.NODE_ENV = "development";

    expect(loadRuntimeEnvironment()).toEqual({ port: 3001 });
  });

  it("rejects an invalid port", () => {
    process.env.PORT = "70000";

    expect(() => loadRuntimeEnvironment()).toThrow(
      "PORT must be an integer between 1 and 65535"
    );
  });

  it("requires production secrets and a database endpoint", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;

    expect(() => loadRuntimeEnvironment()).toThrow(
      "JWT_SECRET must be at least 32 characters in production"
    );

    process.env.JWT_SECRET = "a-production-secret-with-32-characters";
    expect(() => loadRuntimeEnvironment()).toThrow(
      "DATABASE_URL or DB_HOST is required in production"
    );
  });

  it("accepts a complete production environment", () => {
    process.env.NODE_ENV = "production";
    process.env.PORT = "8080";
    process.env.JWT_SECRET = "a-production-secret-with-32-characters";
    process.env.DATABASE_URL = "postgresql://user:password@database.example/fintrackr";

    expect(loadRuntimeEnvironment()).toEqual({ port: 8080 });
  });
});
