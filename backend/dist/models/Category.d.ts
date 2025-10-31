import { User } from "./User";
import { Transaction } from "./Transaction";
import { Budget } from "./Budget";
export declare enum CategoryType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
    TRANSFER = "TRANSFER"
}
export declare class Category {
    id: string;
    name: string;
    description?: string;
    type: CategoryType;
    color?: string;
    icon?: string;
    isDefault: boolean;
    sortOrder: number;
    metadata?: Record<string, any>;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    transactions: Transaction[];
    budgets: Budget[];
}
