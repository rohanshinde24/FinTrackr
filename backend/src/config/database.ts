import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";
import { User } from "../models/User";
import { Account } from "../models/Account";
import { Transaction } from "../models/Transaction";
import { Category } from "../models/Category";
import { Budget } from "../models/Budget";
import { ImportBatch } from "../models/ImportBatch";

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: "postgres",
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number.parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USER || "fintrackr_user",
        password: process.env.DB_PASSWORD || "fintrackr_password",
        database: process.env.DB_NAME || "fintrackr_db",
      }),
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
  entities: [User, Account, Transaction, Category, Budget, ImportBatch],
  migrations: [join(__dirname, "../migrations/*{.ts,.js}")],
  ssl:
    process.env.DB_SSL === "true" || process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
      : false,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};
