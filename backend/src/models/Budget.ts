import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

export enum BudgetPeriod {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export enum BudgetStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  OVERDUE = "OVERDUE",
}

@Entity("budgets")
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: false })
  amount: number;

  @Column({ type: "enum", enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod;

  @Column({ type: "enum", enum: BudgetStatus, default: BudgetStatus.ACTIVE })
  status: BudgetStatus;

  @Column({ type: "date", nullable: false })
  startDate: Date;

  @Column({ type: "date", nullable: true })
  endDate?: Date;

  @Column({ type: "date", nullable: true })
  lastResetDate?: Date;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  spent: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  remaining: number;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ default: true })
  sendNotifications: boolean;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 80 })
  warningThreshold: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 95 })
  criticalThreshold: number;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: true })
  categoryId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.budgets)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Category, (category) => category.budgets)
  @JoinColumn({ name: "categoryId" })
  category?: Category;
}
