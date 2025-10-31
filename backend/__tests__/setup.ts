import { DataSource } from "typeorm";

// Test database configuration
export const testDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "fintrackr_test",
  synchronize: true,
  dropSchema: true,
  entities: ["src/models/**/*.ts"],
  logging: false,
});

// Setup before all tests
beforeAll(async () => {
  await testDataSource.initialize();
});

// Cleanup after all tests
afterAll(async () => {
  await testDataSource.destroy();
});

// Clean up between tests
afterEach(async () => {
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
});

