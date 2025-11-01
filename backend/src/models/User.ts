import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Account } from "./Account";
import { Transaction } from "./Transaction";
import { Budget } from "./Budget";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: "USD" })
  defaultCurrency: string;

  @Column({ default: "en" })
  language: string;

  @Column({ default: "light" })
  theme: string;

  @Column({ type: "jsonb", nullable: true })
  preferences?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];
}
