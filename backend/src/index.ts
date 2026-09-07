import "reflect-metadata";
import { Server } from "http";
import { config } from "dotenv";
import { createApp } from "./app";
import { AppDataSource, initializeDatabase } from "./config/database";

// Load environment variables
config();

const PORT = Number.parseInt(process.env.PORT || "3001", 10);

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

export const startServer = async (): Promise<Server> => {
  await initializeDatabase();

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`FinTrackr API listening on port ${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down`);

    try {
      await closeServer(server);
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exitCode = 0;
    } catch (error) {
      console.error("Graceful shutdown failed:", error);
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));

  return server;
};

void startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
