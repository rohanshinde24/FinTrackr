import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Transaction } from "./Transaction";
import { Budget } from "./Budget";

export enum CategoryType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

@Entity("categories")
@Index(["userId", "type"])
@Index("UQ_categories_active_name", { synchronize: false })
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "enum", enum: CategoryType, nullable: false })
  type: CategoryType;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: false })
  userId: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  archivedAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];

  @OneToMany(() => Budget, (budget) => budget.category)
  budgets: Budget[];
}
