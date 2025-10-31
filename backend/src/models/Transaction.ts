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

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

@Entity("transactions")
@Index(["userId", "date"])
@Index(["accountId", "date"])
@Index(["categoryId", "date"])
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
  amount: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  fee: number;

  @Column({ type: "date", nullable: false })
  date: Date;

  @Column({ type: "timestamp", nullable: true })
  processedAt?: Date;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  receipt?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringPattern?: string;

  @Column({ type: "date", nullable: true })
  nextOccurrence?: Date;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  accountId: string;

  @Column({ nullable: true })
  categoryId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: "accountId" })
  account: Account;

  @ManyToOne(() => Category, (category) => category.transactions)
  @JoinColumn({ name: "categoryId" })
  category?: Category;
}
