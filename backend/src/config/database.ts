import { DataSource } from "typeorm";
import { config } from "dotenv";
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
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "fintrackr_user",
  password: process.env.DB_PASSWORD || "fintrackr_password",
  database: process.env.DB_NAME || "fintrackr_db",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Account, Transaction, Category, Budget, ImportBatch],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
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
