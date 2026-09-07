import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { Account } from "./Account";
import { Category } from "./Category";
import { ImportBatch } from "./ImportBatch";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("transactions")
@Index(["userId", "date", "id"])
@Index(["accountId", "date", "id"])
@Index(["userId", "categoryId", "date"])
@Index(["userId", "importFingerprint"], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  description: string;

  @Column({ type: "enum", enum: TransactionType, nullable: false })
  type: TransactionType;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: false })
  amount: string;

  @Column({ type: "date", nullable: false })
  date: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  accountId: string;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({ nullable: true })
  importBatchId?: string;

  @Column({ nullable: true })
  importFingerprint?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Account, (account) => account.transactions, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "accountId" })
  account: Account;

  @ManyToOne(() => Category, (category) => category.transactions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category?: Category;

  @ManyToOne(() => ImportBatch, (importBatch) => importBatch.transactions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "importBatchId" })
  importBatch?: ImportBatch;
}
