export interface RuntimeEnvironment {
  port: number;
}

export const loadRuntimeEnvironment = (): RuntimeEnvironment => {
  const port = Number.parseInt(process.env.PORT || "3001", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }

    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      throw new Error("DATABASE_URL or DB_HOST is required in production");
    }
  }

  return { port };
};
