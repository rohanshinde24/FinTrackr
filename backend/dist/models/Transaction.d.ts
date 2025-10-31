import { User } from "./User";
import { Account } from "./Account";
import { Category } from "./Category";
export declare enum TransactionType {
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
    TRANSFER = "TRANSFER",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export declare class Transaction {
    id: string;
    description: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    fee: number;
    date: Date;
    processedAt?: Date;
    reference?: string;
    notes?: string;
    location?: string;
    receipt?: string;
    metadata?: Record<string, any>;
    isRecurring: boolean;
    recurringPattern?: string;
    nextOccurrence?: Date;
    userId: string;
    accountId: string;
    categoryId?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    account: Account;
    category?: Category;
}
