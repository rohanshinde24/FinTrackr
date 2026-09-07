import { randomUUID } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import accountRoutes from "./routes/account";
import transactionRoutes from "./routes/transaction";
import categoryRoutes from "./routes/category";
import budgetRoutes from "./routes/budget";
import dashboardRoutes from "./routes/dashboard";
import adminRoutes from "./routes/admin";

type ReadinessCheck = () => Promise<void>;

export interface AppOptions {
  readinessCheck?: ReadinessCheck;
}

const checkDatabaseReadiness: ReadinessCheck = async () => {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database is not initialized");
  }

  await AppDataSource.query("SELECT 1");
};

const registerApiRoutes = (app: express.Express, prefix: string): void => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/accounts`, accountRoutes);
  app.use(`${prefix}/transactions`, transactionRoutes);
  app.use(`${prefix}/categories`, categoryRoutes);
  app.use(`${prefix}/budgets`, budgetRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
};

export const createApp = (options: AppOptions = {}): express.Express => {
  const app = express();
  const readinessCheck = options.readinessCheck ?? checkDatabaseReadiness;

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") || randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });

  const limiter = rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    limit: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan("combined"));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/ready", async (_req, res) => {
    try {
      await readinessCheck();
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database is not ready",
          requestId: res.locals.requestId,
        },
      });
    }
  });

  registerApiRoutes(app, "/api/v1");
  registerApiRoutes(app, "/api");

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.originalUrl} not found`,
        requestId: res.locals.requestId,
      },
    });
  });

  app.use(
    (err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Global error handler:", err);

      res.status(err.status || 500).json({
        success: false,
        error: {
          code: err.status ? "REQUEST_FAILED" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Internal Server Error",
          requestId: res.locals.requestId,
          ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        },
      });
    }
  );

  return app;
};

export default createApp;
