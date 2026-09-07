import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Transaction } from "./Transaction";
import { User } from "./User";

export enum ImportBatchStatus {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

@Entity("import_batches")
@Index(["userId", "idempotencyKey"], { unique: true })
export class ImportBatch {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  idempotencyKey: string;

  @Column({ nullable: false })
  originalFilename: string;

  @Column({ type: "enum", enum: ImportBatchStatus, default: ImportBatchStatus.PROCESSING })
  status: ImportBatchStatus;

  @Column({ default: 0 })
  acceptedCount: number;

  @Column({ default: 0 })
  rejectedCount: number;

  @Column({ default: 0 })
  duplicateCount: number;

  @Column({ type: "jsonb", nullable: true })
  errorSummary?: Array<{ row: number; message: string }>;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  completedAt?: Date;

  @ManyToOne(() => User, (user) => user.importBatches, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.importBatch)
  transactions: Transaction[];
}
