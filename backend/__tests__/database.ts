import { AppDataSource } from "../src/config/database";

process.env.JWT_SECRET = "integration-test-secret-at-least-32-characters";

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.synchronize(true);
});

afterEach(async () => {
  const tableNames = AppDataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(", ");

  if (tableNames) {
    await AppDataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
