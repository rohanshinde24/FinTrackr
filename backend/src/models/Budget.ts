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
import { Category } from "./Category";

@Entity("budgets")
@Index(["userId", "startDate"])
@Index(["userId", "categoryId", "startDate"], { unique: true })
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: false })
  amount: string;

  @Column({ type: "date", nullable: false })
  startDate: Date;

  @Column({ type: "date", nullable: false })
  endDate: Date;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 80 })
  warningThreshold: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  categoryId: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.budgets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Category, (category) => category.budgets, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "categoryId" })
  category: Category;
}
