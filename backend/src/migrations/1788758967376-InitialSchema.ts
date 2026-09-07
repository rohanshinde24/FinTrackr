import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1788758967376 implements MigrationInterface {
    name = 'InitialSchema1788758967376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "amount" numeric(15,2) NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "warningThreshold" numeric(5,2) NOT NULL DEFAULT '80', "userId" uuid NOT NULL, "categoryId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_budgets_warning_threshold" CHECK ("warningThreshold" BETWEEN 0 AND 100), CONSTRAINT "CHK_budgets_date_range" CHECK ("endDate" > "startDate"), CONSTRAINT "CHK_budgets_positive_amount" CHECK ("amount" > 0), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7db3d8ec5ccedf747d32a20837" ON "budgets" ("userId", "categoryId", "startDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca58c03face4f6c58cfd45fc3d" ON "budgets" ("userId", "startDate") `);
        await queryRunner.query(`CREATE TYPE "public"."categories_type_enum" AS ENUM('INCOME', 'EXPENSE')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "type" "public"."categories_type_enum" NOT NULL, "color" character varying, "icon" character varying, "isDefault" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', "userId" uuid NOT NULL, "archivedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0c9ff8bc60e0360c85c8141a0c" ON "categories" ("userId", "type") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_categories_active_name" ON "categories" ("userId", "type", lower("name")) WHERE "archivedAt" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."import_batches_status_enum" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "import_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "idempotencyKey" character varying NOT NULL, "originalFilename" character varying NOT NULL, "status" "public"."import_batches_status_enum" NOT NULL DEFAULT 'PROCESSING', "acceptedCount" integer NOT NULL DEFAULT '0', "rejectedCount" integer NOT NULL DEFAULT '0', "duplicateCount" integer NOT NULL DEFAULT '0', "errorSummary" jsonb, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_import_batches_counts" CHECK ("acceptedCount" >= 0 AND "rejectedCount" >= 0 AND "duplicateCount" >= 0), CONSTRAINT "PK_6162597a2576c03e04bb2c1a2dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b896c8a9b9efb20a2f3fe99321" ON "import_batches" ("userId", "idempotencyKey") `);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('INCOME', 'EXPENSE')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'COMPLETED', "amount" numeric(15,2) NOT NULL, "date" date NOT NULL, "notes" character varying, "userId" uuid NOT NULL, "accountId" uuid NOT NULL, "categoryId" uuid, "importBatchId" uuid, "importFingerprint" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_transactions_positive_amount" CHECK ("amount" > 0), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c9d62183154bef401b8d99e871" ON "transactions" ("userId", "importFingerprint") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa2e9c4ecf80dd1204909fd22c" ON "transactions" ("userId", "categoryId", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_641b7d7c8173d3650096b0b5e5" ON "transactions" ("accountId", "date", "id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5c86d658f4c7db999b1386ec3" ON "transactions" ("userId", "date", "id") `);
        await queryRunner.query(`CREATE TYPE "public"."accounts_type_enum" AS ENUM('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "type" "public"."accounts_type_enum" NOT NULL DEFAULT 'CHECKING', "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE', "openingBalance" numeric(15,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'USD', "institution" character varying, "color" character varying, "icon" character varying, "isDefault" boolean NOT NULL DEFAULT false, "userId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_accounts_currency" CHECK ("currency" ~ '^[A-Z]{3}$'), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3aa23c0a6d107393e8b40e3e2a" ON "accounts" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "avatar" character varying, "isEmailVerified" boolean NOT NULL DEFAULT false, "defaultCurrency" character varying NOT NULL DEFAULT 'USD', "language" character varying NOT NULL DEFAULT 'en', "theme" character varying NOT NULL DEFAULT 'light', "preferences" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "CHK_users_default_currency" CHECK ("defaultCurrency" ~ '^[A-Z]{3}$'), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email_lower" ON "users" (lower("email"))`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_3ece6e1292b7a86ba82145775a7" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "import_batches" ADD CONSTRAINT "FK_c5ad7102803c6170805d87c8afa" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_9ad64beff44260ccb82fa1f17f2" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9ad64beff44260ccb82fa1f17f2"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`);
        await queryRunner.query(`ALTER TABLE "import_batches" DROP CONSTRAINT "FK_c5ad7102803c6170805d87c8afa"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_3ece6e1292b7a86ba82145775a7"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_27e688ddf1ff3893b43065899f9"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aa23c0a6d107393e8b40e3e2a"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5c86d658f4c7db999b1386ec3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_641b7d7c8173d3650096b0b5e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa2e9c4ecf80dd1204909fd22c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9d62183154bef401b8d99e871"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b896c8a9b9efb20a2f3fe99321"`);
        await queryRunner.query(`DROP TABLE "import_batches"`);
        await queryRunner.query(`DROP TYPE "public"."import_batches_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c9ff8bc60e0360c85c8141a0c"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca58c03face4f6c58cfd45fc3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7db3d8ec5ccedf747d32a20837"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
    }

}
